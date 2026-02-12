"use client";

import { MovieCard } from "@/components/ui";
import { Input } from "@/components/ui/Input/Input";
import { SelectionChip } from "@/components/ui/SelectionChip/SelectionChip";
import { Select } from "@/components/ui/Select/Select";
import { SegmentedControl } from "@/components/ui/SegmentedControl/SegmentedControl";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./page.module.css";
import { useEffect, useState, useMemo } from "react";

type FilterType = "all" | "movie" | "tv";
type SortType = "dateAdded" | "title" | "rating";
type ViewType = "grid" | "list";

export default function WatchlistPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const watchlist = useQuery(api.watchlist.list);
  const removeFromWatchlist = useMutation(api.watchlist.remove);
  const router = useRouter();

  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("dateAdded");
  const [viewType, setViewType] = useState<ViewType>("grid");
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/watchlist");
    }
  }, [isAuthenticated, authLoading, router]);

  // Filter and sort the watchlist
  const filteredAndSortedItems = useMemo(() => {
    if (!watchlist) return [];

    let items = [...watchlist];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) =>
        item.title.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (filter !== "all") {
      items = items.filter((item) => item.mediaType === filter);
    }

    // Sort
    switch (sort) {
      case "title":
        items.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "rating":
        items.sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0));
        break;
      case "dateAdded":
      default:
        items.sort((a, b) => 
          new Date(b._creationTime).getTime() - new Date(a._creationTime).getTime()
        );
    }

    return items;
  }, [watchlist, filter, sort, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!watchlist) return { total: 0, movies: 0, shows: 0, avgRating: 0 };

    const movies = watchlist.filter((w) => w.mediaType === "movie").length;
    const shows = watchlist.filter((w) => w.mediaType === "tv").length;
    const ratings = watchlist.filter((w) => w.voteAverage).map((w) => w.voteAverage!);
    const avgRating = ratings.length > 0 
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
      : 0;

    return { total: watchlist.length, movies, shows, avgRating };
  }, [watchlist]);

  const handleRemove = async (tmdbId: number) => {
    await removeFromWatchlist({ tmdbId });
  };

  const handleItemClick = (id: number, mediaType: "movie" | "tv") => {
    router.push(`/${mediaType}/${id}`);
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <>
        <main className={styles.main}>
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        </main>
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <main className={styles.main}>
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        </main>
      </>
    );
  }

  return (
    <main className={styles.main}>
      {/* Navbar is in layout */}
      <motion.header 
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.headerTop}>
            <div>
              <h1 className={styles.title}>My Watchlist</h1>
              <p className={styles.subtitle}>
                {stats.total} {stats.total === 1 ? "item" : "items"} saved
              </p>
            </div>
          </div>

          {/* Stats Section */}
          {stats.total > 0 && (
            <motion.div 
              className={styles.stats}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className={styles.statCard}>
                <span className={styles.statIcon}>🎬</span>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{stats.movies}</span>
                  <span className={styles.statLabel}>Movies</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statIcon}>📺</span>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{stats.shows}</span>
                  <span className={styles.statLabel}>TV Shows</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statIcon}>⭐</span>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{stats.avgRating.toFixed(1)}</span>
                  <span className={styles.statLabel}>Avg Rating</span>
                </div>
              </div>
            </motion.div>
          )}
        </motion.header>

        <section className={styles.content}>
          {/* Controls Bar */}
          {stats.total > 0 && (
            <motion.div 
              className={styles.controls}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {/* Filter Tabs */}
              <div className={styles.filterTabs}>
                {(["all", "movie", "tv"] as FilterType[]).map((f) => (
                  <SelectionChip
                    key={f}
                    label={f === "all" ? "All" : f === "movie" ? "Movies" : "TV Shows"}
                    selected={filter === f}
                    onClick={() => setFilter(f)}
                  >
                    {f === "all" ? "All" : f === "movie" ? "Movies" : "TV Shows"}
                    {f !== "all" && (
                      <span className={styles.filterCount} style={{ marginLeft: 8, opacity: 0.7 }}>
                        {f === "movie" ? stats.movies : stats.shows}
                      </span>
                    )}
                  </SelectionChip>
                ))}
              </div>

              <div className={styles.controlsRight}>
                {/* Search */}
                <div style={{ position: 'relative', width: 240 }}>
                   <Input
                    type="text"
                    placeholder="Search watchlist..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: 40 }}
                  />
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 16,
                      height: 16,
                      color: 'rgba(255,255,255,0.5)',
                      pointerEvents: 'none'
                    }}
                  >
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                </div>

                {/* Sort Dropdown */}
                <div style={{ width: 160 }}>
                  <Select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortType)}
                  >
                    <option value="dateAdded">Date Added</option>
                    <option value="title">Title</option>
                    <option value="rating">Rating</option>
                  </Select>
                </div>

                {/* View Toggle */}
                <SegmentedControl
                  options={[
                    { 
                      value: "grid", 
                      label: (
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                          <rect x="3" y="3" width="7" height="7" rx="1"/>
                          <rect x="14" y="3" width="7" height="7" rx="1"/>
                          <rect x="3" y="14" width="7" height="7" rx="1"/>
                          <rect x="14" y="14" width="7" height="7" rx="1"/>
                        </svg>
                      )
                    },
                    { 
                      value: "list", 
                      label: (
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                          <rect x="3" y="4" width="18" height="4" rx="1"/>
                          <rect x="3" y="10" width="18" height="4" rx="1"/>
                          <rect x="3" y="16" width="18" height="4" rx="1"/>
                        </svg>
                      )
                    }
                  ]}
                  value={viewType}
                  onChange={(val) => setViewType(val as ViewType)}
                />
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {watchlist?.length === 0 && (
            <motion.div 
              className={styles.empty}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <span className={styles.emptyIcon}>🎬</span>
              <h2 className={styles.emptyTitle}>Your watchlist is empty</h2>
              <p className={styles.emptyText}>
                Start exploring and add movies & TV shows to your watchlist
              </p>
              <button 
                className={styles.exploreButton}
                onClick={() => router.push("/movies")}
              >
                Explore Movies
              </button>
            </motion.div>
          )}

          {/* No Results State */}
          {watchlist && watchlist.length > 0 && filteredAndSortedItems.length === 0 && (
            <div className={styles.noResults}>
              <p>No items match your filters</p>
              <button 
                className={styles.resetButton}
                onClick={() => {
                  setFilter("all");
                  setSearchQuery("");
                }}
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Grid View */}
          {filteredAndSortedItems.length > 0 && viewType === "grid" && (
            <motion.div 
              className={styles.grid}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <AnimatePresence mode="popLayout">
                {filteredAndSortedItems.map((item, index) => (
                  <motion.div 
                    key={item._id} 
                    className={styles.cardWrapper}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.03 }}
                    layout
                  >
                    <MovieCard
                      id={item.tmdbId}
                      title={item.title}
                      posterPath={item.posterPath ?? null}
                      voteAverage={item.voteAverage ?? 0}
                      mediaType={item.mediaType}
                      onClick={() => handleItemClick(item.tmdbId, item.mediaType)}
                    />
                    <button
                      className={styles.removeButton}
                      onClick={() => handleRemove(item.tmdbId)}
                      aria-label="Remove from watchlist"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                      Remove
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* List View */}
          {filteredAndSortedItems.length > 0 && viewType === "list" && (
            <motion.div 
              className={styles.listView}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <AnimatePresence mode="popLayout">
                {filteredAndSortedItems.map((item, index) => (
                  <motion.div 
                    key={item._id} 
                    className={styles.listItem}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                    layout
                    onClick={() => handleItemClick(item.tmdbId, item.mediaType)}
                  >
                    <div className={styles.listPoster}>
                      {item.posterPath ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${item.posterPath}`}
                          alt={item.title}
                        />
                      ) : (
                        <div className={styles.listPosterPlaceholder}>🎬</div>
                      )}
                    </div>
                    <div className={styles.listInfo}>
                      <h3 className={styles.listTitle}>{item.title}</h3>
                      <div className={styles.listMeta}>
                        <span className={styles.mediaTypeBadge}>
                          {item.mediaType === "movie" ? "Movie" : "TV Show"}
                        </span>
                        {item.voteAverage && (
                          <span className={styles.listRating}>
                            ⭐ {item.voteAverage.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      className={styles.listRemoveButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item.tmdbId);
                      }}
                      aria-label="Remove from watchlist"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>
      </main>
  );
}
