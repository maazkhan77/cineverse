"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Sparkles, ArrowUpRight } from "lucide-react";
import styles from "./AIMovieCard.module.css";

export interface EnrichedMovie {
  title: string;
  year: number;
  reason: string;
  tmdbId: number | null;
  posterPath: string | null;
  voteAverage: number | null;
  mediaType: "movie" | "tv";
}

interface AIMovieCardProps {
  movie: EnrichedMovie;
}

export function AIMovieCard({ movie }: AIMovieCardProps) {
  const targetUrl = movie.tmdbId 
    ? `/${movie.mediaType || "movie"}/${movie.tmdbId}`
    : `/search?q=${encodeURIComponent(movie.title)}`;

  const posterUrl = movie.posterPath 
    ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
    : "/placeholder-poster.png";

  return (
    <Link 
      href={targetUrl}
      className={styles.movieCard}
      aria-label={`View details for ${movie.title}`}
    >
      <div className={styles.posterWrapper}>
        <Image
          src={posterUrl}
          alt={movie.title}
          fill
          className={styles.poster}
          sizes="(max-width: 768px) 50vw, 220px"
        />
        
        {/* Floating Top Badges */}
        <div className={styles.badgeRow}>
          {movie.voteAverage ? (
            <span className={styles.rating}>
              <Star size={11} className={styles.starIcon} />
              {movie.voteAverage.toFixed(1)}
            </span>
          ) : (
            <span />
          )}
          <span className={styles.mediaBadge}>
            {movie.mediaType === "tv" ? "TV" : "MOVIE"}
          </span>
        </div>
      </div>
      
      <div className={styles.cardInfo}>
        <div className={styles.titleRow}>
          <h4 className={styles.cardTitle}>{movie.title}</h4>
          {movie.year > 0 && <span className={styles.cardYear}>{movie.year}</span>}
        </div>

        {movie.reason && (
          <div className={styles.reasonContainer}>
            <div className={styles.reasonHeader}>
              <Sparkles size={11} className={styles.reasonIcon} />
              <span>AI Match Rationale</span>
            </div>
            <p className={styles.cardReason}>{movie.reason}</p>
          </div>
        )}

        <div className={styles.cardFooter}>
          <span>View Details</span>
          <ArrowUpRight size={13} className={styles.arrowIcon} />
        </div>
      </div>
    </Link>
  );
}

interface AIMovieGridProps {
  movies: EnrichedMovie[];
}

export function AIMovieGrid({ movies }: AIMovieGridProps) {
  return (
    <div className={styles.cardGrid}>
      {movies.map((movie, i) => (
        <AIMovieCard key={`${movie.title}-${i}-${movie.tmdbId}`} movie={movie} />
      ))}
    </div>
  );
}
