"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { TrailerData, TrailerSlide } from "./TrailerSlide";
import styles from "./TrailerDeck.module.css";
import { Navbar } from "@/components/ui";

interface TrailerDeckProps {
  trailers: TrailerData[];
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  hasMore?: boolean;
}

export default function TrailerDeck({ 
  trailers, 
  onLoadMore, 
  isLoadingMore = false, 
  hasMore = true 
}: TrailerDeckProps) {
  const [activeId, setActiveId] = useState<number>(trailers[0]?.id || 0);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update activeId when trailers change (new items loaded)
  useEffect(() => {
    if (trailers.length > 0 && !trailers.find(t => t.id === activeId)) {
      setActiveId(trailers[0].id);
    }
  }, [trailers, activeId]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;
      
      const currentIndex = trailers.findIndex(t => t.id === activeId);
      if (currentIndex === -1) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, trailers.length - 1);
        scrollToIndex(nextIndex);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        scrollToIndex(prevIndex);
      } else if (e.key === "m") {
        setIsMuted(prev => !prev); 
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeId, trailers]);

  const scrollToIndex = (index: number) => {
    if (!containerRef.current) return;
    const slides = containerRef.current.children;
    if (slides[index]) {
      slides[index].scrollIntoView({ behavior: "smooth" });
    }
  };

  // Active Slide Detection - using viewport intersection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const id = Number(entry.target.getAttribute("data-id"));
            if (id) setActiveId(id);
          }
        });
      },
      {
        root: null,
        threshold: [0.5, 0.75],
        rootMargin: "-10% 0px -10% 0px",
      }
    );

    const slides = container.querySelectorAll("[data-id]");
    slides.forEach((slide) => observer.observe(slide));

    return () => {
      slides.forEach((slide) => observer.unobserve(slide));
      observer.disconnect();
    };
  }, [trailers]);

  // Infinite Scroll - trigger when near last slide
  useEffect(() => {
    const currentIndex = trailers.findIndex(t => t.id === activeId);
    const isNearEnd = currentIndex >= trailers.length - 3; // 3 slides from end
    
    console.log(`Infinite scroll check: index=${currentIndex}, total=${trailers.length}, nearEnd=${isNearEnd}, hasMore=${hasMore}, loading=${isLoadingMore}`);

    if (isNearEnd && hasMore && !isLoadingMore && onLoadMore) {
      console.log("Triggering loadMore!");
      onLoadMore();
    }
  }, [activeId, trailers, hasMore, isLoadingMore, onLoadMore]);

  return (
    <>
      <Navbar />
      <div className={styles.deckContainer} ref={containerRef}>
        {trailers.map((trailer) => (
          <div 
            key={trailer.id} 
            data-id={trailer.id}
            className={styles.slide}
          >
            <TrailerSlide 
              trailer={trailer}
              isActive={activeId === trailer.id}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(!isMuted)}
            />
          </div>
        ))}

        {/* Loading indicator */}
        {isLoadingMore && (
          <div className="flex items-center justify-center h-screen w-full bg-black">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {trailers.length === 0 && (
           <div className="flex items-center justify-center h-full w-full text-white">
              <p>No trailers available.</p>
           </div>
        )}
      </div>
    </>
  );
}
