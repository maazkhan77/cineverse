"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useConvexAuth, useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import styles from "./ContentModal.module.css";
import { ImageGallery } from "../ImageGallery";
import { RatingBadges, StarRating } from "../StarRating";
import { TrailerPlayer } from "../TrailerPlayer";

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  id: number;
  mediaType: "movie" | "tv";
}

interface EnrichedContent {
  tmdb: {
    id: number;
    title: string;
    overview: string;
    posterPath: string | null;
    backdropPath: string | null;
    releaseDate: string | null;
    voteAverage: number;
    genres: Array<{ id: number; name: string }>;
  };
  trailer: {
    youtubeKey: string | null;
    name: string | null;
  } | null;
  ratings: {
    tmdb: number;
    imdb: number | null;
    rottenTomatoes: number | null;
    metacritic: number | null;
    community: {
      average: number | null;
      total: number;
    };
  };
  meta: {
    awards: string | null;
    boxOffice: string | null;
    rated: string | null;
    runtime: string | null;
  };
}

interface RecommendedItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  vote_average: number;
}

export function ContentModal({ isOpen, onClose, id, mediaType }: ContentModalProps) {
  const [enrichedData, setEnrichedData] = useState<EnrichedContent | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [images, setImages] = useState<{ file_path: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);

  const { isAuthenticated } = useConvexAuth();
  
  // Convex queries and mutations
  const isInWatchlist = useQuery(
    api.watchlist.isInWatchlist,
    isAuthenticated && id ? { tmdbId: id } : "skip"
  );
  const existingUserRating = useQuery(
    api.ratings.getUserRating,
    isAuthenticated && id ? { tmdbId: id, mediaType } : "skip"
  );
  
  const addToWatchlist = useMutation(api.watchlist.add);
  const removeFromWatchlist = useMutation(api.watchlist.remove);
  const rateContent = useMutation(api.ratings.rateContent);
  const trackView = useMutation(api.stats.trackView);
  
  // Action to fetch enriched content
  const getEnrichedContent = useAction(api.enrichment.getEnrichedContent);

  // Fetch enriched data on open
  useEffect(() => {
    if (!isOpen) return;

    async function fetchData() {
      setIsLoading(true);
      setShowTrailer(false);
      setUserRating(existingUserRating?.rating || null);
      
      try {
        // Fetch enriched data from Convex (cached)
        const enriched = await getEnrichedContent({ tmdbId: id, mediaType });
        setEnrichedData(enriched);

        // Track view
        trackView({ tmdbId: id, mediaType });

        // Fetch recommendations and images directly (not cached)
        const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        const [recsRes, imagesRes] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/${mediaType}/${id}/recommendations?api_key=${apiKey}`),
          fetch(`https://api.themoviedb.org/3/${mediaType}/${id}/images?api_key=${apiKey}`),
        ]);

        if (recsRes.ok) {
          const recsData = await recsRes.json();
          setRecommendations(recsData.results?.slice(0, 10) || []);
        }
        if (imagesRes.ok) {
          const imagesData = await imagesRes.json();
          setImages(imagesData.backdrops || []);
        }
      } catch (err) {
        console.error("Failed to fetch details", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [isOpen, id, mediaType, getEnrichedContent, trackView, existingUserRating?.rating]);

  // Update user rating when it changes
  useEffect(() => {
    if (existingUserRating?.rating) {
      setUserRating(existingUserRating.rating);
    }
  }, [existingUserRating]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleWatchlistToggle = async () => {
    if (!enrichedData) return;
    
    if (isInWatchlist) {
      await removeFromWatchlist({ tmdbId: id });
    } else {
      await addToWatchlist({
        tmdbId: id,
        mediaType,
        title: enrichedData.tmdb.title,
        posterPath: enrichedData.tmdb.posterPath || undefined,
        voteAverage: enrichedData.tmdb.voteAverage,
      });
    }
  };

  const handleRate = async (rating: number) => {
    setUserRating(rating);
    await rateContent({ tmdbId: id, mediaType, rating });
  };

  const title = enrichedData?.tmdb.title || "";
  const releaseDate = enrichedData?.tmdb.releaseDate || "";
  const year = releaseDate ? new Date(releaseDate).getFullYear() : "";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <button className={styles.closeButton} onClick={onClose}>
              ✕
            </button>

            {isLoading ? (
              <div className={styles.loading}>Loading...</div>
            ) : enrichedData ? (
              <>
                <div className={styles.hero}>
                  {enrichedData.tmdb.backdropPath ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/original${enrichedData.tmdb.backdropPath}`}
                      alt={title}
                      fill
                      className={styles.backdropImage}
                    />
                  ) : null}
                  <div className={styles.heroGradient} />
                </div>

                <div className={styles.content}>
                  <h2 className={styles.title}>{title}</h2>

                  {/* Rating Badges - NEW */}
                  <div className={styles.ratingsSection}>
                    <RatingBadges
                      ratings={{
                        tmdb: enrichedData.ratings.tmdb,
                        imdb: enrichedData.ratings.imdb,
                        rottenTomatoes: enrichedData.ratings.rottenTomatoes,
                        metacritic: enrichedData.ratings.metacritic,
                        community: enrichedData.ratings.community,
                      }}
                    />
                  </div>

                  <div className={styles.meta}>
                    {year && <span>{year}</span>}
                    {enrichedData.meta.runtime && <span>{enrichedData.meta.runtime}</span>}
                    {enrichedData.meta.rated && (
                      <span className={styles.ratedBadge}>{enrichedData.meta.rated}</span>
                    )}
                  </div>

                  {/* Awards */}
                  {enrichedData.meta.awards && (
                    <div className={styles.awards}>
                      🏆 {enrichedData.meta.awards}
                    </div>
                  )}

                  <div className={styles.genres}>
                    {enrichedData.tmdb.genres.map((g) => (
                      <span key={g.id} className={styles.genre}>
                        {g.name}
                      </span>
                    ))}
                  </div>

                  <p className={styles.overview}>{enrichedData.tmdb.overview}</p>

                  {/* User Rating - NEW */}
                  {isAuthenticated && (
                    <div className={styles.userRating}>
                      <span className={styles.userRatingLabel}>Your Rating:</span>
                      <StarRating
                        rating={userRating}
                        interactive={true}
                        onRate={handleRate}
                        size="lg"
                      />
                    </div>
                  )}

                  <div className={styles.actions}>
                    {enrichedData.trailer?.youtubeKey && (
                      <button
                        className={styles.trailerButton}
                        onClick={() => setShowTrailer(true)}
                      >
                        ▶ Watch Trailer
                      </button>
                    )}
                    {images.length > 0 && (
                      <button
                        className={styles.pillsButton}
                        onClick={() => setShowGallery(true)}
                      >
                        📷 Gallery
                      </button>
                    )}
                    {isAuthenticated && (
                      <button
                        className={`${styles.watchlistButton} ${isInWatchlist ? styles.inWatchlist : ""}`}
                        onClick={handleWatchlistToggle}
                      >
                        {isInWatchlist ? "✓ In Watchlist" : "+ Add to Watchlist"}
                      </button>
                    )}
                  </div>

                  {/* Box Office */}
                  {enrichedData.meta.boxOffice && (
                    <div className={styles.boxOffice}>
                      💰 Box Office: {enrichedData.meta.boxOffice}
                    </div>
                  )}

                  {/* Recommendations */}
                  {recommendations.length > 0 && (
                    <div className={styles.recommendations}>
                      <h3 className={styles.recsTitle}>You Might Also Like</h3>
                      <div className={styles.recsGrid}>
                        {recommendations.map((rec) => (
                          <div key={rec.id} className={styles.recCard}>
                            {rec.poster_path ? (
                              <Image
                                src={`https://image.tmdb.org/t/p/w185${rec.poster_path}`}
                                alt={rec.title || rec.name || ""}
                                width={100}
                                height={150}
                                className={styles.recPoster}
                              />
                            ) : (
                              <div className={styles.recNoPoster}>No Image</div>
                            )}
                            <span className={styles.recTitle}>
                              {rec.title || rec.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.error}>Failed to load details</div>
            )}
          </motion.div>
          
          {/* Trailer Modal */}
          {showTrailer && enrichedData?.trailer?.youtubeKey && (
            <TrailerPlayer
              youtubeKey={enrichedData.trailer.youtubeKey}
              title={title}
              onClose={() => setShowTrailer(false)}
            />
          )}
          
          <ImageGallery
            isOpen={showGallery}
            onClose={() => setShowGallery(false)}
            images={images}
          />
        </>
      )}
    </AnimatePresence>
  );
}
