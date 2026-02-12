"use client";

import { useAction } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import styles from "./GenreFilter.module.css";

interface Genre {
  id: number;
  name: string;
}

interface GenreFilterProps {
  selectedGenres: number[];
  onGenreChange: (genreIds: number[]) => void;
  mediaType: "movie" | "tv";
}

export function GenreFilter({ selectedGenres, onGenreChange, mediaType }: GenreFilterProps) {
  const getGenres = useAction(api.tmdb.getGenres);
  const [genres, setGenres] = useState<Genre[]>([]);

  useEffect(() => {
    async function fetchGenres() {
      try {
        const data = await getGenres({ mediaType });
        setGenres((data as { genres: Genre[] }).genres);
      } catch (err) {
        console.error("Failed to fetch genres", err);
      }
    }
    fetchGenres();
  }, [getGenres, mediaType]);

  const toggleGenre = (genreId: number) => {
    if (selectedGenres.includes(genreId)) {
      onGenreChange(selectedGenres.filter((id) => id !== genreId));
    } else {
      onGenreChange([...selectedGenres, genreId]);
    }
  };

  return (
    <div className={styles.container}>
      {genres.map((genre) => {
        const isSelected = selectedGenres.includes(genre.id);
        return (
          <button
            key={genre.id}
            className={`${styles.chip} ${isSelected ? styles.selected : ""}`}
            onClick={() => toggleGenre(genre.id)}
          >
            {genre.name}
          </button>
        );
      })}
    </div>
  );
}
