const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_API_KEY = process.env.TMDB_API_KEY;

export interface TMDBResult {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  media_type?: "movie" | "tv";
  release_date?: string;
  first_air_date?: string;
  overview: string;
  trailerKey?: string;
  genre_ids?: number[];
}

export interface TMDBResponse {
  results: TMDBResult[];
  page: number;
  total_pages: number;
}

interface TMDBVideo {
  site: string;
  type: string;
  key: string;
  name: string;
}

interface TMDBGenre {
  id: number;
  name: string;
}

interface TMDBCastMember {
  id: number;
  name: string;
  profile_path: string | null;
  character: string;
}

interface TMDBCreator {
  id: number;
  name: string;
}

interface TMDBSeason {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
  poster_path: string | null;
  air_date: string | null;
}

interface TMDBDetailResponse {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  tagline?: string;
  status: string;
  runtime?: number;
  release_date?: string;
  first_air_date?: string;
  last_air_date?: string;
  budget?: number;
  revenue?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  genres?: TMDBGenre[];
  seasons?: TMDBSeason[];
  created_by?: TMDBCreator[];
  credits?: { cast?: TMDBCastMember[] };
  videos?: { results?: TMDBVideo[] };
  similar?: { results?: TMDBResult[] };
  "watch/providers"?: Record<string, unknown>;
}

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  if (!TMDB_API_KEY) {
    console.error(`[TMDB] TMDB_API_KEY is missing in environment variables!`);
    throw new Error("TMDB_API_KEY is not set. Please configure it in your VERCEL environment variables (Settings -> Environment Variables).");
  }

  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  try {
    const response = await fetch(url.toString(), { next: { revalidate: 3600 } }); 
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error(`[TMDB] Network/Fetch error for ${endpoint}:`, error);
    throw error;
  }
}

export async function getTrendingMovies() {
    return tmdbFetch<TMDBResponse>("/trending/movie/week");
}

export async function getTrendingTV() {
    return tmdbFetch<TMDBResponse>("/trending/tv/week");
}

export async function getNowPlaying(page = 1) {
    return tmdbFetch<TMDBResponse>("/movie/now_playing", { page: String(page) });
}

export async function getUpcoming(page = 1) {
    return tmdbFetch<TMDBResponse>("/movie/upcoming", { page: String(page) });
}

export async function getTopRatedMovies(page = 1) {
    return tmdbFetch<TMDBResponse>("/movie/top_rated", { page: String(page) });
}

export async function getTopRatedTV(page = 1) {
    return tmdbFetch<TMDBResponse>("/tv/top_rated", { page: String(page) });
}

export async function getAiringToday(page = 1) {
    return tmdbFetch<TMDBResponse>("/tv/airing_today", { page: String(page) });
}

export async function getOnTheAir(page = 1) {
    return tmdbFetch<TMDBResponse>("/tv/on_the_air", { page: String(page) });
}

export async function getDiscoverMovies(params: Record<string, string> = {}) {
    return tmdbFetch<TMDBResponse>("/discover/movie", params);
}

export async function getDiscoverSeries(params: Record<string, string> = {}) {
    return tmdbFetch<TMDBResponse>("/discover/tv", params);
}

export async function getMovieDetails(id: string) {
    const res = await tmdbFetch<TMDBDetailResponse>(`/movie/${id}`, {
        append_to_response: "credits,videos,similar,watch/providers"
    });
    
    return {
        details: res,
        cast: res.credits?.cast?.slice(0, 12) || [],
        similar: res.similar?.results?.slice(0, 10) || [],
        trailer: res.videos?.results?.find(
            (v) => v.site === "YouTube" && v.type === "Trailer"
        )
    };
}

export async function getTVDetails(id: string) {
     const res = await tmdbFetch<TMDBDetailResponse>(`/tv/${id}`, {
        append_to_response: "credits,videos,similar,watch/providers"
    });
    
    return {
        details: res,
        cast: res.credits?.cast?.slice(0, 12) || [],
        similar: res.similar?.results?.slice(0, 10) || [],
        trailer: res.videos?.results?.find(
            (v) => v.site === "YouTube" && v.type === "Trailer"
        )
    };
}
