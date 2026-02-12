"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Unified Content Enrichment
 * Aggregates data from multiple sources:
 * - TMDB (core metadata)
 * - OMDB (Rotten Tomatoes, Metacritic, Awards)
 * - Our own ratings system
 */

interface EnrichedContent {
  // Core TMDB data
  tmdb: {
    id: number;
    title: string;
    overview: string;
    posterPath: string | null;
    backdropPath: string | null;
    releaseDate: string | null;
    voteAverage: number;
    genres: Array<{ id: number; name: string }>;
  };
  
  // Trailer info
  trailer: {
    youtubeKey: string | null;
    name: string | null;
  } | null;
  
  // All ratings aggregated
  ratings: {
    tmdb: number;
    imdb: number | null;
    rottenTomatoes: number | null;
    metacritic: number | null;
    community: {
      average: number | null;
      total: number;
    };
  };
  
  // Additional metadata
  meta: {
    awards: string | null;
    boxOffice: string | null;
    rated: string | null; // PG-13, R, etc.
    runtime: string | null;
  };
}

// Extract the best trailer from TMDB videos response
function extractTrailer(videos: { results: Array<{ type: string; site: string; key: string; name: string }> } | null) {
  if (!videos?.results?.length) return null;
  
  // Priority: Official Trailer > Trailer > Teaser > any YouTube video
  const priorities = ["Official Trailer", "Trailer", "Teaser"];
  
  for (const priority of priorities) {
    const match = videos.results.find(
      (v) => v.site === "YouTube" && v.type.toLowerCase().includes(priority.toLowerCase())
    );
    if (match) {
      return { youtubeKey: match.key, name: match.name };
    }
  }
  
  // Fallback to any YouTube video
  const anyYoutube = videos.results.find((v) => v.site === "YouTube");
  if (anyYoutube) {
    return { youtubeKey: anyYoutube.key, name: anyYoutube.name };
  }
  
  return null;
}

export const getEnrichedContent = action({
  args: {
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
  },
  handler: async (ctx, { tmdbId, mediaType }): Promise<EnrichedContent | null> => {
    try {
      // Step 1: Fetch core TMDB data (includes videos and watch providers)
      const tmdbData = await ctx.runAction(api.tmdb.getDetails, {
        id: tmdbId,
        mediaType,
      });
      
      if (!tmdbData) {
        return null;
      }
      
      // Step 2: Extract trailer
      const trailer = extractTrailer(tmdbData.videos);
      
      // Step 3: Get OMDB enriched data (if IMDB ID available)
      let omdbData = null;
      const imdbId = tmdbData.imdb_id || tmdbData.external_ids?.imdb_id;
      
      if (imdbId) {
        try {
          omdbData = await ctx.runAction(api.omdb.getEnrichedRatings, { imdbId });
        } catch (e) {
          console.warn("OMDB fetch failed:", e);
        }
      }
      
      // Step 4: Get community rating from our database
      const communityRating = await ctx.runQuery(api.ratings.getCommunityRating, {
        tmdbId,
        mediaType,
      });
      
      // Compile the enriched response
      const enriched: EnrichedContent = {
        tmdb: {
          id: tmdbData.id,
          title: tmdbData.title || tmdbData.name,
          overview: tmdbData.overview,
          posterPath: tmdbData.poster_path,
          backdropPath: tmdbData.backdrop_path,
          releaseDate: tmdbData.release_date || tmdbData.first_air_date || null,
          voteAverage: tmdbData.vote_average,
          genres: tmdbData.genres || [],
        },
        trailer,
        ratings: {
          tmdb: tmdbData.vote_average,
          imdb: omdbData?.imdb?.rating || null,
          rottenTomatoes: omdbData?.rottenTomatoes?.rating || null,
          metacritic: omdbData?.metacritic?.rating || null,
          community: {
            average: communityRating?.average || null,
            total: communityRating?.total || 0,
          },
        },
        meta: {
          awards: omdbData?.awards || null,
          boxOffice: omdbData?.boxOffice || null,
          rated: omdbData?.rated || null,
          runtime: omdbData?.runtime || null,
        },
      };
      
      return enriched;
    } catch (error) {
      console.error("Enrichment error:", error);
      return null;
    }
  },
});
