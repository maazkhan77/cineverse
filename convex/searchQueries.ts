import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Search Queries & Mutations (non-Node.js)
 * - Autocomplete from recent/popular
 * - Search history management
 */

// Save search to history (for autocomplete)
export const saveSearchHistory = mutation({
  args: {
    query: v.string(),
    resultCount: v.number(),
  },
  handler: async (ctx, { query: searchQuery, resultCount }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return; // Anonymous searches not tracked

    // Don't save very short queries
    if (searchQuery.length < 2) return;

    // Check if already exists
    const existing = await ctx.db
      .query("recentSearches")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("query"), searchQuery))
      .first();

    if (existing) {
      // Update timestamp
      await ctx.db.patch(existing._id, {
        searchedAt: Date.now(),
        resultCount,
      });
    } else {
      await ctx.db.insert("recentSearches", {
        userId,
        query: searchQuery,
        resultCount,
        searchedAt: Date.now(),
      });
    }

    // Update popular searches
    const popularExisting = await ctx.db
      .query("popularSearches")
      .filter((q) => q.eq(q.field("query"), searchQuery.toLowerCase()))
      .first();

    if (popularExisting) {
      await ctx.db.patch(popularExisting._id, {
        count: popularExisting.count + 1,
        lastSearched: Date.now(),
      });
    } else {
      await ctx.db.insert("popularSearches", {
        query: searchQuery.toLowerCase(),
        count: 1,
        lastSearched: Date.now(),
      });
    }
  },
});

// Get user's recent searches
export const getRecentSearches = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const searches = await ctx.db
      .query("recentSearches")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    return searches.map((s) => s.query);
  },
});

// Get popular searches (global)
export const getPopularSearches = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    const searches = await ctx.db
      .query("popularSearches")
      .collect();

    // Sort by count descending
    searches.sort((a, b) => b.count - a.count);

    return searches.slice(0, limit).map((s) => s.query);
  },
});

// Clear user's search history
export const clearSearchHistory = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const searches = await ctx.db
      .query("recentSearches")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    await Promise.all(searches.map((s) => ctx.db.delete(s._id)));
  },
});

// Autocomplete suggestions
export const getAutocompleteSuggestions = query({
  args: { prefix: v.string() },
  handler: async (ctx, { prefix }) => {
    if (prefix.length < 2) return { recent: [], popular: [] };

    const userId = await getAuthUserId(ctx);
    const lowerPrefix = prefix.toLowerCase();

    // Get matching recent searches
    let recent: string[] = [];
    if (userId) {
      const recentSearches = await ctx.db
        .query("recentSearches")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();

      recent = recentSearches
        .filter((s) => s.query.toLowerCase().startsWith(lowerPrefix))
        .sort((a, b) => b.searchedAt - a.searchedAt)
        .slice(0, 5)
        .map((s) => s.query);
    }

    // Get matching popular searches
    const popularSearches = await ctx.db.query("popularSearches").collect();

    const popular = popularSearches
      .filter((s) => s.query.startsWith(lowerPrefix))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((s) => s.query);

    return { recent, popular };
  },
});
