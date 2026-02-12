import Image from "next/image";
import Link from "next/link";
import { CommunityRating, ReviewList, WatchProviders } from "@/components/ui";
import styles from "./page.module.css";
import { MovieInteractions } from "@/components/movie/MovieInteractions";
import { getMovieDetails } from "@/lib/tmdb";

const formatRuntime = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${hours}h ${minutes}m`;
  };

  const formatMoney = (amount: number) => {
    if (amount === 0) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

export default async function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getMovieDetails(id).catch(e => {
     console.error("Failed to fetch movie data", e);
     return null;
  });

  if (!data) {
    return (
      <main className={styles.main}>
        <div className={styles.error}>
          <h2>Movie not found</h2>
          <Link href="/movies" className={styles.backButton}>Go Back</Link>
        </div>
      </main>
    );
  }

  const { details, cast, similar, trailer } = data;

  return (
    <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          {details.backdrop_path && (
            <div className={styles.backdropWrapper}>
                <Image
                src={`https://image.tmdb.org/t/p/original${details.backdrop_path}`}
                alt={details.title}
                fill
                className={styles.backdrop}
                priority
                />
            </div>
          )}
          <div className={styles.heroGradient} />

          {/* Back Button */}
          <Link href="/movies" className={styles.backNav}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </Link>

          {/* Hero Content */}
          <div className={styles.heroContent}>
            {/* Poster */}
            {details.poster_path && (
              <div className={styles.poster}>
                <Image
                  src={`https://image.tmdb.org/t/p/w500${details.poster_path}`}
                  alt={details.title}
                  width={300}
                  height={450}
                  className={styles.posterImage}
                  priority
                />
              </div>
            )}

            {/* Info */}
            <div className={styles.heroInfo}>
              {details.tagline && <p className={styles.tagline}>{details.tagline}</p>}
              
              <h1 className={styles.title}>{details.title}</h1>

              <div className={styles.meta}>
                <span className={styles.rating}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  {details.vote_average?.toFixed(1)}
                </span>
                {details.release_date && (
                  <span>{new Date(details.release_date).getFullYear()}</span>
                )}
                {details.runtime > 0 && (
                  <span>{formatRuntime(details.runtime)}</span>
                )}
              </div>

              <div className={styles.genres}>
                {details.genres?.map((g: any) => (
                  <span key={g.id} className={styles.genre}>
                    {g.name}
                  </span>
                ))}
              </div>

              <p className={styles.overview}>{details.overview}</p>

              {/* Client Interactions */}
              <MovieInteractions 
                movieId={details.id}
                movieTitle={details.title}
                posterPath={details.poster_path}
                voteAverage={details.vote_average}
                trailerKey={trailer?.key}
              />

              {details["watch/providers"] && (
                <div className={styles.providersWrapper}>
                  <WatchProviders providers={details["watch/providers"]} />
                </div>
              )}
              
               <div className={styles.communityRatingWrapper}>
                 <CommunityRating tmdbId={details.id} mediaType="movie" />
               </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <div className={styles.content}>
          {/* Cast */}
          {cast.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Cast</h2>
              <div className={styles.castScroll}>
                {cast.map((person: any) => (
                  <Link
                    href={`/person/${person.id}`}
                    key={person.id}
                    className={styles.castCard}
                  >
                    <div className={styles.castImage}>
                      {person.profile_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                          alt={person.name}
                          fill
                          className={styles.castPhoto}
                        />
                      ) : (
                        <div className={styles.noPhoto}>👤</div>
                      )}
                    </div>
                    <div className={styles.castInfo}>
                      <p className={styles.castName}>{person.name}</p>
                      <p className={styles.castCharacter}>{person.character}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className={styles.section}>
             <ReviewList tmdbId={details.id} mediaType="movie" />
          </section>

          {/* Details Grid */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Details</h2>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Status</span>
                <span className={styles.detailValue}>{details.status}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Release Date</span>
                <span className={styles.detailValue}>
                  {details.release_date
                    ? new Date(details.release_date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "TBA"}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Budget</span>
                <span className={styles.detailValue}>{formatMoney(details.budget)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Revenue</span>
                <span className={styles.detailValue}>{formatMoney(details.revenue)}</span>
              </div>
            </div>
          </section>

          {/* Similar Movies */}
          {similar.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>More Like This</h2>
              <div className={styles.similarGrid}>
                {similar.map((movie: any) => (
                  <Link
                    href={`/movie/${movie.id}`}
                    key={movie.id}
                    className={styles.similarCard}
                  >
                    <div className={styles.similarPoster}>
                      {movie.poster_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                          alt={movie.title}
                          fill
                          className={styles.similarImage}
                        />
                      ) : (
                        <div className={styles.noPoster}>🎬</div>
                      )}
                      <div className={styles.similarRating}>
                        ★ {movie.vote_average.toFixed(1)}
                      </div>
                    </div>
                    <p className={styles.similarTitle}>{movie.title}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
    </main>
  );
}
