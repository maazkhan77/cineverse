"use client";

import { useAction } from "convex/react";
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../convex/_generated/api";
import TrailerDeck from "@/components/ui/TrailerDeck/TrailerDeck";
import { TrailerFilters } from "@/components/ui/TrailerDeck/TrailerFilters";
import { TrailerData } from "@/components/ui/TrailerDeck/TrailerSlide";

type MediaType = "all" | "movie" | "tv";

export default function TrailersPage() {
  const getFeaturedTrailers = useAction(api.tmdb.getFeaturedTrailers);
  
  // Trailer data
  const [trailers, setTrailers] = useState<TrailerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Pagination & filters
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [mediaType, setMediaType] = useState<MediaType>("all");
  const [genreId, setGenreId] = useState<number | null>(null);


  // Fetch trailers
  const fetchTrailers = useCallback(async (pageNum: number, reset: boolean = false) => {
    if (reset) {
      setIsLoading(true);
      setTrailers([]); // Clear immediately for filter changes
    } else {
      setIsLoadingMore(true);
    }

    try {
      const data = await getFeaturedTrailers({
        page: pageNum,
        mediaType,
        genreId: genreId ?? undefined,
      });

      const newTrailers = data.results as unknown as TrailerData[];
      
      if (reset) {
        setTrailers(newTrailers);
      } else {
        // Append new trailers, avoiding duplicates
        setTrailers((prev) => {
          const existingIds = new Set(prev.map(t => t.id));
          const uniqueNew = newTrailers.filter(t => !existingIds.has(t.id));
          return [...prev, ...uniqueNew];
        });
      }
      
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to load trailers", err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [getFeaturedTrailers, mediaType, genreId]);

  // Single unified effect for initial load and filter changes
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchTrailers(1, true);
  }, [fetchTrailers]); // fetchTrailers changes when mediaType or genreId change

  // Load more function - called by TrailerDeck when reaching end
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchTrailers(page + 1, false);
    }
  }, [fetchTrailers, page, isLoadingMore, hasMore]);

  // Handle filter changes
  const handleMediaTypeChange = (type: MediaType) => {
    setMediaType(type);
    setGenreId(null); // Reset genre when media type changes
  };

  const handleGenreChange = (id: number | null) => {
    setGenreId(id);
  };

  if (isLoading && trailers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-screen h-screen bg-black text-white gap-4">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400">Loading trailers...</p>
      </div>
    );
  }

  return (
    <>
      <TrailerFilters
        mediaType={mediaType}
        genreId={genreId}
        onMediaTypeChange={handleMediaTypeChange}
        onGenreChange={handleGenreChange}
      />
      <TrailerDeck
        trailers={trailers}
        onLoadMore={loadMore}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
      />
    </>
  );
}
