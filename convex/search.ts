"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Advanced Search Actions (Node.js)
 * - Multi-filter search with TMDB
 */

interface TMDBResult {
  id: number;
  media_type: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  title?: string;
  name?: string;
}

interface SearchResponse {
  results: TMDBResult[];
  totalResults: number;
  page: number;
}

// Advanced filtered search
export const advancedSearch = action({
  args: {
    query: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("movie"), v.literal("tv"))),
    genres: v.optional(v.array(v.number())),
    yearFrom: v.optional(v.number()),
    yearTo: v.optional(v.number()),
    minRating: v.optional(v.number()),
    page: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<SearchResponse> => {
    const { query: searchQuery, mediaType, genres, yearFrom, yearTo, minRating, page = 1 } = args;

    // If we have a text query, use TMDB search
    if (searchQuery && searchQuery.trim()) {
      const searchResults = await ctx.runAction(api.tmdb.search, {
        query: searchQuery,
        page,
      });

      let filtered: TMDBResult[] = searchResults.results || [];

      // Apply client-side filters
      if (mediaType) {
        filtered = filtered.filter((r) => r.media_type === mediaType);
      }

      if (minRating) {
        filtered = filtered.filter((r) => r.vote_average >= minRating);
      }

      if (yearFrom || yearTo) {
        filtered = filtered.filter((r) => {
          const dateStr = r.release_date || r.first_air_date;
          if (!dateStr) return false;
          const year = parseInt(dateStr.split("-")[0], 10);
          if (yearFrom && year < yearFrom) return false;
          if (yearTo && year > yearTo) return false;
          return true;
        });
      }

      return {
        results: filtered,
        totalResults: filtered.length,
        page,
      };
    }

    // If no text query, use discover endpoint with filters
    if (mediaType === "tv") {
      const tvResults = await ctx.runAction(api.tmdb.getSeries, {
        page,
        genreIds: genres?.join(","),
      });
      return {
        results: tvResults.results || [],
        totalResults: tvResults.total_results || 0,
        page,
      };
    } else {
      const movieResults = await ctx.runAction(api.tmdb.getMovies, {
        page,
        genreIds: genres?.join(","),
      });
      return {
        results: movieResults.results || [],
        totalResults: movieResults.total_results || 0,
        page,
      };
    }
  },
});
