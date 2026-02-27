"use client";

import { useAction } from "convex/react";
import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../../../convex/_generated/api";
import TrailerDeck from "@/components/ui/TrailerDeck/TrailerDeck";
import { TrailerFilters } from "@/components/ui/TrailerDeck/TrailerFilters";
import { TrailerData } from "@/components/ui/TrailerDeck/TrailerSlide";
import { Navbar } from "@/components/ui/Navbar/Navbar";

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
  const lastRequestId = useRef<string | null>(null);


  // Fetch trailers
  const fetchTrailers = useCallback(async (pageNum: number, reset: boolean = false) => {
    const requestId = crypto.randomUUID();
    lastRequestId.current = requestId;

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

      // Discard if a newer request has started
      if (lastRequestId.current !== requestId) {
        return;
      }

      const newTrailers = (data?.results || []) as unknown as TrailerData[];
      
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
      // creating a new request ID effectively cancels this one
      if (lastRequestId.current === requestId) {
         console.error("Failed to load trailers", err);
      }
    } finally {
      if (lastRequestId.current === requestId) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
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
      <div className="w-screen h-[100dvh] bg-black overflow-hidden flex items-center justify-center relative">
        {/* Skeleton Video Layer */}
        <div className="relative z-10 w-full lg:w-[80%] aspect-video lg:max-h-[80vh] bg-zinc-900/50 lg:rounded-xl overflow-hidden shadow-2xl animate-pulse flex items-center justify-center">
            {/* Center icon placeholder */}
           <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center">
             <div className="w-8 h-8 rounded-full border-t-2 border-white/20 animate-spin" />
           </div>
        </div>

        {/* Skeleton Overlay Details */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 pb-20 pointer-events-none bg-gradient-to-t from-black/90 to-transparent">
          {/* Tags */}
          <div className="flex gap-2 mb-4">
            <div className="w-12 h-6 rounded-full bg-zinc-800/80 animate-pulse" />
            <div className="w-16 h-6 rounded-full bg-zinc-800/80 animate-pulse" />
          </div>
          
          {/* Title */}
          <div className="w-3/4 max-w-md h-10 md:h-12 bg-zinc-800/80 rounded-md mb-2 animate-pulse" />
          <div className="w-1/2 max-w-xs h-10 md:h-12 bg-zinc-800/80 rounded-md mb-6 animate-pulse" />

          {/* Description */}
          <div className="w-full max-w-xl h-4 bg-zinc-800/60 rounded mb-2 animate-pulse" />
          <div className="w-4/5 max-w-lg h-4 bg-zinc-800/60 rounded mb-8 animate-pulse" />

          {/* Actions */}
          <div className="flex items-center gap-4">
            <div className="w-32 h-12 rounded-full bg-zinc-800/80 animate-pulse" />
            <div className="w-12 h-12 rounded-full bg-zinc-800/80 animate-pulse" />
            <div className="w-12 h-12 rounded-full bg-zinc-800/80 animate-pulse" />
          </div>
        </div>
        
        <Navbar />
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
