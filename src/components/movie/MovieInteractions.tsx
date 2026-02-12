"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { RatingModal } from "@/components/ui";
import { toast } from "sonner";
import styles from "../../app/movie/[id]/page.module.css";
import { motion } from "framer-motion";

interface MovieInteractionsProps {
  movieId: number;
  movieTitle: string;
  posterPath: string | null;
  voteAverage: number;
  trailerKey?: string;
}

export function MovieInteractions({ 
  movieId, 
  movieTitle, 
  posterPath, 
  voteAverage,
  trailerKey 
}: MovieInteractionsProps) {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();

  
  const [showTrailer, setShowTrailer] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);

  const isInWatchlist = useQuery(api.watchlist.isInWatchlist, { tmdbId: movieId });
  const userRating = useQuery(api.ratings.getUserRating, { tmdbId: movieId, mediaType: "movie" });
  const addToWatchlist = useMutation(api.watchlist.add);
  const removeFromWatchlist = useMutation(api.watchlist.remove);

  const handleWatchlistToggle = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/movie/${movieId}`);
      return;
    }

    setIsWatchlistLoading(true);
    try {
      if (isInWatchlist) {
        await removeFromWatchlist({ tmdbId: movieId });
        toast.info("Removed from watchlist");
      } else {
        await addToWatchlist({
          tmdbId: movieId,
          mediaType: "movie",
          title: movieTitle,
          posterPath: posterPath || undefined,
          voteAverage: voteAverage,
        });
        toast.success(`${movieTitle} added to watchlist!`);
      }
    } catch (error) {
      console.error("Failed to update watchlist:", error);
      toast.error("Failed to update watchlist");
    } finally {
      setIsWatchlistLoading(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/movie/${movieId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: movieTitle, url });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          await navigator.clipboard.writeText(url);
          toast.success("Link copied to clipboard!");
        }
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <>
      <motion.div 
        className={styles.actions}
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 }
        }}
        initial="hidden"
        animate="visible"
      >
        {trailerKey && (
            <button
              className={styles.playButton}
              onClick={() => setShowTrailer(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Watch Trailer
            </button>
        )}
          <button 
            className={`${styles.secondaryButton} ${isInWatchlist ? styles.inWatchlist : ""}`}
            onClick={handleWatchlistToggle}
            disabled={isWatchlistLoading}
          >
            {isInWatchlist ? (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                In Watchlist
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                Add to Watchlist
              </>
            )}
          </button>
          <button 
            className={`${styles.secondaryButton} ${userRating ? styles.activeRating : ""}`}
            onClick={() => {
              if (!isAuthenticated) {
                router.push(`/login?redirect=/movie/${movieId}`);
              } else {
                setIsRatingModalOpen(true);
              }
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={userRating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
               <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {userRating ? `Rated ${userRating.rating}/10` : "Rate This"}
          </button>
          <button 
            className={styles.secondaryButton}
            onClick={handleShare}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Share
          </button>
      </motion.div>

      {/* Trailer Modal */}
      {showTrailer && trailerKey && (
        <div className={styles.trailerModal} onClick={() => setShowTrailer(false)}>
          <div className={styles.trailerContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.closeTrailer}
              onClick={() => setShowTrailer(false)}
            >
              ✕
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              className={styles.trailerIframe}
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Rating Modal */}
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        tmdbId={movieId}
        mediaType="movie"
        title={movieTitle}
        initialRating={userRating?.rating}
        initialReview={userRating?.review}
      />
    </>
  );
}
