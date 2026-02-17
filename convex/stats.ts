import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Content Statistics
 * - Track views, watchlist adds, search hits
 * - Power "Trending on Canima" features
 */

// Increment view count (called when detail page is viewed)
export const trackView = mutation({
  args: {
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
  },
  handler: async (ctx, { tmdbId, mediaType }) => {
    const existing = await ctx.db
      .query("contentStats")
      .withIndex("by_content", (q) =>
        q.eq("tmdbId", tmdbId).eq("mediaType", mediaType)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        views: existing.views + 1,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("contentStats", {
        tmdbId,
        mediaType,
        views: 1,
        watchlistAdds: 0,
        searchHits: 0,
        lastUpdated: Date.now(),
      });
    }
  },
});

// Increment watchlist add count
export const trackWatchlistAdd = mutation({
  args: {
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
  },
  handler: async (ctx, { tmdbId, mediaType }) => {
    const existing = await ctx.db
      .query("contentStats")
      .withIndex("by_content", (q) =>
        q.eq("tmdbId", tmdbId).eq("mediaType", mediaType)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        watchlistAdds: existing.watchlistAdds + 1,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("contentStats", {
        tmdbId,
        mediaType,
        views: 0,
        watchlistAdds: 1,
        searchHits: 0,
        lastUpdated: Date.now(),
      });
    }
  },
});

// Increment search hit count
export const trackSearchHit = mutation({
  args: {
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
  },
  handler: async (ctx, { tmdbId, mediaType }) => {
    const existing = await ctx.db
      .query("contentStats")
      .withIndex("by_content", (q) =>
        q.eq("tmdbId", tmdbId).eq("mediaType", mediaType)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        searchHits: existing.searchHits + 1,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("contentStats", {
        tmdbId,
        mediaType,
        views: 0,
        watchlistAdds: 0,
        searchHits: 1,
        lastUpdated: Date.now(),
      });
    }
  },
});

// Get trending content (most viewed recently)
// Note: Convex doesn't support ordering by arbitrary fields in indexes,
// so we collect and sort in-memory. For large datasets, consider a
// separate "top content" table updated via scheduled functions.
export const getTrending = query({
  args: {
    mediaType: v.optional(v.union(v.literal("movie"), v.literal("tv"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { mediaType, limit = 10 }) => {
    // Collect stats — filter by mediaType if provided to reduce volume
    const allStats = await ctx.db.query("contentStats").collect();
    
    const filtered = mediaType
      ? allStats.filter((s) => s.mediaType === mediaType)
      : allStats;

    // Sort by views descending and take only what we need
    filtered.sort((a, b) => b.views - a.views);

    return filtered.slice(0, limit);
  },
});

// Get most added to watchlist
// Same Convex limitation as getTrending — in-memory sort required.
export const getMostWatchlisted = query({
  args: {
    mediaType: v.optional(v.union(v.literal("movie"), v.literal("tv"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { mediaType, limit = 10 }) => {
    const allStats = await ctx.db.query("contentStats").collect();

    const filtered = mediaType
      ? allStats.filter((s) => s.mediaType === mediaType)
      : allStats;

    filtered.sort((a, b) => b.watchlistAdds - a.watchlistAdds);

    return filtered.slice(0, limit);
  },
});

// Get stats for specific content
export const getStats = query({
  args: {
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
  },
  handler: async (ctx, { tmdbId, mediaType }) => {
    return ctx.db
      .query("contentStats")
      .withIndex("by_content", (q) =>
        q.eq("tmdbId", tmdbId).eq("mediaType", mediaType)
      )
      .first();
  },
});
