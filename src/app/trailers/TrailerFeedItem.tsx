"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import styles from "./TrailerFeed.module.css"; // We'll share styles

interface TrailerData {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  trailerKey: string;
  poster_path: string | null;
}

interface TrailerFeedItemProps {
  item: TrailerData;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export function TrailerFeedItem({ item, isActive, isMuted, onToggleMute }: TrailerFeedItemProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  // Manage playback state based on active prop
  useEffect(() => {
    if (isActive) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [isActive]);

  return (
    <div className={styles.feedItem}>
      {/* Video Background */}
      <div className={styles.videoContainer}>
        {/* Always render iframe when active for better loading */}
        {isActive && (
          <iframe
            src={`https://www.youtube.com/embed/${item.trailerKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${item.trailerKey}&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&enablejsapi=1&showinfo=0`}
            className={styles.videoFrame}
            style={{ 
              opacity: isReady ? 1 : 0,
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 2
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => {
              // Give iframe a moment to start playing
              setTimeout(() => setIsReady(true), 500);
            }}
          />
        )}
        
        {/* Poster - shows when not active or loading */}
        <img 
          src={item.poster_path 
            ? `https://image.tmdb.org/t/p/original${item.poster_path}`
            : '/placeholder.jpg'
          } 
          alt={item.title || item.name} 
          className={styles.posterBackground}
          style={{
            opacity: (isReady && isActive) ? 0 : 1,
            transition: 'opacity 0.5s ease-in-out',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1
          }}
        />
        
        {/* Loading Spinner */}
        {!isReady && isActive && (
          <div className={styles.loadingSpinner} style={{ zIndex: 3 }} />
        )}
      </div>

      {/* Overlay Content */}
      <div className={styles.overlay}>
        <div className={styles.overlayContent}>
          <h2 className={styles.movieTitle}>{item.title || item.name}</h2>
          <p className={styles.movieOverview}>{item.overview}</p>
          
          <div className={styles.actions}>
            <Link href={`/movie/${item.id}`} className={styles.viewButton}>
              View Details
            </Link>
            <button className={styles.muteButton} onClick={onToggleMute}>
              {isMuted ? "🔇 Unmute" : "🔊 Mute"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
