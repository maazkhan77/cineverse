"use client";

import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import styles from "./MovieCardOverlay.module.css";
import { useEffect, useState } from "react";

interface MovieCardOverlayProps {
  isOpen: boolean;
  rect: DOMRect | null;
  movie: {
    id: number;
    title: string;
    posterPath: string | null;
    backdropPath?: string | null;
    voteAverage: number;
    mediaType: "movie" | "tv";
    releaseDate?: string;
    overview?: string;
  };
  onClose: () => void;
  onMouseEnter: () => void;
  onClick: () => void;
}

export function MovieCardOverlay({ isOpen, rect, movie, onClose, onMouseEnter, onClick }: MovieCardOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !rect || typeof document === 'undefined') return null;


  // Center alignment logic (Strict Centering)
  // This ensures the expanded card overlaps the trigger logic in all directions
  // Variables strictly declared once
  
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  // Base calculations
  const scale = 1.5;
  const width = rect.width * scale;
  const height = width * (movie.backdropPath ? 0.5625 : 1.5); // Approx height based on aspect ratio
  
  let left = centerX - width / 2;
  let top = centerY - (rect.height * scale) / 2; 

  // Smart Viewport Clamping
  // We need to ensure the overlay stays effectively ON TOP of the trigger (so mouse doesn't leave),
  // but also ON SCREEN.
  
  const padding = 20; // Padding from edge of screen
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Check Right Edge
  if (left + width > viewportWidth - padding) {
      left = viewportWidth - width - padding;
  }
  // Check Left Edge
  if (left < padding) {
      left = padding;
  }

  // Check Bottom Edge (Most common issue)
  // We approximate the expanded height. It's safer to shift UP if we are near the bottom.
  // We only shift if it actually overflows.
  // Note: shifting too much might disconnect the mouse from the trigger area.
  // Ideally, we want to shift the *content* but keep the hit area... 
  // For now, simpler shift. The grace period in mouseLeave (300ms) handles slight disconnects.
  
  // Let's assume a safe height for the content (image + text) ~ 350px-400px?
  // We'll use a dynamic estimate if needed, but checking `top` vs viewport height is good.
  
  // Calculate potential bottom position
  // Since we don't know exact height until render, we estimate.
  // But strictly, we defined `top` as centered on the card.
  // If the card is at the very bottom, `top` + height might overflow.
  
  // Use a simpler heuristic: If trigger is in the bottom 40% of screen, shift UP more.
  /* 
     Actually, let's just use the `rect.bottom` as a guide. 
     If the overlay top + predicted height > viewportHeight...
  */
  
  if (rect.bottom > viewportHeight - 150) { 
     // We are near bottom. Force overlay to grow UPWARDS from bottom of trigger
     // New Top = Trigger Bottom - Expanded Height
     // This is risky if height is unknown.
     
     // Safer: Just clamp it.
     const predictedBottom = top + height + 100; // Extra buffer for text
     if (predictedBottom > viewportHeight - padding) {
         top = viewportHeight - height - 100 - padding;
     }
  }

  // Check Top Edge
  if (top < padding + 60) { // +60 for Navbar clearance usually
      top = padding + 60;
  }

  // Use camelCase properties (already normalized by parent)
  const backdrop = movie.backdropPath;
  const poster = movie.posterPath;
  const hasImage = backdrop || poster;

  const imageUrl = backdrop 
    ? `https://image.tmdb.org/t/p/w780${backdrop}`
    : poster 
      ? `https://image.tmdb.org/t/p/w500${poster}`
      : null;

  const title = movie.title || "Unknown";
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;
  const matchScore = Math.round(movie.voteAverage * 10);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div 
          className={styles.overlayPortal}
          onMouseLeave={onClose}
        >
          <motion.div
            className={styles.card}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onClose}
            style={{
               position: 'absolute', // Ensure framer-motion respects this
            }}
            initial={{ 
              opacity: 0, 
              width: rect.width, 
              height: rect.height,
              top: rect.top,
              left: rect.left
            }}
            animate={{ 
              opacity: 1, 
              width: width, 
              height: "auto", 
              top: top, // Strictly centered
              left: left,
              scale: 1,
              transition: { duration: 0.2, ease: "easeOut" }
            }}
            exit={{ 
              opacity: 0,
              scale: 0.95, // Shrink slightly on exit
              transition: { duration: 0.15 }
            }}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            {/* Image Section */}
            <div 
              className={styles.imageWrapper}
              data-orientation={backdrop ? "landscape" : "portrait"}
              style={!hasImage ? { background: 'linear-gradient(135deg, #1a1a2e, #16213e)', minHeight: '150px' } : {}}
            >
              {hasImage && imageUrl && (
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className={styles.image}
                  sizes="400px"
                />
              )}
            </div>

            {/* Content Section */}
            <div className={styles.content}>
               {/* Actions */}
               <div className={styles.actions}>
                <button className={`${styles.actionBtn} ${styles.playBtn}`}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                     <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
                <button className={styles.actionBtn}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </button>
                <button className={styles.actionBtn}>
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                     <circle cx="12" cy="12" r="10" />
                     <path d="M12 16v-4M12 8h.01" />
                  </svg>
                </button>
              </div>

              <div className={styles.header}>
                <div>
                   <h4 className={styles.title}>{movie.title}</h4>
                   <div className={styles.meta}>
                    <span className={styles.match}>{matchScore}% Match</span>
                    <span>{year}</span>
                    <span className={styles.badge}>{movie.mediaType === 'movie' ? 'HD' : 'TV'}</span>
                  </div>
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
