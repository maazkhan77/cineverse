"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const OMDB_BASE_URL = "http://www.omdbapi.com";

/**
 * OMDB API Integration
 * Provides: Rotten Tomatoes, Metacritic, Awards, Plot details
 * Rate Limit: 1000 requests/day (free tier)
 */

interface OMDBResponse {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: Array<{
    Source: string;
    Value: string;
  }>;
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD: string;
  BoxOffice: string;
  Production: string;
  Website: string;
  Response: string;
  Error?: string;
}

interface EnrichedRatings {
  imdb: {
    rating: number | null;
    votes: string | null;
  };
  rottenTomatoes: {
    rating: number | null;
    fresh: boolean | null;
  };
  metacritic: {
    rating: number | null;
  };
  awards: string | null;
  boxOffice: string | null;
  rated: string | null; // PG-13, R, etc.
  runtime: string | null;
  plot: string | null;
}

// Helper to parse percentage string like "92%" to number
function parsePercentage(value: string): number | null {
  const match = value.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// Helper to parse fraction like "8.5/10" to number
function parseFraction(value: string): number | null {
  const match = value.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

export const getEnrichedRatings = action({
  args: {
    imdbId: v.string(),
  },
  handler: async (_, { imdbId }): Promise<EnrichedRatings | null> => {
    const apiKey = process.env.OMDB_API_KEY;
    
    if (!apiKey) {
      console.warn("OMDB_API_KEY not set - ratings enrichment disabled");
      return null;
    }

    try {
      const url = `${OMDB_BASE_URL}/?i=${imdbId}&apikey=${apiKey}&plot=full`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`OMDB API error: ${response.statusText}`);
        return null;
      }

      const data: OMDBResponse = await response.json();
      
      if (data.Response === "False") {
        console.warn(`OMDB: ${data.Error}`);
        return null;
      }

      // Extract Rotten Tomatoes rating
      const rtRating = data.Ratings?.find(r => r.Source === "Rotten Tomatoes");
      const rtScore = rtRating ? parsePercentage(rtRating.Value) : null;

      // Extract Metacritic rating
      const metaRating = data.Ratings?.find(r => r.Source === "Metacritic");
      const metaScore = metaRating 
        ? parseFraction(metaRating.Value) 
        : (data.Metascore !== "N/A" ? parseInt(data.Metascore, 10) : null);

      return {
        imdb: {
          rating: data.imdbRating !== "N/A" ? parseFloat(data.imdbRating) : null,
          votes: data.imdbVotes !== "N/A" ? data.imdbVotes : null,
        },
        rottenTomatoes: {
          rating: rtScore,
          fresh: rtScore !== null ? rtScore >= 60 : null,
        },
        metacritic: {
          rating: metaScore,
        },
        awards: data.Awards !== "N/A" ? data.Awards : null,
        boxOffice: data.BoxOffice !== "N/A" ? data.BoxOffice : null,
        rated: data.Rated !== "N/A" ? data.Rated : null,
        runtime: data.Runtime !== "N/A" ? data.Runtime : null,
        plot: data.Plot !== "N/A" ? data.Plot : null,
      };
    } catch (error) {
      console.error("OMDB fetch error:", error);
      return null;
    }
  },
});

// Batch lookup for multiple titles (useful for lists)
export const getMultipleEnrichedRatings = action({
  args: {
    imdbIds: v.array(v.string()),
  },
  handler: async (ctx, { imdbIds }): Promise<Record<string, EnrichedRatings | null>> => {
    const results: Record<string, EnrichedRatings | null> = {};
    
    // Process sequentially to respect rate limits
    for (const imdbId of imdbIds) {
      // Add small delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const enrichedResult = await ctx.runAction(api.omdb.getEnrichedRatings, { imdbId });
      results[imdbId] = enrichedResult;
    }
    
    return results;
  },
});
