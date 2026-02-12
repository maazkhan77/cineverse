import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

/**
 * User Ratings System
 * - Store user ratings (1-10 scale)
 * - Calculate community averages
 * - Support reviews
 */

// Rate a movie or TV show
export const rateContent = mutation({
  args: {
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    rating: v.number(), // 1-10
    review: v.optional(v.string()),
  },
  handler: async (ctx, { tmdbId, mediaType, rating, review }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to rate content");
    }

    // Validate rating range
    if (rating < 1 || rating > 10) {
      throw new Error("Rating must be between 1 and 10");
    }

    const now = Date.now();

    // Check if user already rated this content
    const existingRating = await ctx.db
      .query("userRatings")
      .withIndex("by_user_and_content", (q) =>
        q.eq("userId", userId).eq("tmdbId", tmdbId).eq("mediaType", mediaType)
      )
      .first();

    if (existingRating) {
      // Update existing rating
      await ctx.db.patch(existingRating._id, {
        rating,
        review,
        updatedAt: now,
      });
    } else {
      // Create new rating
      await ctx.db.insert("userRatings", {
        userId,
        tmdbId,
        mediaType,
        rating,
        review,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Update aggregate
    await updateAggregateRating(ctx, tmdbId, mediaType);
  },
});

// Get user's rating for specific content
export const getUserRating = query({
  args: {
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
  },
  handler: async (ctx, { tmdbId, mediaType }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return ctx.db
      .query("userRatings")
      .withIndex("by_user_and_content", (q) =>
        q.eq("userId", userId).eq("tmdbId", tmdbId).eq("mediaType", mediaType)
      )
      .first();
  },
});

// Get community rating for content
export const getCommunityRating = query({
  args: {
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
  },
  handler: async (ctx, { tmdbId, mediaType }) => {
    // Try to get cached aggregate
    const cached = await ctx.db
      .query("communityRatings")
      .withIndex("by_content", (q) =>
        q.eq("tmdbId", tmdbId).eq("mediaType", mediaType)
      )
      .first();

    if (cached) {
      return {
        average: cached.averageRating,
        total: cached.totalRatings,
        distribution: cached.distribution,
      };
    }

    // Default if no ratings yet
    return {
      average: 0,
      total: 0,
      distribution: null,
    };
  },
});

// Get all ratings for a user (for profile page)
export const getUserRatings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return ctx.db
      .query("userRatings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});
// TODO: Convex doesn't support .count() — .collect().length loads all docs.
// For better perf at scale, maintain a separate counter document.
export const getUserRatingsCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return 0;
    }

    const ratings = await ctx.db
      .query("userRatings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
      
    return ratings.length;
  },
});

// Get recent reviews for content (with user info)
export const getContentReviews = query({
  args: {
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { tmdbId, mediaType, limit = 10 }) => {
    const ratings = await ctx.db
      .query("userRatings")
      .withIndex("by_content", (q) =>
        q.eq("tmdbId", tmdbId).eq("mediaType", mediaType)
      )
      .order("desc")
      .take(limit);

    // Filter to only those with reviews and enrich with user info
    const enrichedReviews = await Promise.all(
      ratings
        .filter((r) => r.review)
        .map(async (rating) => {
          // Try to get profile first
          const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_user", (q) => q.eq("userId", rating.userId))
            .first();
            
          const user = await ctx.db.get(rating.userId);
          
          return {
            ...rating,
            userName: profile?.displayName || user?.name || "Anonymous",
            userImage: profile?.avatarUrl || user?.image || null,
          };
        })
    );

    return enrichedReviews;
  },
});

// Delete a rating
export const deleteRating = mutation({
  args: {
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
  },
  handler: async (ctx, { tmdbId, mediaType }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const rating = await ctx.db
      .query("userRatings")
      .withIndex("by_user_and_content", (q) =>
        q.eq("userId", userId).eq("tmdbId", tmdbId).eq("mediaType", mediaType)
      )
      .first();

    if (rating) {
      await ctx.db.delete(rating._id);
      await updateAggregateRating(ctx, tmdbId, mediaType);
    }
  },
});

// Internal helper to update community rating aggregates
async function updateAggregateRating(ctx: any, tmdbId: number, mediaType: "movie" | "tv") {
  const ratings = await ctx.db
    .query("userRatings")
    .withIndex("by_content", (q: any) =>
      q.eq("tmdbId", tmdbId).eq("mediaType", mediaType)
    )
    .collect();

  if (ratings.length === 0) {
    // Remove aggregate if no ratings left
    const existing = await ctx.db
      .query("communityRatings")
      .withIndex("by_content", (q: any) =>
        q.eq("tmdbId", tmdbId).eq("mediaType", mediaType)
      )
      .first();
      
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return;
  }

  const sum = ratings.reduce((acc: number, r: any) => acc + r.rating, 0);
  const average = sum / ratings.length;
  
  // Calculate distribution
  const distribution = {
    rating1: 0, rating2: 0, rating3: 0, rating4: 0, rating5: 0,
    rating6: 0, rating7: 0, rating8: 0, rating9: 0, rating10: 0,
  };
  
  ratings.forEach((r: any) => {
    const key = `rating${r.rating}` as keyof typeof distribution;
    if (distribution[key] !== undefined) {
      distribution[key]++;
    }
  });

  const existing = await ctx.db
    .query("communityRatings")
    .withIndex("by_content", (q: any) =>
      q.eq("tmdbId", tmdbId).eq("mediaType", mediaType)
    )
    .first();

  const data = {
    tmdbId,
    mediaType,
    averageRating: Math.round(average * 10) / 10,
    totalRatings: ratings.length,
    distribution,
    lastUpdated: Date.now(),
  };

  if (existing) {
    await ctx.db.patch(existing._id, {
      averageRating: data.averageRating,
      totalRatings: data.totalRatings,
      distribution: data.distribution,
      lastUpdated: data.lastUpdated,
    });
  } else {
    await ctx.db.insert("communityRatings", data);
  }
}
