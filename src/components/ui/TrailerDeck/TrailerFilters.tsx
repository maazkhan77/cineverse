"use client";

import { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Film, Tv, Sparkles, ChevronDown } from "lucide-react";
import styles from "./TrailerFilters.module.css";

type MediaType = "all" | "movie" | "tv";

interface Genre {
  id: number;
  name: string;
}

interface TrailerFiltersProps {
  mediaType: MediaType;
  genreId: number | null;
  onMediaTypeChange: (type: MediaType) => void;
  onGenreChange: (genreId: number | null) => void;
}

export function TrailerFilters({
  mediaType,
  genreId,
  onMediaTypeChange,
  onGenreChange,
}: TrailerFiltersProps) {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const getGenres = useAction(api.tmdb.getGenres);

  // Fetch genres when mediaType changes
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        // Use movie genres by default, or TV genres if TV selected
        const type = mediaType === "tv" ? "tv" : "movie";
        const data = await getGenres({ mediaType: type });
        setGenres(data.genres || []);
      } catch (err) {
        console.error("Failed to fetch genres", err);
      }
    };
    fetchGenres();
  }, [mediaType, getGenres]);

  const selectedGenreName = genreId
    ? genres.find((g) => g.id === genreId)?.name || "Select Genre"
    : "All Genres";

  return (
    <div className={styles.filterBar}>
      {/* Content Type Toggle */}
      <div className={styles.toggleGroup}>
        <button
          className={`${styles.toggleButton} ${mediaType === "all" ? styles.active : ""}`}
          onClick={() => onMediaTypeChange("all")}
        >
          <Sparkles size={16} />
          All
        </button>
        <button
          className={`${styles.toggleButton} ${mediaType === "movie" ? styles.active : ""}`}
          onClick={() => onMediaTypeChange("movie")}
        >
          <Film size={16} />
          Movies
        </button>
        <button
          className={`${styles.toggleButton} ${mediaType === "tv" ? styles.active : ""}`}
          onClick={() => onMediaTypeChange("tv")}
        >
          <Tv size={16} />
          TV Shows
        </button>
      </div>

      {/* Genre Dropdown */}
      <div className={styles.dropdown}>
        <button
          className={styles.dropdownTrigger}
          onClick={() => setShowGenreDropdown(!showGenreDropdown)}
        >
          {selectedGenreName}
          <ChevronDown size={16} className={showGenreDropdown ? styles.rotated : ""} />
        </button>

        {showGenreDropdown && (
          <div className={styles.dropdownMenu}>
            <button
              className={`${styles.dropdownItem} ${!genreId ? styles.selected : ""}`}
              onClick={() => {
                onGenreChange(null);
                setShowGenreDropdown(false);
              }}
            >
              All Genres
            </button>
            {genres.map((genre) => (
              <button
                key={genre.id}
                className={`${styles.dropdownItem} ${genreId === genre.id ? styles.selected : ""}`}
                onClick={() => {
                  onGenreChange(genre.id);
                  setShowGenreDropdown(false);
                }}
              >
                {genre.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
