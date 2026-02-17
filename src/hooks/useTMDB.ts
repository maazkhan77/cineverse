import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { TMDBResponse } from "@/lib/tmdb";

// ============ HOME PAGE QUERIES ============
// All hooks use Convex actions (server-side) to keep API keys secure.
// TanStack Query handles caching, deduplication, and stale data.

export function useTrendingMovies() {
  const getTrending = useAction(api.tmdb.getTrending);
  return useQuery<TMDBResponse>({
    queryKey: ["trending", "movies"],
    queryFn: () => getTrending({ timeWindow: "week", includeTrailers: true }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTrendingTV() {
  const getTrending = useAction(api.tmdb.getTrending);
  return useQuery<TMDBResponse>({
    queryKey: ["trending", "tv"],
    queryFn: () => getTrending({ timeWindow: "day" }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useNowPlaying() {
  const getNowPlaying = useAction(api.tmdb.getNowPlaying);
  return useQuery<TMDBResponse>({
    queryKey: ["movies", "nowPlaying"],
    queryFn: () => getNowPlaying({ page: 1 }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpcoming() {
  const getUpcoming = useAction(api.tmdb.getUpcoming);
  return useQuery<TMDBResponse>({
    queryKey: ["movies", "upcoming"],
    queryFn: () => getUpcoming({ page: 1 }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTopRatedMovies() {
  const getTopRated = useAction(api.tmdb.getTopRated);
  return useQuery<TMDBResponse>({
    queryKey: ["movies", "topRated"],
    queryFn: () => getTopRated({ mediaType: "movie", page: 1 }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTopRatedTV() {
  const getTopRated = useAction(api.tmdb.getTopRated);
  return useQuery<TMDBResponse>({
    queryKey: ["tv", "topRated"],
    queryFn: () => getTopRated({ mediaType: "tv", page: 1 }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAiringToday() {
  const getAiringToday = useAction(api.tmdb.getAiringToday);
  return useQuery<TMDBResponse>({
    queryKey: ["tv", "airingToday"],
    queryFn: () => getAiringToday({ page: 1 }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useOnTheAir() {
  const getOnTheAir = useAction(api.tmdb.getOnTheAir);
  return useQuery<TMDBResponse>({
    queryKey: ["tv", "onTheAir"],
    queryFn: () => getOnTheAir({ page: 1 }),
    staleTime: 5 * 60 * 1000,
  });
}

// ============ DISCOVER INFINITE QUERIES ============

interface DiscoverFilters {
  sortBy?: string;
  minRating?: number;
  withGenres?: string;
  region?: string;
  maxRuntime?: number;
}

export function useDiscoverMoviesInfinite(filters: DiscoverFilters = {}) {
  const getMovies = useAction(api.tmdb.getMovies);
  return useInfiniteQuery<TMDBResponse>({
    queryKey: ["discover", "movies", filters],
    queryFn: async ({ pageParam = 1 }) => {
      return getMovies({
        page: pageParam as number,
        genreIds: filters.withGenres || undefined,
        region: filters.region || undefined,
        maxRuntime: filters.maxRuntime || undefined,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < Math.min(lastPage.total_pages, 500)) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useDiscoverSeriesInfinite(filters: DiscoverFilters = {}) {
  const getSeries = useAction(api.tmdb.getSeries);
  return useInfiniteQuery<TMDBResponse>({
    queryKey: ["discover", "series", filters],
    queryFn: async ({ pageParam = 1 }) => {
      return getSeries({
        page: pageParam as number,
        genreIds: filters.withGenres || undefined,
        region: filters.region || undefined,
        maxRuntime: filters.maxRuntime || undefined,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < Math.min(lastPage.total_pages, 500)) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============ DETAIL PAGE QUERIES ============
// NOTE: Detail pages (movie/[id], tv/[id]) are Server Components
// that call src/lib/tmdb.ts directly using process.env.TMDB_API_KEY.
// These hooks are kept for any client-side detail fetching needs.

export function useMovieDetails(id: string) {
  const getDetails = useAction(api.tmdb.getDetails);
  return useQuery({
    queryKey: ["movie", id],
    queryFn: () => getDetails({ id: Number(id), mediaType: "movie" }),
    enabled: !!id,
  });
}

export function useTVDetails(id: string) {
  const getDetails = useAction(api.tmdb.getDetails);
  return useQuery({
    queryKey: ["tv", id],
    queryFn: () => getDetails({ id: Number(id), mediaType: "tv" }),
    enabled: !!id,
  });
}
