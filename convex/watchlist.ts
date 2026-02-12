import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const add = mutation({
  args: {
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    title: v.string(),
    posterPath: v.optional(v.string()),
    voteAverage: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if already in watchlist
    const existing = await ctx.db
      .query("watchlist")
      .withIndex("by_user_and_tmdb", (q) =>
        q.eq("userId", userId).eq("tmdbId", args.tmdbId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    return ctx.db.insert("watchlist", {
      userId,
      tmdbId: args.tmdbId,
      mediaType: args.mediaType,
      title: args.title,
      posterPath: args.posterPath,
      voteAverage: args.voteAverage,
      addedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    tmdbId: v.number(),
  },
  handler: async (ctx, { tmdbId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const item = await ctx.db
      .query("watchlist")
      .withIndex("by_user_and_tmdb", (q) =>
        q.eq("userId", userId).eq("tmdbId", tmdbId)
      )
      .first();

    if (item) {
      await ctx.db.delete(item._id);
    }

    return item?._id;
  },
});

export const list = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return ctx.db
      .query("watchlist")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const isInWatchlist = query({
  args: {
    tmdbId: v.number(),
  },
  handler: async (ctx, { tmdbId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }

    const item = await ctx.db
      .query("watchlist")
      .withIndex("by_user_and_tmdb", (q) =>
        q.eq("userId", userId).eq("tmdbId", tmdbId)
      )
      .first();

    return !!item;
  },
});

// TODO: Convex doesn't support .count() — .collect().length loads all docs.
// For better perf at scale, maintain a separate counter document.
export const getWatchlistCount = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return 0;
    }

    const items = await ctx.db
      .query("watchlist")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
      
    return items.length;
  },
});

