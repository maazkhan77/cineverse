import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Cache Queries and Mutations (non-Node.js)
 */

// Query to get from cache
export const getFromCache = query({
  args: {
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
  },
  handler: async (ctx, { tmdbId, mediaType }) => {
    return ctx.db
      .query("contentCache")
      .withIndex("by_content", (q) =>
        q.eq("tmdbId", tmdbId).eq("mediaType", mediaType)
      )
      .first();
  },
});

// Mutation to update cache
export const updateCache = mutation({
  args: {
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    imdbId: v.optional(v.string()),
    enrichedData: v.optional(v.object({
      rottenTomatoes: v.optional(v.number()),
      metacritic: v.optional(v.number()),
      imdbRating: v.optional(v.number()),
      awards: v.optional(v.string()),
      boxOffice: v.optional(v.string()),
      rated: v.optional(v.string()),
      runtime: v.optional(v.string()),
      plot: v.optional(v.string()),
    })),
    trailerKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { tmdbId, mediaType, ...data } = args;
    
    const existing = await ctx.db
      .query("contentCache")
      .withIndex("by_content", (q) =>
        q.eq("tmdbId", tmdbId).eq("mediaType", mediaType)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...data,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("contentCache", {
        tmdbId,
        mediaType,
        ...data,
        lastUpdated: Date.now(),
      });
    }
  },
});

// Clear old cache entries
export const clearExpiredCache = mutation({
  args: { maxAgeDays: v.optional(v.number()) },
  handler: async (ctx, { maxAgeDays = 7 }) => {
    const allCache = await ctx.db.query("contentCache").collect();
    const now = Date.now();
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    let cleared = 0;

    for (const entry of allCache) {
      if (now - entry.lastUpdated > maxAgeMs) {
        await ctx.db.delete(entry._id);
        cleared++;
      }
    }

    return { cleared };
  },
});
