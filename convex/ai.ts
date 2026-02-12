"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import Groq from "groq-sdk";

interface TMDBSearchResult {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: string;
}

interface EnrichedRecommendation {
  title: string;
  year: number;
  reason: string;
  tmdbId: number | null;
  posterPath: string | null;
  voteAverage: number | null;
  mediaType: "movie" | "tv";
}

// Helper to search TMDB for a movie/show by title and year
async function searchTMDB(title: string, year?: number): Promise<TMDBSearchResult | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  try {
    // Try movie search first
    const movieUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(title)}${year ? `&year=${year}` : ""}`;
    const movieRes = await fetch(movieUrl);
    const movieData = await movieRes.json();
    
    if (movieData.results && movieData.results.length > 0) {
      return { ...movieData.results[0], media_type: "movie" };
    }

    // Fallback to TV search
    const tvUrl = `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(title)}${year ? `&first_air_date_year=${year}` : ""}`;
    const tvRes = await fetch(tvUrl);
    const tvData = await tvRes.json();
    
    if (tvData.results && tvData.results.length > 0) {
      return { ...tvData.results[0], media_type: "tv" };
    }

    return null;
  } catch {
    return null;
  }
}

export const recommendMovies = action({
  args: { query: v.string() },
  handler: async (_, { query }) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set");
    }

    const groq = new Groq({ apiKey });

    // Step 1: Get AI recommendations
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a movie expert. Given a user query, suggest 5 movies or TV shows that match their request.
For each, provide:
- title: The exact title as it appears on TMDB/IMDB
- year: Release year
- reason: A brief 1-sentence explanation of why this matches their request

Return your response as a JSON object with a "recommendations" array.
Example format:
{
  "recommendations": [
    { "title": "Inception", "year": 2010, "reason": "Mind-bending sci-fi thriller with dream manipulation." }
  ]
}`,
        },
        { role: "user", content: query },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(content);
    const recommendations = parsed.recommendations || [];

    // Step 2: Enrich each recommendation with TMDB data
    const enrichedRecommendations: EnrichedRecommendation[] = await Promise.all(
      recommendations.map(async (rec: { title: string; year?: number; reason: string }) => {
        const tmdbResult = await searchTMDB(rec.title, rec.year);
        
        return {
          title: rec.title,
          year: rec.year || 0,
          reason: rec.reason,
          tmdbId: tmdbResult?.id || null,
          posterPath: tmdbResult?.poster_path || null,
          voteAverage: tmdbResult?.vote_average || null,
          mediaType: (tmdbResult?.media_type === "tv" ? "tv" : "movie") as "movie" | "tv",
        };
      })
    );

    return { recommendations: enrichedRecommendations };
  },
});
