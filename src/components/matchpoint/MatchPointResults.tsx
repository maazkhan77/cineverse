"use client";

import styles from "./MatchPointResults.module.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface MatchPointResultsProps {
  matches: {
    tmdbId: number;
    title: string;
    posterPath?: string;
    releaseDate?: string;
  }[];
}

export function MatchPointResults({ matches }: MatchPointResultsProps) {
  const router = useRouter();

  useEffect(() => {
    // Fire confetti on mount
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

  return (
    <div className={styles.container}>
      <motion.h1 
        className={styles.matchLabel}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
      >
        {matches.length > 1 ? `You matched on ${matches.length} movies!` : "It's a Match!"}
      </motion.h1>

      <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: 20, 
          width: '100%', 
          maxWidth: 800, 
          margin: '40px 0'
      }}>
        {matches.map((movie, index) => (
            <motion.div 
                key={movie.tmdbId}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}
            >
                <div style={{position: 'relative', width: '100%', aspectRatio: '2/3', borderRadius: 12, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'}}>
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
                         onClick={() => router.push(`/movie/${movie.tmdbId}`)}
                    >
                        Watch
                    </button>
                </div>
            </motion.div>
        ))}
      </div>

      <div className={styles.buttonGroup}>
        <button 
          className={styles.secondaryBtn}
          onClick={() => window.location.reload()}
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
