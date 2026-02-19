"use client";

import styles from "./CanimaSyncResults.module.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface CanimaSyncResultsProps {
  matches: {
    tmdbId: number;
    title: string;
    posterPath?: string;
    releaseDate?: string;
  }[];
  onPlayAgain?: () => void;
  mediaType?: "movie" | "tv";
}

export function CanimaSyncResults({ matches, onPlayAgain, mediaType = "movie" }: CanimaSyncResultsProps) {
  const router = useRouter();

  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FFD700', '#FFA500', '#ffffff']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FFD700', '#FFA500', '#ffffff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  // Route based on media type (#18)
  const getDetailRoute = (tmdbId: number) => {
    return mediaType === "tv" ? `/tv/${tmdbId}` : `/movie/${tmdbId}`;
  };

  return (
    <div className={styles.container}>
      <motion.h1 
        className={styles.matchLabel}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
      >
        {matches.length > 1 ? `You matched on ${matches.length} movies!` : matches.length === 1 ? "It's a Match!" : "No Matches Found"}
      </motion.h1>

      {matches.length === 0 && (
        <p style={{ color: '#999', fontSize: '1.1rem', marginBottom: 30 }}>
          No one agreed on the same movie this time. Try again with different genres!
        </p>
      )}

      <div className={styles.resultsGrid}>
        {matches.map((movie, index) => (
          <motion.div 
            key={movie.tmdbId}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className={styles.resultCard}
          >
            <div className={styles.resultPosterWrapper}>
              {movie.posterPath && (
                <Image
                  src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
                  alt={movie.title}
                  fill
                  className={styles.poster}
                />
              )}
            </div>
            <div style={{textAlign: 'center'}}>
              <h3 className={styles.title} style={{fontSize: '1rem'}}>{movie.title}</h3>
              <p className={styles.meta} style={{fontSize: '0.8rem'}}>{movie.releaseDate?.split('-')[0]}</p>
              <button 
                className={styles.primaryBtn}
                style={{padding: '8px 16px', fontSize: '0.8rem', marginTop: 8}}
                onClick={() => router.push(getDetailRoute(movie.tmdbId))}
              >
                View Details
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className={styles.buttonGroup}>
        <button 
          className={styles.secondaryBtn}
          onClick={onPlayAgain || (() => window.location.reload())}
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
