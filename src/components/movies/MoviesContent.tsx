"use client";

import { MovieCard } from "@/components/ui/MovieCard";
import { useDiscoverMoviesInfinite } from "@/hooks/useTMDB";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
import { SlidersHorizontal, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/Sheet/Sheet";
import { GenreFilter } from "@/components/ui/GenreFilter";
import styles from "@/app/movies/page.module.css";

interface FilterState {
  minRating: number;
  sortBy: string;
  withGenres: string;
  maxRuntime?: number;
}

const SORT_OPTIONS = [
  { label: "Popularity Descending", value: "popularity.desc" },
  { label: "Popularity Ascending", value: "popularity.asc" },
  { label: "Rating Descending", value: "vote_average.desc" },
  { label: "Rating Ascending", value: "vote_average.asc" },
  { label: "Release Date Newest", value: "primary_release_date.desc" },
  { label: "Release Date Oldest", value: "primary_release_date.asc" },
];

export default function MoviesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // Initialize filters from URL query params (from navbar genre links)
  const initialGenre = searchParams.get("genre");
  const initialSort = searchParams.get("sort");

  const [filters, setFilters] = useState<FilterState>(() => ({
    minRating: 0,
    sortBy: initialSort || "popularity.desc",
    withGenres: initialGenre || "",
  }));

  // TanStack Query for infinite scrolling with automatic race condition handling
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useDiscoverMoviesInfinite(filters);

  // Flatten pages into a single array
  const movies = useMemo(() => {
    return data?.pages.flatMap((page) => page.results) ?? [];
  }, [data]);

  // Intersection Observer for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Show error toast
  useEffect(() => {
    if (isError) {
      toast.error("Failed to load movies", {
        description: (error as Error)?.message || "Please try again later.",
      });
    }
  }, [isError, error]);

  const handleFilterApply = (newFilters: FilterState) => {
    setFilters(newFilters);
    setIsFilterOpen(false);
    toast.success("Filters applied");
  };

  const handleReset = () => {
    setFilters({
      minRating: 0,
      sortBy: "popularity.desc",
      withGenres: "",
    });
  };

  const handleItemClick = (id: number) => {
    router.push(`/movie/${id}`);
  };

  const formatRuntime = (mins: number) => {
    if (mins === 0) return "Any";
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${hours}h ${minutes}m`;
  };

  const activeFilterCount = (filters.withGenres ? 1 : 0) + (filters.minRating > 0 ? 1 : 0) + (filters.sortBy !== "popularity.desc" ? 1 : 0) + (filters.maxRuntime && filters.maxRuntime > 0 ? 1 : 0);

  return (
    <>
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Movies</h1>
            <p className={styles.subtitle}>Explore popular movies</p>
          </div>
          <button
            className={`${styles.filterButton} ${activeFilterCount > 0 ? styles.filterButtonActive : ""}`}
            onClick={() => setIsFilterOpen(true)}
            aria-label="Open movie filters"
          >
            <span className={styles.filterIconWrapper}>
              <SlidersHorizontal size={15} />
            </span>
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className={styles.activeFilterBadge}>{activeFilterCount}</span>
            )}
          </button>
        </header>

        <section className={styles.content}>
          {isLoading && (
            <div className={styles.loadingState}>
              <Loader2 className={styles.spinner} size={32} />
              <p>Loading movies...</p>
            </div>
          )}

          {isError && (
            <div className={styles.error}>
              Failed to load movies. Please try again.
            </div>
          )}

          <div className={styles.grid}>
            {movies.map((movie, index) => (
              <MovieCard
                key={`${movie.id}-${index}`}
                id={movie.id}
                title={movie.title || ""}
                posterPath={movie.poster_path}
                voteAverage={movie.vote_average}
                mediaType="movie"
                releaseDate={movie.release_date}
                onClick={() => handleItemClick(movie.id)}
              />
            ))}
          </div>

          {!isLoading && movies.length === 0 && (
            <div className={styles.noResults}>
              <span className={styles.noResultsIcon}>🎬</span>
              <p>No movies found matching your filters.</p>
              <button className={styles.resetButton} onClick={handleReset}>
                Reset Filters
              </button>
            </div>
          )}

          {/* Infinite scroll sentinel */}
          {hasNextPage && movies.length > 0 && (
            <div ref={loadMoreRef} className={styles.loadMore}>
              {isFetchingNextPage && (
                <div className={styles.loadingMoreIndicator}>
                  <Loader2 className={styles.spinner} size={24} />
                  <span>Loading more...</span>
                </div>
              )}
            </div>
          )}

          {/* End of results message */}
          {!hasNextPage && movies.length > 0 && (
            <div className={styles.endMessage}>
              You&apos;ve seen all {movies.length} movies
            </div>
          )}
        </section>


      </main>

      {/* Filter Sheet (Radix-based, accessible) */}
      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Filters & Sort</SheetTitle>
          </SheetHeader>

          <div style={{ padding: "16px 24px", flex: 1, overflowY: "auto" }}>
            {/* Sort */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: "var(--color-text)" }}>
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, sortBy: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--color-input-border)",
                  background: "var(--color-input-bg)",
                  color: "var(--color-input-text)",
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} style={{ background: "var(--color-surface)", color: "var(--color-text)" }}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Runtime */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: "var(--color-text)" }}>
                Max Duration: {formatRuntime(filters.maxRuntime || 0)}
              </label>
              <input
                type="range"
                min="0"
                max="240"
                step="15"
                value={filters.maxRuntime || 0}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    maxRuntime: Number(e.target.value),
                  }))
                }
                style={{ width: "100%", accentColor: "var(--color-accent)" }}
              />
            </div>

            {/* Min Rating */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: "var(--color-text)" }}>
                Minimum Rating: {filters.minRating}+
              </label>
              <input
                type="range"
                min="0"
                max="9"
                step="1"
                value={filters.minRating}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    minRating: Number(e.target.value),
                  }))
                }
                style={{ width: "100%", accentColor: "var(--color-accent)" }}
              />
            </div>

            {/* Genres */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: "var(--color-text)" }}>
                Genres
              </label>
              <GenreFilter
                selectedGenres={
                  filters.withGenres
                    ? filters.withGenres.split(",").map(Number)
                    : []
                }
                onGenreChange={(ids) =>
                  setFilters((prev) => ({ ...prev, withGenres: ids.join(",") }))
                }
                mediaType="movie"
              />
            </div>
          </div>

          <SheetFooter>
            <button
              onClick={handleReset}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-text)",
                cursor: "pointer",
              }}
            >
              Reset
            </button>
            <button
              onClick={() => handleFilterApply(filters)}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: "var(--color-accent)",
                color: "var(--color-text-on-accent, #ffffff)",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Show Results
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
