"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import styles from "./StarRating.module.css";

interface StarRatingProps {
  rating: number | null;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRate?: (rating: number) => void;
  showValue?: boolean;
}

export function StarRating({
  rating,
  maxRating = 10,
  size = "md",
  interactive = false,
  onRate,
  showValue = true,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  
  // Convert 10-point scale to 5 stars
  const normalizedRating = rating !== null ? (rating / maxRating) * 5 : 0;
  const displayRating = hoverRating !== null ? (hoverRating / maxRating) * 5 : normalizedRating;
  
  const handleClick = (starIndex: number) => {
    if (interactive && onRate) {
      // Convert 5-star click to 10-point value
      const newRating = (starIndex + 1) * 2;
      onRate(newRating);
    }
  };

  const handleMouseEnter = (starIndex: number) => {
    if (interactive) {
      setHoverRating((starIndex + 1) * 2);
    }
  };

  const handleMouseLeave = () => {
    setHoverRating(null);
  };

  return (
    <div className={`${styles.container} ${styles[size]}`}>
      <div 
        className={`${styles.stars} ${interactive ? styles.interactive : ""}`}
        onMouseLeave={handleMouseLeave}
      >
        {[0, 1, 2, 3, 4].map((index) => {
          const fillPercentage = Math.min(Math.max((displayRating - index) * 100, 0), 100);
          
          return (
            <motion.button
              key={index}
              className={styles.starButton}
              onClick={() => handleClick(index)}
              onMouseEnter={() => handleMouseEnter(index)}
              whileHover={interactive ? { scale: 1.2 } : undefined}
              whileTap={interactive ? { scale: 0.9 } : undefined}
              disabled={!interactive}
            >
              {/* Empty star background */}
              <svg 
                className={styles.starEmpty}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              
              {/* Filled star overlay with clip */}
              <div 
                className={styles.starFillWrapper}
                style={{ width: `${fillPercentage}%` }}
              >
                <svg 
                  className={styles.starFill}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            </motion.button>
          );
        })}
      </div>
      
      {showValue && rating !== null && (
        <span className={styles.value}>
          {rating.toFixed(1)}<span className={styles.maxValue}>/{maxRating}</span>
        </span>
      )}
    </div>
  );
}

// Compact rating display with multiple sources
export function RatingBadges({
  ratings,
}: {
  ratings: {
    tmdb?: number | null;
    imdb?: number | null;
    rottenTomatoes?: number | null;
    metacritic?: number | null;
    community?: { average: number | null; total: number } | null;
  };
}) {
  return (
    <div className={styles.badgesContainer}>
      {ratings.tmdb !== null && ratings.tmdb !== undefined && (
        <div className={styles.badge}>
          <span className={styles.badgeIcon}>TMDB</span>
          <span className={styles.badgeValue}>{ratings.tmdb.toFixed(1)}</span>
        </div>
      )}
      
      {ratings.imdb !== null && ratings.imdb !== undefined && (
        <div className={styles.badge}>
          <span className={styles.badgeIcon}>IMDb</span>
          <span className={styles.badgeValue}>{ratings.imdb.toFixed(1)}</span>
        </div>
      )}
      
      {ratings.rottenTomatoes !== null && ratings.rottenTomatoes !== undefined && (
        <div className={`${styles.badge} ${ratings.rottenTomatoes >= 60 ? styles.fresh : styles.rotten}`}>
          <span className={styles.badgeIcon}>🍅</span>
          <span className={styles.badgeValue}>{ratings.rottenTomatoes}%</span>
        </div>
      )}
      
      {ratings.metacritic !== null && ratings.metacritic !== undefined && (
        <div className={styles.badge} data-score={ratings.metacritic >= 60 ? "good" : ratings.metacritic >= 40 ? "mixed" : "bad"}>
          <span className={styles.badgeIcon}>MC</span>
          <span className={styles.badgeValue}>{ratings.metacritic}</span>
        </div>
      )}
      
      {ratings.community?.average !== null && ratings.community?.average !== undefined && (
        <div className={styles.badge}>
          <span className={styles.badgeIcon}>👥</span>
          <span className={styles.badgeValue}>{ratings.community.average.toFixed(1)}</span>
          <span className={styles.badgeCount}>({ratings.community.total})</span>
        </div>
      )}
    </div>
  );
}
