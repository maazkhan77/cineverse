"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MovieCard } from "../MovieCard";
import styles from "./ContentRow.module.css";

interface ContentItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  vote_average: number;
  media_type?: "movie" | "tv";
  release_date?: string;
  first_air_date?: string;
}

import { Skeleton } from "../Skeleton/Skeleton";

interface ContentRowProps {
  title: string;
  items?: ContentItem[];
  mediaType?: "movie" | "tv";
  loading?: boolean;
  onItemClick?: (id: number, mediaType: "movie" | "tv") => void;
}

export function ContentRow({ title, items = [], mediaType, loading = false, onItemClick }: ContentRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Check scroll position to toggle arrows
  const checkScroll = useCallback(() => {
    if (!rowRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    
    // Show left arrow if scrolled more than 10px
    setShowLeftArrow(scrollLeft > 10);
    
    // Show right arrow if there is more content to scroll to (with small buffer)
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  // Initial check and event listeners
  useEffect(() => {
    const row = rowRef.current;
    if (row) {
      checkScroll();
      row.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
    }
    return () => {
      if (row) row.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [items, loading, checkScroll]);

  const scroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const { clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      rowRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!loading && (!items || items.length === 0)) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      
      <div className={styles.container}>
        {/* Left Scroll Overlay */}
        <button
          className={`${styles.scrollButton} ${styles.scrollLeft} ${showLeftArrow ? styles.visible : ""}`}
          onClick={() => scroll("left")}
          aria-label="Scroll left"
        >
          <div className={styles.arrowIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </div>
        </button>

        <div className={styles.row} ref={rowRef}>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={styles.card}>
                  <Skeleton className={styles.skeletonCard} variant="rect" />
                </div>
              ))
            : items.slice(0, 20).map((item) => {
                const itemMediaType = item.media_type || mediaType || "movie";
                return (
                  <div
                    key={item.id}
                    className={styles.card}
                  >
                    <MovieCard
                      id={item.id}
                      title={item.title || item.name || ""}
                      posterPath={item.poster_path}
                      voteAverage={item.vote_average}
                      mediaType={itemMediaType}
                      releaseDate={item.release_date || item.first_air_date}
                      onClick={() => onItemClick?.(item.id, itemMediaType)}
                    />
                  </div>
                );
              })}
        </div>
        
        {/* Right Scroll Overlay */}
        <button
          className={`${styles.scrollButton} ${styles.scrollRight} ${showRightArrow ? styles.visible : ""}`}
          onClick={() => scroll("right")}
          aria-label="Scroll right"
        >
          <div className={styles.arrowIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </button>
      </div>
    </section>
  );
}
