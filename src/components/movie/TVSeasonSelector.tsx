"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "../../app/tv/[id]/page.module.css";

interface Episode {
  id: number;
  name: string;
  episode_number: number;
  overview: string;
  still_path: string | null;
  vote_average: number;
  air_date: string;
  runtime: number;
}

interface TVSeasonSelectorProps {
  tvId: number;
  seasons: {
    id: number;
    name: string;
    season_number: number;
    episode_count: number;
  }[];
}

export function TVSeasonSelector({ tvId, seasons }: TVSeasonSelectorProps) {
  const [selectedSeason, setSelectedSeason] = useState(
    seasons.find(s => s.season_number === 1)?.season_number || seasons[0]?.season_number
  );
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchEpisodes() {
      setIsLoading(true);
      const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || "eec102d1a3eb8c2672da104a3ad39b56";
      try {
        const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${selectedSeason}?api_key=${apiKey}`);
        const data = await res.json();
        setEpisodes(data.episodes || []);
      } catch (err) {
        console.error("Failed to fetch season", err);
      } finally {
        setIsLoading(false);
      }
    }
    if (selectedSeason) {
        fetchEpisodes();
    }
  }, [tvId, selectedSeason]);

  if (!seasons || seasons.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Episodes</h2>
        <select
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(Number(e.target.value))}
          className={styles.seasonSelect}
        >
          {seasons.map((season) => (
            <option key={season.id} value={season.season_number}>
              {season.name} ({season.episode_count} episodes)
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className={styles.episodesLoading}>
          <div className={styles.spinner} />
        </div>
      ) : (
        <div className={styles.episodeGrid}>
          {episodes.map((ep) => (
            <div key={ep.id} className={styles.episodeCard}>
              <div className={styles.episodeImage}>
                {ep.still_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                    alt={ep.name}
                    fill
                    className={styles.episodeStill}
                  />
                ) : (
                  <div className={styles.noImage}>📺</div>
                )}
                <div className={styles.episodeNumber}>{ep.episode_number}</div>
              </div>
              <div className={styles.episodeInfo}>
                <h3 className={styles.episodeTitle}>{ep.name}</h3>
                <div className={styles.episodeMeta}>
                  {ep.vote_average > 0 && <span>★ {ep.vote_average.toFixed(1)}</span>}
                  {ep.runtime && <span>{ep.runtime}m</span>}
                  {ep.air_date && <span>{new Date(ep.air_date).toLocaleDateString()}</span>}
                </div>
                <p className={styles.episodeOverview}>
                  {ep.overview?.slice(0, 120) || "No description available"}
                  {ep.overview?.length > 120 ? "..." : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
