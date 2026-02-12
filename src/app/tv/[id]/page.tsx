import Image from "next/image";
import Link from "next/link";
import { CommunityRating, ReviewList, WatchProviders } from "@/components/ui";
import styles from "./page.module.css";
import { TVInteractions } from "@/components/movie/TVInteractions";
import { TVSeasonSelector } from "@/components/movie/TVSeasonSelector";
import { getTVDetails } from "@/lib/tmdb";

export default async function TVDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getTVDetails(id).catch(e => {
     console.error("Failed to fetch TV data", e);
     return null;
  });

  if (!data) {
    return (
      <main className={styles.main}>
        <div className={styles.error}>
          <h2>TV Show not found</h2>
          <Link href="/series" className={styles.backButton}>Go Back</Link>
        </div>
      </main>
    );
  }

  const { details, cast, similar, trailer } = data;
  const regularSeasons = details.seasons?.filter((s: any) => s.season_number > 0) || [];

  return (
    <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          {details.backdrop_path && (
            <div className={styles.backdropWrapper}>
                <Image
                src={`https://image.tmdb.org/t/p/original${details.backdrop_path}`}
                alt={details.name}
                fill
                className={styles.backdrop}
                priority
                />
            </div>
          )}
          <div className={styles.heroGradient} />

          {/* Back Button */}
          <Link href="/series" className={styles.backNav}>
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
                  alt={details.name}
                  width={200}
                  height={300}
                  className={styles.posterImage}
                />
              </div>
            )}

            {/* Info */}
            <div className={styles.heroInfo}>
              {details.tagline && <p className={styles.tagline}>{details.tagline}</p>}
              
              <h1 className={styles.title}>{details.name}</h1>

              <div className={styles.meta}>
                <span className={styles.rating}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  {details.vote_average?.toFixed(1)}
                </span>
                {details.first_air_date && (
                  <span>{new Date(details.first_air_date).getFullYear()}</span>
                )}
                <span>{details.number_of_seasons} Season{details.number_of_seasons !== 1 ? 's' : ''}</span>
                <span>{details.number_of_episodes} Episodes</span>
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
              <TVInteractions 
                tvId={details.id}
                tvName={details.name}
                posterPath={details.poster_path}
                voteAverage={details.vote_average}
                trailerKey={trailer?.key}
              />

              {details["watch/providers"] && (
                <div className={styles.watchProvidersWrapper}>
                  <WatchProviders providers={details["watch/providers"]} />
                </div>
              )}
              
               <div className={styles.communityRatingWrapper}>
                 <CommunityRating tmdbId={details.id} mediaType="tv" />
               </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <div className={styles.content}>
          {/* Episodes Section */}
          <TVSeasonSelector tvId={details.id} seasons={regularSeasons} />

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
             <ReviewList tmdbId={details.id} mediaType="tv" />
          </section>

          {/* Show Details Grid */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Details</h2>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Status</span>
                <span className={styles.detailValue}>{details.status}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>First Aired</span>
                <span className={styles.detailValue}>
                  {details.first_air_date
                    ? new Date(details.first_air_date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "TBA"}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Last Aired</span>
                <span className={styles.detailValue}>
                  {details.last_air_date
                    ? new Date(details.last_air_date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Ongoing"}
                </span>
              </div>
              {details.created_by?.length > 0 && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Created By</span>
                  <span className={styles.detailValue}>
                    {details.created_by.map((c: any) => c.name).join(", ")}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Similar Shows */}
          {similar.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>More Like This</h2>
              <div className={styles.similarGrid}>
                {similar.map((show: any) => (
                  <Link
                    href={`/tv/${show.id}`}
                    key={show.id}
                    className={styles.similarCard}
                  >
                    <div className={styles.similarPoster}>
                      {show.poster_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w342${show.poster_path}`}
                          alt={show.name}
                          fill
                          className={styles.similarImage}
                        />
                      ) : (
                        <div className={styles.noPoster}>📺</div>
                      )}
                      <div className={styles.similarRating}>
                        ★ {show.vote_average.toFixed(1)}
                      </div>
                    </div>
                    <p className={styles.similarTitle}>{show.name}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
    </main>
  );
}
