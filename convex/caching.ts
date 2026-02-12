"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Smart Caching Layer - Node.js Actions
 * - Fetch and cache enriched content
 * - 24hr expiry for freshness
 */

const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedResponse {
  fromCache: boolean;
  ratings?: {
    imdb: number | null;
    rottenTomatoes: number | null;
    metacritic: number | null;
    tmdb?: number;
    community?: { average: number | null; total: number };
  };
  meta?: {
    awards: string | null;
    boxOffice: string | null;
    rated: string | null;
    runtime: string | null;
  };
  trailer?: { youtubeKey: string } | null;
  tmdb?: unknown;
}

// Get cached enriched content (with fallback to live fetch)
export const getCachedEnrichedContent = action({
  args: {
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    forceRefresh: v.optional(v.boolean()),
  },
  handler: async (ctx, { tmdbId, mediaType, forceRefresh = false }): Promise<CachedResponse | null> => {
    // Step 1: Check cache
    const cached = await ctx.runQuery(api.cacheQueries.getFromCache, {
      tmdbId,
      mediaType,
    });

    const now = Date.now();
    const isExpired = cached
      ? now - cached.lastUpdated > CACHE_EXPIRY_MS
      : true;

    // Return cached if valid
    if (cached && !isExpired && !forceRefresh) {

      return {
        fromCache: true,
        ratings: {
          imdb: cached.enrichedData?.imdbRating || null,
          rottenTomatoes: cached.enrichedData?.rottenTomatoes || null,
          metacritic: cached.enrichedData?.metacritic || null,
        },
        meta: {
          awards: cached.enrichedData?.awards || null,
          boxOffice: cached.enrichedData?.boxOffice || null,
          rated: cached.enrichedData?.rated || null,
          runtime: cached.enrichedData?.runtime || null,
        },
        trailer: cached.trailerKey ? { youtubeKey: cached.trailerKey } : null,
      };
    }



    // Step 2: Fetch fresh data
    const enriched = await ctx.runAction(api.enrichment.getEnrichedContent, {
      tmdbId,
      mediaType,
    });

    if (!enriched) {
      return null;
    }

    // Step 3: Update cache
    await ctx.runMutation(api.cacheQueries.updateCache, {
      tmdbId,
      mediaType,
      enrichedData: {
        rottenTomatoes: enriched.ratings.rottenTomatoes ?? undefined,
        metacritic: enriched.ratings.metacritic ?? undefined,
        imdbRating: enriched.ratings.imdb ?? undefined,
        awards: enriched.meta.awards ?? undefined,
        boxOffice: enriched.meta.boxOffice ?? undefined,
        rated: enriched.meta.rated ?? undefined,
        runtime: enriched.meta.runtime ?? undefined,
      },
      trailerKey: enriched.trailer?.youtubeKey ?? undefined,
    });

    return {
      fromCache: false,
      ratings: enriched.ratings,
      meta: enriched.meta,
      trailer: enriched.trailer?.youtubeKey ? { youtubeKey: enriched.trailer.youtubeKey } : null,
      tmdb: enriched.tmdb,
    };
  },
});
