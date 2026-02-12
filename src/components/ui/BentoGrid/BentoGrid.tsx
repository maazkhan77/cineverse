"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./BentoGrid.module.css";

interface BentoItemProps {
  movie: any;
  variant?: "hero" | "vertical" | "wide" | "standard";
  priority?: boolean;
}

function BentoItem({ movie, variant = "standard", priority = false }: BentoItemProps) {
  const backdrop = movie.backdrop_path || movie.backdropPath;
  const poster = movie.poster_path || movie.posterPath;
  const hasImage = backdrop || poster;

  const imageUrl = backdrop 
    ? `https://image.tmdb.org/t/p/${variant === 'hero' ? 'original' : 'w1280'}${backdrop}`
    : poster 
      ? `https://image.tmdb.org/t/p/w780${poster}`
      : null; 

  const title = movie.title || movie.name || "Unknown";
  const releaseDate = movie.release_date || movie.releaseDate || movie.first_air_date;
  const voteAverage = movie.vote_average || movie.voteAverage || 0;
  const mediaType = movie.media_type || (movie.first_air_date ? "tv" : "movie");

  return (
    <Link 
      href={`/${mediaType}/${movie.id}`}
      className={`${styles.bentoItem} ${styles[variant]}`}
      style={!hasImage ? { background: 'linear-gradient(135deg, #1a1a2e, #16213e)' } : {}}
    >
      {hasImage && imageUrl && (
        <Image
          src={imageUrl}
          alt={title}
          fill
          className={styles.image}
          priority={priority}
          sizes={variant === 'hero' ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 50vw, 25vw'}
        />
      )}
      <div className={styles.overlay} />
      <div className={styles.content}>
        <div className={styles.badge}>
          <span className={styles.rating}>★ {voteAverage.toFixed(1)}</span>
          {releaseDate && <span className={styles.year}>{new Date(releaseDate).getFullYear()}</span>}
        </div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.subtitle}>{mediaType === "tv" ? "TV Series" : "Movie"}</p>
      </div>
      <div className={styles.playIcon}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      </div>
    </Link>
  );
}

interface BentoGridProps {
  movies: any[];
}

export function BentoGrid({ movies }: BentoGridProps) {
  if (!movies || movies.length < 5) return null;

  return (
    <section className={styles.gridContainer}>
      {/* Hero: Span 2x2 */}
      <BentoItem movie={movies[0]} variant="hero" priority />

      {/* Side items next to hero */}
      {movies.slice(1, 3).map((movie) => (
        <BentoItem key={movie.id} movie={movie} variant="standard" />
      ))}

      {/* Below hero or next row */}
      {movies.slice(3, 5).map((movie) => (
        <BentoItem key={movie.id} movie={movie} variant="standard" />
      ))}

      {/* Wide panoramic item */}
      {movies[5] && <BentoItem movie={movies[5]} variant="wide" />}

      {/* Additional items */}
      {movies.slice(6, 8).map((movie) => (
        <BentoItem key={movie.id} movie={movie} variant="standard" />
      ))}
    </section>
  );
}
