"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Helper to make TMDB API requests
async function tmdbFetch(endpoint: string, params: Record<string, string> = {}) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB_API_KEY is not set");
  }

  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set("api_key", apiKey);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.statusText}`);
  }

  return response.json();
}

export const getTrending = action({
  args: {
    page: v.optional(v.number()),
    timeWindow: v.optional(v.union(v.literal("day"), v.literal("week"))),
    includeTrailers: v.optional(v.boolean()),
  },
  handler: async (_, { page = 1, timeWindow = "week", includeTrailers = false }) => {
    const data = await tmdbFetch(`/trending/all/${timeWindow}`, {
      page: String(page),
    });

    if (includeTrailers && data.results) {
      const topItems = data.results.slice(0, 6); // Enrich top 6 for Hero
      const enriched = await Promise.all(
        topItems.map(async (item: any) => {
          try {
             // Skip if not movie/tv (e.g. person)
             if (item.media_type === "person") return item;
             
             const type = item.media_type || "movie"; 
             const details = await tmdbFetch(`/${type}/${item.id}`, {
               append_to_response: "videos",
             });
             
             const videos = details.videos?.results || [];

             // Prioritize official "Trailer" type, ensure it's on YouTube
             // STRICT: Only Trailers, no Teasers to avoid short clips.
             const trailer = videos.find((v: any) => v.site === "YouTube" && v.type === "Trailer");

             if (trailer) {
               return { ...item, trailerKey: trailer.key };
             }
             return item;
          } catch (e) {
            return item;
          }
        })
      );
      
      // Merge back
      data.results.splice(0, 6, ...enriched);
    }
    
    return data;
  },
});

export const getMovies = action({
  args: {
    page: v.optional(v.number()),
    genreIds: v.optional(v.string()),
    region: v.optional(v.string()),
    maxRuntime: v.optional(v.number()),
  },
  handler: async (_, { page = 1, genreIds, region, maxRuntime }) => {
    const params: Record<string, string> = {
      page: String(page),
      language: "en-US",
      sort_by: "popularity.desc",
      include_adult: "false",
    };
    if (genreIds) {
      params.with_genres = genreIds;
    }
    if (region) {
      params.region = region;
      params.watch_region = region;
    }
    if (maxRuntime) {
      params["with_runtime.lte"] = String(maxRuntime);
    }
    return tmdbFetch("/discover/movie", params);
  },
});

export const getSeries = action({
  args: {
    page: v.optional(v.number()),
    genreIds: v.optional(v.string()),
    region: v.optional(v.string()),
    maxRuntime: v.optional(v.number()),
  },
  handler: async (_, { page = 1, genreIds, region, maxRuntime }) => {
    const params: Record<string, string> = {
      page: String(page),
      language: "en-US",
      sort_by: "popularity.desc",
    };
    if (genreIds) {
      params.with_genres = genreIds;
    }
    if (region) {
      params.watch_region = region;
    }
    if (maxRuntime) {
      params["with_runtime.lte"] = String(maxRuntime);
    }
    return tmdbFetch("/discover/tv", params);
  },
});

export const search = action({
  args: {
    query: v.string(),
    page: v.optional(v.number()),
  },
  handler: async (_, { query, page = 1 }) => {
    return tmdbFetch("/search/multi", {
      query,
      page: String(page),
      include_adult: "false",
    });
  },
});

export const getDetails = action({
  args: {
    id: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
  },
  handler: async (_, { id, mediaType }) => {
    return tmdbFetch(`/${mediaType}/${id}`, {
      // external_ids needed for TV shows to get imdb_id
      append_to_response: "videos,credits,watch/providers,external_ids",
    });
  },
});

export const getGenres = action({
  args: {
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
  },
  handler: async (_, { mediaType }) => {
    return tmdbFetch(`/genre/${mediaType}/list`, {
      language: "en",
    });
  },
});

// Phase 1: Recommendations & Similar
export const getRecommendations = action({
  args: {
    id: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
  },
  handler: async (_, { id, mediaType }) => {
    return tmdbFetch(`/${mediaType}/${id}/recommendations`);
  },
});

export const getSimilar = action({
  args: {
    id: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
  },
  handler: async (_, { id, mediaType }) => {
    return tmdbFetch(`/${mediaType}/${id}/similar`);
  },
});

// Phase 1: Curated Lists - Movies
export const getNowPlaying = action({
  args: { page: v.optional(v.number()) },
  handler: async (_, { page = 1 }) => {
    return tmdbFetch("/movie/now_playing", { page: String(page) });
  },
});

export const getUpcoming = action({
  args: { page: v.optional(v.number()) },
  handler: async (_, { page = 1 }) => {
    return tmdbFetch("/movie/upcoming", { page: String(page) });
  },
});

export const getTopRated = action({
  args: {
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    page: v.optional(v.number()),
  },
  handler: async (_, { mediaType, page = 1 }) => {
    return tmdbFetch(`/${mediaType}/top_rated`, { page: String(page) });
  },
});

// Phase 1: Curated Lists - TV
export const getAiringToday = action({
  args: { page: v.optional(v.number()) },
  handler: async (_, { page = 1 }) => {
    return tmdbFetch("/tv/airing_today", { page: String(page) });
  },
});

export const getOnTheAir = action({
  args: { page: v.optional(v.number()) },
  handler: async (_, { page = 1 }) => {
    return tmdbFetch("/tv/on_the_air", { page: String(page) });
  },
});

// Phase 2: Watch Providers
export const getWatchProviders = action({
  args: {
    id: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
  },
  handler: async (_, { id, mediaType }) => {
    return tmdbFetch(`/${mediaType}/${id}/watch/providers`);
  },
});

// Phase 3: Credits & People
export const getCredits = action({
  args: {
    id: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
  },
  handler: async (_, { id, mediaType }) => {
    return tmdbFetch(`/${mediaType}/${id}/credits`);
  },
});

export const getPersonDetails = action({
  args: { id: v.number() },
  handler: async (_, { id }) => {
    return tmdbFetch(`/person/${id}`, {
      append_to_response: "combined_credits,images",
    });
  },
});

// Phase 4: Collections
export const getCollection = action({
  args: { id: v.number() },
  handler: async (_, { id }) => {
    return tmdbFetch(`/collection/${id}`);
  },
});

// Phase 4: Reviews
export const getReviews = action({
  args: {
    id: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
  },
  handler: async (_, { id, mediaType }) => {
    return tmdbFetch(`/${mediaType}/${id}/reviews`);
  },
});

// Phase 4: TV Seasons & Episodes
export const getSeason = action({
  args: {
    tvId: v.number(),
    seasonNumber: v.number(),
  },
  handler: async (_, { tvId, seasonNumber }) => {
    return tmdbFetch(`/tv/${tvId}/season/${seasonNumber}`);
  },
});

// Phase 4: Images
export const getImages = action({
  args: {
    id: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
  },
  handler: async (_, { id, mediaType }) => {
    return tmdbFetch(`/${mediaType}/${id}/images`);
  },
});

// Phase 5: Trailer Park (Feed) - with pagination and filters
export const getFeaturedTrailers = action({
  args: {
    page: v.optional(v.number()),
    mediaType: v.optional(v.union(v.literal("movie"), v.literal("tv"), v.literal("all"))),
    genreId: v.optional(v.number()),
  },
  handler: async (_, { page = 1, mediaType = "all", genreId }) => {
    const resultsPerPage = 10;
    let totalRawResults = 0; // Track how many results TMDB returned (before trailer enrichment)
    
    // Helper to enrich items with trailer data
    const enrichWithTrailers = async (items: any[], type: "movie" | "tv") => {
      return Promise.all(
        items.map(async (item: any) => {
          try {
            const details = await tmdbFetch(`/${type}/${item.id}`, {
              append_to_response: "videos",
            });
            
            const videos = details.videos?.results || [];
            const trailer = videos.find(
              (v: any) => v.site === "YouTube" && v.type === "Trailer"
            ) || videos.find((v: any) => v.site === "YouTube" && v.type === "Teaser");

            if (!trailer) return null;

            return {
              ...item,
              media_type: type,
              trailerKey: trailer.key,
              trailerTitle: trailer.name,
            };
          } catch (e) {
            console.error(`Failed to fetch details for ${type}/${item.id}`, e);
            return null;
          }
        })
      );
    };

    let allResults: any[] = [];

    // Fetch based on mediaType filter
    if (mediaType === "movie" || mediaType === "all") {
      let movies;
      if (genreId) {
        // Use discover API for genre filtering
        movies = await tmdbFetch("/discover/movie", {
          page: String(page),
          with_genres: String(genreId),
          sort_by: "popularity.desc",
        });
      } else {
        // Use trending for unfiltered
        movies = await tmdbFetch("/trending/movie/week", {
          page: String(page),
        });
      }
      
      const sliceCount = mediaType === "all" ? 5 : resultsPerPage;
      totalRawResults += movies.results.length;
      
      const enrichedMovies = await enrichWithTrailers(
        movies.results.slice(0, sliceCount),
        "movie"
      );
      allResults = [...allResults, ...enrichedMovies];
    }

    if (mediaType === "tv" || mediaType === "all") {
      let tvShows;
      if (genreId) {
        tvShows = await tmdbFetch("/discover/tv", {
          page: String(page),
          with_genres: String(genreId),
          sort_by: "popularity.desc",
        });
      } else {
        tvShows = await tmdbFetch("/trending/tv/week", {
          page: String(page),
        });
      }
      
      const sliceCount = mediaType === "all" ? 5 : resultsPerPage;
      totalRawResults += tvShows.results.length;
      
      const enrichedTV = await enrichWithTrailers(
        tvShows.results.slice(0, sliceCount),
        "tv"
      );
      allResults = [...allResults, ...enrichedTV];
    }

    const filteredResults = allResults.filter(Boolean);
    
    // hasMore is true if TMDB returned enough results (even if some don't have trailers)
    // TMDB typically returns 20 results per page, so if we got at least 10, there's probably more
    const hasMore = totalRawResults >= 10;

    return {
      results: filteredResults,
      page,
      hasMore,
    };
  },
});

export const getTrailer = action({
  args: {
    id: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
  },
  handler: async (_, { id, mediaType }) => {
    try {
      const details = await tmdbFetch(`/${mediaType}/${id}`, {
        append_to_response: "videos",
      });
      
      const videos = details.videos?.results || [];
      // STRICT: Only Trailers
      const trailer = videos.find((v: any) => v.site === "YouTube" && v.type === "Trailer");
      
      return trailer ? trailer.key : null;
    } catch (e) {
      return null;
    }
  },
});
