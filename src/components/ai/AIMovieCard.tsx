"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const handleClick = () => {
    if (movie.tmdbId) {
      router.push(`/${movie.mediaType}/${movie.tmdbId}`);
    }
  };

  const posterUrl = movie.posterPath 
    ? `https://image.tmdb.org/t/p/w300${movie.posterPath}`
    : null;

  return (
    <div 
      className={styles.movieCard}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      <div className={styles.posterWrapper}>
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={movie.title}
            fill
            className={styles.poster}
            sizes="(max-width: 768px) 50vw, 180px"
          />
        ) : (
          <div className={styles.noPoster}>🎬</div>
        )}
        {movie.voteAverage && (
          <span className={styles.rating}>⭐ {movie.voteAverage.toFixed(1)}</span>
        )}
      </div>
      
      <div className={styles.cardInfo}>
        <h4 className={styles.cardTitle}>{movie.title}</h4>
        <div className={styles.cardMeta}>
          <span>{movie.year}</span>
          <span className={styles.mediaType}>{movie.mediaType}</span>
        </div>
        <p className={styles.cardReason}>{movie.reason}</p>
      </div>
    </div>
  );
}

interface AIMovieGridProps {
  movies: EnrichedMovie[];
}

export function AIMovieGrid({ movies }: AIMovieGridProps) {
  return (
    <div className={styles.cardGrid}>
      {movies.map((movie, i) => (
        <AIMovieCard key={`${movie.title}-${i}`} movie={movie} />
      ))}
    </div>
  );
}
