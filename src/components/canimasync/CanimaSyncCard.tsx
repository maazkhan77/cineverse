"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, X, Heart, Info, Star } from "lucide-react";
import styles from "./CanimaSyncCard.module.css";

// Dynamic import for ReactPlayer to avoid SSR issues
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

interface CanimaSyncCardProps {
  movie: any;
  isActive: boolean;
  onVote: (vote: "like" | "dislike") => void;
  onInfo: () => void;
  muted: boolean;
  onToggleMute: () => void;
  votingStats?: {
    count: number;
    profiles: Array<{ name: string; avatar: string }>; // Or just basic user info
  };
}

export function CanimaSyncCard({ 
  movie, 
  isActive, 
  onVote, 
  onInfo, 
  muted, 
  onToggleMute,
  votingStats 
}: CanimaSyncCardProps) {
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  // Find trailer on mount
  useEffect(() => {
    if (movie.videos) {
      const trailer = movie.videos.find(
        (v: any) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
      );
      if (trailer) {
        setTrailerUrl(`https://www.youtube.com/watch?v=${trailer.key}`);
      }
    }
  }, [movie]);

  // Delay showing video to allow poster to show first (smooth transition)
  useEffect(() => {
    if (isActive && trailerUrl) {
      const timer = setTimeout(() => {
        setShowVideo(true);
      }, 500); // 0.5s delay before trying to show video layer
      return () => clearTimeout(timer);
    } else {
      setShowVideo(false);
      setVideoReady(false);
    }
  }, [isActive, trailerUrl]);



  return (
    <div className={styles.card}>
      {/* Sound Toggle */}
      <button className={styles.soundToggle} onClick={(e) => { e.stopPropagation(); onToggleMute(); }}>
        {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      {/* Video Layer */}
      {isActive && trailerUrl && showVideo && (
        <div className={styles.videoLayer} style={{opacity: videoReady ? 1 : 0, transition: 'opacity 0.5s'}}>
           <ReactPlayer
              url={trailerUrl}
              width="100%"
              height="100%"
              playing={isActive}
              muted={muted}
              loop={true}
              controls={false}
              onReady={() => setVideoReady(true)}
              config={{
                youtube: {
                  playerVars: { showinfo: 0, controls: 0, modestbranding: 1, rel: 0, iv_load_policy: 3, autoplay: 1, playsinline: 1 }
                }
              }}
              style={{pointerEvents: 'none', transform: 'scale(1.3)'}} // Zoom in slightly to avoid black bars
           />
        </div>
      )}

      {/* Poster Layer (Background) - Always rendered but hidden if video playing */}
      <div className={`${styles.posterLayer} ${videoReady ? styles.hidden : ''}`}>
        {movie.posterPath ? (
           <Image
             src={`https://image.tmdb.org/t/p/original${movie.posterPath}`}
             alt={movie.title}
             fill
             style={{objectFit: 'cover'}}
             priority={isActive}
           />
        ) : (
          <div style={{width:'100%', height:'100%', background: '#222'}} />
        )}
      </div>

      {/* Gradient Overlay */}
      <div className={styles.overlay} />

      {/* Content & Controls */}
      <div className={styles.contentLayer}>
        <div className={styles.header}>
          <h2 className={styles.title}>{movie.title}</h2>
          <div className={styles.metaRow}>
            <div className={styles.ratingBadge}>
              {movie.voteAverage?.toFixed(1)}
            </div>
            <span className={styles.metaText}>{movie.releaseDate?.split('-')[0]}</span>
            {movie.runtime && <span className={styles.metaText}>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>}
          </div>
        </div>

        <p className={styles.description}>
          {movie.overview}
        </p>

        {/* Real-time Voting Stats */}
        {votingStats && votingStats.count > 0 && (
          <div className={styles.votingStats}>
            <Heart size={14} style={{color: '#ef4444'}} fill="#ef4444" />
            <div className={styles.avatars}>
              {votingStats.profiles.slice(0, 3).map((p, i) => (
                <div key={i} className={styles.avatar} style={{zIndex: 3-i}}>
                   {p.name.charAt(0)}
                </div>
              ))}
            </div>
            <span className={styles.voteText}>
              {votingStats.count} {votingStats.count === 1 ? 'person' : 'people'} liked this
            </span>
          </div>
        )}

        <div className={styles.controls}>
          <button className={`${styles.actionBtn} ${styles.dislikeBtn}`} onClick={() => onVote("dislike")}>
            <X size={28} />
          </button>
          
          <button className={styles.infoBtn} onClick={onInfo}>
             <Info size={18} />
             <span>Details</span>
          </button>

          <button className={`${styles.actionBtn} ${styles.likeBtn}`} onClick={() => onVote("like")}>
            <Heart size={28} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}
