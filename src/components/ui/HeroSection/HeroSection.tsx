"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Magnetic } from "@/components/ui/Magnetic/Magnetic";
import { Button3D } from "@/components/ui/Button3D/Button3D";
import { TrailerModal } from "@/components/ui";
import styles from "./HeroSection.module.css";

interface HeroItem {
  id: number;
  title: string;
  overview: string;
  backdropPath: string | null;
  voteAverage: number;
  mediaType: "movie" | "tv";
  trailerKey?: string;
}

interface HeroSectionProps {
  items: HeroItem[];
  onItemClick?: (id: number, mediaType: "movie" | "tv") => void;
}

export function HeroSection({ items, onItemClick }: HeroSectionProps) {
  const [index, setIndex] = useState(0);
  const [showTrailer, setShowTrailer] = useState(false);
  const [progress, setProgress] = useState(0);

  const currentItem = items[index];
  const SLIDE_DURATION = 10000; // 10 seconds

  // Auto-rotate items with progress tracking
  useEffect(() => {
    if (showTrailer) return; // Pause while trailer modal is open

    const startTime = Date.now();
    
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress((elapsed / SLIDE_DURATION) * 100);
    }, 50);

    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % items.length);
      setProgress(0);
    }, SLIDE_DURATION);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, [items.length, index, showTrailer]);

  // Handle indicator click
  const goToSlide = (slideIndex: number) => {
    setIndex(slideIndex);
    setProgress(0);
  };

  if (!currentItem) return null;

  return (
    <section className={styles.hero}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.id}
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          {currentItem.backdropPath && (
             <Image
                src={`https://image.tmdb.org/t/p/original${currentItem.backdropPath}`}
                alt={currentItem.title}
                fill
                className={styles.image}
                priority
              />
          )}
          <div className={styles.gradient} />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className={styles.content}>
        <motion.div
           className={styles.info}
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.5, duration: 0.8 }}
        >
          <motion.h1 className={styles.title}>
            {currentItem.title}
          </motion.h1>

          <div className={styles.meta}>
            <span>{currentItem.mediaType === 'movie' ? 'Film' : 'Series'}</span>
            <span>•</span>
            <span>{currentItem.voteAverage.toFixed(1)} / 10</span>
          </div>

            <div className={styles.actions}>
              <Button3D 
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("Trailer button clicked", currentItem);
                  if (currentItem.trailerKey) {
                    console.log("Opening trailer", currentItem.trailerKey);
                    setShowTrailer(true);
                  } else {
                    console.log("No trailer key, navigating");
                    onItemClick?.(currentItem.id, currentItem.mediaType);
                  }
                }}
                icon={
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                }
              >
                Watch Trailer
              </Button3D>

              <Button3D 
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onItemClick?.(currentItem.id, currentItem.mediaType);
                }}
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                }
              >
                More Info
              </Button3D>
            </div>
        </motion.div>
      </div>

      {/* Trailer Modal */}
      {showTrailer && currentItem.trailerKey && (
        <TrailerModal 
           trailerKey={currentItem.trailerKey}
           onClose={() => setShowTrailer(false)}
        />
      )}

      {/* Modern Slide Indicators - Vertical Lines on Right */}
      <div className={styles.slideIndicators}>
        {items.slice(0, 5).map((item, i) => (
          <button
            key={item.id}
            className={`${styles.slideIndicator} ${i === index ? styles.activeSlide : ""}`}
            onClick={() => goToSlide(i)}
            aria-label={`Go to slide ${i + 1}: ${item.title}`}
          >
            <span className={styles.indicatorTrack}>
              {i === index && (
                <motion.span 
                  className={styles.indicatorProgress}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: progress / 100 }}
                  transition={{ duration: 0.05, ease: "linear" }}
                />
              )}
            </span>
            <span className={styles.indicatorNumber}>
              {String(i + 1).padStart(2, '0')}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
