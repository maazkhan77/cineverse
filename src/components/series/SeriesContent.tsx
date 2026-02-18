"use client";

import { MovieCard } from "@/components/ui";
import { useDiscoverSeriesInfinite } from "@/hooks/useTMDB";
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
import { useUIStore } from "@/stores/uiStore";
import styles from "@/app/movies/page.module.css"; // Reusing movies styles

interface FilterState {
  minRating: number;
  sortBy: string;
  withGenres: string;
  region?: string;
  maxRuntime?: number;
}

const SORT_OPTIONS = [
  { label: "Popularity Descending", value: "popularity.desc" },
  { label: "Popularity Ascending", value: "popularity.asc" },
  { label: "Rating Descending", value: "vote_average.desc" },
  { label: "Rating Ascending", value: "vote_average.asc" },
  { label: "First Air Date Newest", value: "first_air_date.desc" },
  { label: "First Air Date Oldest", value: "first_air_date.asc" },
];

export default function SeriesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const selectedRegions = useUIStore((s) => s.selectedRegions);
  const [filters, setFilters] = useState<FilterState>({
    minRating: 0,
    sortBy: "popularity.desc",
    withGenres: "",
  });

  // Sync global region store into filters
  const activeFilters = useMemo(() => ({
    ...filters,
    region: selectedRegions[0] || "IN",
  }), [filters, selectedRegions]);

  // Sync URL query params (from navbar genre links) into filter state
  useEffect(() => {
    const genre = searchParams.get("genre");
    const sort = searchParams.get("sort");

    if (genre || sort) {
      setFilters((prev) => ({
        ...prev,
        withGenres: genre || prev.withGenres,
        sortBy: sort || prev.sortBy,
      }));
    }
  }, [searchParams]);

  // TanStack Query for infinite scrolling
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useDiscoverSeriesInfinite(activeFilters);

  // Flatten pages into a single array
  const series = useMemo(() => {
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
      toast.error("Failed to load TV series", {
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
    router.push(`/tv/${id}`);
  };

  const formatRuntime = (mins: number) => {
    if (mins === 0) return "Any";
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <>
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>TV Series</h1>
            <p className={styles.subtitle}>Discover popular TV shows</p>
          </div>
          <button
            className={styles.filterButton}
            onClick={() => setIsFilterOpen(true)}
          >
            <SlidersHorizontal size={18} />
            Filters
          </button>
        </header>

        <section className={styles.content}>
          {isLoading && (
            <div className={styles.loadingState}>
              <Loader2 className={styles.spinner} size={32} />
              <p>Loading TV series...</p>
            </div>
          )}

          {isError && (
            <div className={styles.error}>
              Failed to load TV series. Please try again.
            </div>
          )}

          <div className={styles.grid}>
            {series.map((show, index) => (
              <MovieCard
                key={`${show.id}-${index}`}
                id={show.id}
                title={show.name || ""}
                posterPath={show.poster_path}
                voteAverage={show.vote_average}
                mediaType="tv"
                releaseDate={show.first_air_date}
                onClick={() => handleItemClick(show.id)}
              />
            ))}
          </div>

          {!isLoading && series.length === 0 && (
            <div className={styles.noResults}>
              <span className={styles.noResultsIcon}>📺</span>
              <p>No TV shows found matching your filters.</p>
              <button className={styles.resetButton} onClick={handleReset}>
                Reset Filters
              </button>
            </div>
          )}

          {/* Infinite scroll sentinel */}
          {hasNextPage && series.length > 0 && (
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
          {!hasNextPage && series.length > 0 && (
            <div className={styles.endMessage}>
              You&apos;ve seen all {series.length} TV shows
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
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: "#fff" }}>
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
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Runtime */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: "#fff" }}>
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
                style={{ width: "100%" }}
              />
            </div>

            {/* Min Rating */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: "#fff" }}>
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
                style={{ width: "100%" }}
              />
            </div>

            {/* Genres */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: "#fff" }}>
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
                mediaType="tv"
              />
            </div>
          </div>

          <SheetFooter>
            <button
              onClick={handleReset}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "transparent",
                color: "#fff",
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
                background: "var(--accent, #6366f1)",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 500,
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
