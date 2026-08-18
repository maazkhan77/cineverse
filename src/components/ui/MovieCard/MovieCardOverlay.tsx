"use client";

import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import styles from "./MovieCardOverlay.module.css";
import { useEffect, useState } from "react";
import { useConvexAuth, useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface MovieCardOverlayProps {
  isOpen: boolean;
  rect: DOMRect | null;
  movie: {
    id: number;
    title?: string;
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

// Internal component for Watchlist logic to keep main component clean
interface WatchlistButtonProps {
  movieId: number;
  movieTitle?: string;
  posterPath?: string | null;
  voteAverage: number;
  mediaType: "movie" | "tv";
}

function WatchlistButton({ movieId, movieTitle, posterPath, voteAverage, mediaType }: WatchlistButtonProps) {
  const { isAuthenticated } = useConvexAuth();
  const isInWatchlist = useQuery(api.watchlist.isInWatchlist, { tmdbId: movieId });
  const addToWatchlist = useMutation(api.watchlist.add);
  const removeFromWatchlist = useMutation(api.watchlist.remove);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Please login to use watchlist");
      return; 
    }
    
    setIsLoading(true);
    try {
      if (isInWatchlist) {
        await removeFromWatchlist({ tmdbId: movieId });
        toast.info("Removed from watchlist");
      } else {
        await addToWatchlist({
          tmdbId: movieId,
          mediaType,
          title: movieTitle || "Untitled",
          posterPath: posterPath || undefined,
          voteAverage,
        });
        toast.success("Added to watchlist");
      }
    } catch (_err) {
      toast.error("Failed to update watchlist");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      className={styles.actionBtn} 
      onClick={handleToggle}
      disabled={isLoading}
      style={isInWatchlist ? { color: 'var(--color-success)', borderColor: 'var(--color-success)' } : {}}
    >
      {isInWatchlist ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
           <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      )}
    </button>
  );
}

import { TrailerModal } from "@/components/ui/TrailerModal/TrailerModal";

export function MovieCardOverlay({ isOpen, rect, movie, onClose, onMouseEnter, onClick }: MovieCardOverlayProps) {
  const mounted = typeof window !== "undefined";
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  
  const getTrailer = useAction(api.tmdb.getTrailer);

  useEffect(() => {
    if (isOpen) {
        getTrailer({ id: movie.id, mediaType: movie.mediaType })
            .then((key) => setTrailerKey(key))
            .catch((e) => console.error("Failed to fetch trailer", e));
    }
  }, [isOpen, movie.id, movie.mediaType, getTrailer]);

  if (!mounted || !rect || typeof document === 'undefined') return null;

  // IMPORTANT: If playing trailer, we render the Modal INSTEAD of the popover.
  // This effectively "closes" the popover UI but keeps the component mounted to render the portal.
  if (showTrailer && trailerKey) {
     return (
       <TrailerModal 
         trailerKey={trailerKey}
         onClose={() => {
           setShowTrailer(false);
           onClose(); // Close the overlay completely when trailer closes
         }}
       />
     );
  }

  // Dimensions matching the home card exactly
  const width = rect.width;
  const imageHeight = rect.height;
  const contentHeight = 110;
  const totalHeight = imageHeight + contentHeight;

  let left = rect.left;
  let top = rect.top;

  const padding = 16;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Clamp horizontal edges
  if (left + width > viewportWidth - padding) {
      left = viewportWidth - width - padding;
  }
  if (left < padding) {
      left = padding;
  }

  // Clamp vertical edges (ensure bottommost cards don't get cut off)
  if (top + totalHeight > viewportHeight - padding) {
      top = viewportHeight - totalHeight - padding;
  }
  if (top < padding + 70) {
      top = padding + 70;
  }

  const poster = movie.posterPath;
  const imageUrl = poster 
    ? `https://image.tmdb.org/t/p/w500${poster}`
    : "/placeholder-poster.png";

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
               position: 'absolute',
            }}
            initial={{ 
              opacity: 0, 
              width: rect.width, 
              height: rect.height,
              top: rect.top,
              left: rect.left,
              scale: 0.98
            }}
            animate={{ 
              opacity: 1, 
              width: width, 
              height: "auto", 
              top: top,
              left: left,
              scale: 1,
              transition: { duration: 0.18, ease: "easeOut" }
            }}
            exit={{ 
              opacity: 0,
              scale: 0.96,
              transition: { duration: 0.12 }
            }}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            {/* Image Section - Exactly identical to home card */}
            <div className={styles.imageWrapper}>
              <Image
                src={imageUrl}
                alt={title}
                fill
                className={styles.image}
                sizes="300px"
              />
            </div>

            {/* Content Section */}
            <div className={styles.content}>
               {/* Actions */}
               <div className={styles.actions}>
                <button 
                   className={`${styles.actionBtn} ${styles.playBtn}`}
                   onClick={(e) => {
                     e.stopPropagation();
                     if (trailerKey) {
                        setShowTrailer(true);
                     } else {
                        onClick();
                     }
                   }}
                 >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                     <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
                <WatchlistButton 
                  movieId={movie.id} 
                  movieTitle={movie.title}
                  posterPath={movie.posterPath}
                  voteAverage={movie.voteAverage}
                  mediaType={movie.mediaType}
                />
                <button 
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                  }}
                >
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                     <circle cx="12" cy="12" r="10" />
                     <path d="M12 16v-4M12 8h.01" />
                  </svg>
                </button>
              </div>

              <div className={styles.header}>
                <div>
                   <h2 className={styles.title}>{movie.title || "Untitled"}</h2>
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
