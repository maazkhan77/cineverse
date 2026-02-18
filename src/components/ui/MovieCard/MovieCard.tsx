"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import styles from "./MovieCard.module.css";
import { useState, useRef, useEffect } from "react";
import { MovieCardOverlay } from "./MovieCardOverlay";

interface MovieCardProps {
  id: number;
  title: string;
  posterPath: string | null;
  voteAverage: number;
  mediaType: "movie" | "tv";
  releaseDate?: string;
  onClick?: () => void;
}



export function MovieCard({
  id,
  title,
  posterPath,
  voteAverage,
  mediaType,
  releaseDate,
  onClick,
}: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLElement>(null);
  const timerRef = useRef<NodeJS.Timeout>(null);
  const closeTimerRef = useRef<NodeJS.Timeout>(null);

  const imageUrl = posterPath
    ? `https://image.tmdb.org/t/p/w500${posterPath}`
    : "/placeholder-poster.png";

  useEffect(() => {
    return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // Auto-close overlay on scroll
  useEffect(() => {
    if (!showOverlay) return;
    const handleScroll = () => {
      setShowOverlay(false);
      setRect(null);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [showOverlay]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    // Clear any pending close timer (if moving quickly between trigger and overlay)
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    
    // Start open timer if not already open
    if (!showOverlay) {
        timerRef.current = setTimeout(() => {
        if (cardRef.current) {
            setRect(cardRef.current.getBoundingClientRect());
            setShowOverlay(true);
        }
        }, 750); // Increased to 750ms to prevent accidental triggers
    }
  };

  const handleMouseLeave = () => {
     setIsHovered(false);
     if (timerRef.current) clearTimeout(timerRef.current);

     // Delay closing to allow entering the overlay
     closeTimerRef.current = setTimeout(() => {
         setShowOverlay(false);
         setRect(null); // Reset rect
     }, 300); // 300ms grace period
  };

  const handleOverlayMouseEnter = () => {
      // If we enter the overlay, cancel the close timer
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  };
  
  const handleOverlayMouseLeave = () => {
      // If we leave the overlay, start the close timer
      handleMouseLeave();
  };

  return (
    <>
      <article
        ref={cardRef}
        className={styles.card}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={styles.imageWrapper}>
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
            className={styles.image}
          />
        </div>
      </article>

      {showOverlay && (
        <MovieCardOverlay
          isOpen={showOverlay}
          rect={rect}
          movie={{
            id,
            title,
            posterPath,
            voteAverage,
            mediaType,
            releaseDate
          }}
          onClose={handleOverlayMouseLeave}
          onMouseEnter={handleOverlayMouseEnter}
          onClick={() => onClick?.()}
        />
      )}
    </>
  );
}
