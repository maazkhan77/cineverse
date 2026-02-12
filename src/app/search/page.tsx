"use client";

import { MovieCard, FilterDrawer, FilterState } from "@/components/ui";
import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./page.module.css";
import { Input } from "@/components/ui/Input/Input";
import { SelectionChip } from "@/components/ui/SelectionChip/SelectionChip";
import { SegmentedControl } from "@/components/ui/SegmentedControl/SegmentedControl";

interface TMDBResult {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  vote_average: number;
  media_type: "movie" | "tv" | "person";
  release_date?: string;
  first_air_date?: string;
  overview?: string;
}

interface TMDBResponse {
  results: TMDBResult[];
  page: number;
  total_pages: number;
  total_results: number;
}

type FilterType = "all" | "movie" | "tv";
type SearchMode = "regular" | "ai" | "matchpoint";

// Wrapper component with Suspense for useSearchParams
export default function SearchPage() {
  return (
    <Suspense fallback={<><main className={styles.main}><div className={styles.loading}><div className={styles.spinner} /></div></main></>}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TMDBResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all"); // "all" | "movie" | "tv"
  const [searchMode, setSearchMode] = useState<SearchMode>("regular");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Advanced Filters (Time-to-kill etc.)
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    minRating: 0,
    sortBy: "popularity.desc",
    withGenres: "",
    maxRuntime: 0,
  });
  
  // AI search state
  const [aiResults, setAiResults] = useState<{ title: string; year?: number; reason: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  // Convex queries & actions
  const suggestions = useQuery(
    api.searchQueries.getAutocompleteSuggestions,
    query.length >= 2 ? { prefix: query } : "skip"
  );
  const popularSearches = useQuery(api.searchQueries.getPopularSearches, { limit: 5 });
  const saveSearchHistory = useMutation(api.searchQueries.saveSearchHistory);
  const recommendMovies = useAction(api.ai.recommendMovies);
  
  // Discovery actions (for advanced filters)
  const getMovies = useAction(api.tmdb.getMovies);
  const getSeries = useAction(api.tmdb.getSeries);

  // Helper to check if using discovery mode (any filter active or explicit filtered search)
  const isDiscoveryMode = useCallback(() => {
    return (
      advancedFilters.minRating > 0 || 
      advancedFilters.withGenres !== "" || 
      (advancedFilters.maxRuntime !== undefined && advancedFilters.maxRuntime > 0) ||
      advancedFilters.sortBy !== "popularity.desc"
    );
  }, [advancedFilters]);

  // Handle URL search params
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
        setQuery(q);
        // If coming from AI Search or another page, we want to trigger search immediately
        // BUT we need to ensure we don't double-trigger if user is just typing
        // Logic: If query param exists and differs from current results, or if we haven't searched yet.
        handleSearch(q, 1);
    }
  }, [searchParams]); // Dependent on searchParams only

  // Trending movies for initial state
  const [trending, setTrending] = useState<TMDBResult[]>([]);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        const res = await fetch(
          `https://api.themoviedb.org/3/trending/all/week?api_key=${apiKey}`
        );
        const data = await res.json();
        setTrending(data.results?.slice(0, 10) || []);
      } catch (err) {
        console.error("Failed to fetch trending:", err);
      }
    };
    fetchTrending();
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasSearched) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, hasSearched]);

  const handleSearch = useCallback(async (searchQuery?: string, newPage = 1) => {
    const q = searchQuery || query;
    // Allow empty query if using filters (Discovery Mode)
    const isDiscovering = isDiscoveryMode();
    if (!q.trim() && !isDiscovering) return;

    setQuery(q);
    setIsLoading(true);
    setHasSearched(true);
    setShowSuggestions(false);
    setError(null);

    // AI Search Mode
    if (searchMode === "ai") {
      setAiLoading(true);
      try {
        const response = await recommendMovies({ query: q });
        if (response?.recommendations) {
          setAiResults(response.recommendations);
        }
      } catch (err) {
        console.error("AI search failed:", err);
        setError("AI search failed. Please try again.");
      } finally {
        setAiLoading(false);
        setIsLoading(false);
      }
      return;
    }

    // Regular Search (Text) OR Discovery (Filters)
    try {
      let data: TMDBResponse | null = null;

      if (isDiscovering && !q.trim()) {
        // --- DISCOVERY MODE (Filters Only) ---
        // If "all" is selected, we default to movies for discovery as "multi" discovery isn't a single endpoint.
        // OR we could fetch both and merge? Complex. Let's default "all" -> "movie" for discovery for simplicity
        // or force user to pick one.
        // Better UX: standard behavior, search "Movies" if filter is active.
        const targetType = filter === "tv" ? "tv" : "movie"; 
        
        const discoveryArgs = {
          page: newPage,
          genreIds: advancedFilters.withGenres || undefined,
          maxRuntime: advancedFilters.maxRuntime || undefined,
        };

        if (targetType === "movie") {
           const res = await getMovies(discoveryArgs);
           data = res as TMDBResponse;
        } else {
           const res = await getSeries(discoveryArgs);
           data = res as TMDBResponse;
        }

      } else {
        // --- TEXT SEARCH MODE ---
        const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        if (!apiKey) throw new Error("API key not configured");

        const mediaType = filter === "all" ? "multi" : filter;
        const res = await fetch(
          `https://api.themoviedb.org/3/search/${mediaType}?api_key=${apiKey}&query=${encodeURIComponent(q)}&include_adult=false&page=${newPage}`
        );
        if (!res.ok) throw new Error("Search failed");
        data = await res.json();
      }

      if (data) {
        let filteredResults = data.results.filter((r) => r.media_type !== "person");
        
        // Ensure media_type is set for Discover results (API sometimes omits it on specific endpoints)
        // If discovery was used, we know the type.
        if (isDiscovering && !q.trim()) {
             const targetType = filter === "tv" ? "tv" : "movie";
             filteredResults = filteredResults.map(r => ({ ...r, media_type: targetType }));
        }
        
        // For non-multi searches via text, add media_type manually if missing
        if (!isDiscovering && filter !== "all") {
          filteredResults = filteredResults.map(r => ({ ...r, media_type: filter }));
        }

        if (newPage === 1) {
          setResults(filteredResults);
        } else {
          setResults(prev => [...prev, ...filteredResults]);
        }
        
        setPage(newPage);
        setTotalResults(data.total_results);
        setHasMore(newPage < data.total_pages);
        
        // Save to search history (only for text searches)
        if (newPage === 1 && q.trim()) {
          saveSearchHistory({ query: q, resultCount: data.total_results });
        }
      }
    } catch (err) {
      setError("Search failed. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [query, filter, searchMode, saveSearchHistory, recommendMovies, advancedFilters, isDiscoveryMode, getMovies, getSeries]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      handleSearch(query, page + 1);
    }
  };

  const handleApplyFilters = (newFilters: FilterState) => {
    setAdvancedFilters(newFilters);
    // Switch to appropriate filter type if "All" was selected, as discovery requires specific type
    if (filter === "all") {
        setFilter("movie");
    }
    // Clear query to trigger discovery mode in handleSearch
    setQuery(""); 
    
    // We need to trigger a search immediately with the new state.
    // React state updates are async, so we pass explicit empty query and rely on effect or just call logic.
    // Easier: Reset page and call logic after render? 
    // Or just call handleSearch("") but we need ensure advancedFilters state is updated in closure?
    // handleSearch uses the state 'advancedFilters'. 
    // We'll use a useEffect to trigger search when advancedFilters changes IF we are in a "filtering" state?
    // No, that might trigger on initial mount.
    // Let's accept that we need to wait for state.
  };
  
  // Trigger search when advanced filters change
  useEffect(() => {
     if (isDiscoveryMode()) {
        setPage(1); // Reset page
        handleSearch("", 1);
     }
  }, [advancedFilters]); 


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    // Reset filters when searching text
    setAdvancedFilters({
        minRating: 0,
        sortBy: "popularity.desc",
        withGenres: "",
        maxRuntime: 0,
    });
    handleSearch(suggestion);
  };

  const handleItemClick = (id: number, mediaType: "movie" | "tv") => {
    router.push(`/${mediaType}/${id}`);
  };

  const handleAiResultClick = (title: string) => {
    setSearchMode("regular");
    handleSearch(title);
  };
  
  const handleFilterChipChange = (f: FilterType) => {
    setFilter(f);
    if (hasSearched) handleSearch(query);
  };

  const clearRecentSearches = async () => {
    // This would call a mutation to clear history

  };

  // Combine suggestions
  const allSuggestions = [
    ...(suggestions?.recent || []).map((s) => ({ type: "recent" as const, text: s })),
    ...(suggestions?.popular || []).map((s) => ({ type: "popular" as const, text: s })),
  ].filter((s, i, arr) => arr.findIndex((a) => a.text === s.text) === i);

  const showDropdown = showSuggestions && (allSuggestions.length > 0 || (query.length < 2 && popularSearches && popularSearches.length > 0));

  const handleMatch = (genreIds: number[]) => {
    // Switch to discovery, set genres, and trigger search
    setAdvancedFilters({
      minRating: 0,
      sortBy: "popularity.desc",
      withGenres: genreIds.join(","),
      maxRuntime: 0,
    });
    setSearchMode("regular");
  };

  return (
    <>
      <main className={styles.main}>
        {/* Hero Search Section */}
        <motion.section 
          className={styles.heroSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className={styles.heroTitle}>
            {searchMode === "ai" ? "Ask AI for Recommendations" : 
             searchMode === "matchpoint" ? "Mix & Match" :
             "Search Movies & TV Shows"}
          </h1>
          <p className={styles.heroSubtitle}>
            {searchMode === "ai" 
              ? "Describe what you're in the mood for and get personalized suggestions"
              : searchMode === "matchpoint"
              ? "Select a genre for you and one for your partner to find the perfect middle ground."
              : "Find your next favorite movie or show"
            }
          </p>

          {/* Search Mode Toggle */}
          <div style={{ marginBottom: 24 }}>
            <SegmentedControl
              options={[
                {
                  value: "regular",
                  label: (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="M21 21l-4.35-4.35"/>
                      </svg>
                      Search
                    </>
                  )
                },
                {
                  value: "ai",
                  label: (
                    <>
                      <span className={styles.aiIcon}>✨</span>
                      AI Recommend
                    </>
                  )
                },
                {
                  value: "matchpoint",
                  label: (
                    <>
                      <span className={styles.aiIcon}>🤝</span>
                      MatchPoint
                    </>
                  )
                }
              ]}
              value={searchMode}
              onChange={(val) => {
                if (val === "matchpoint") {
                  router.push("/matchpoint");
                } else {
                  setSearchMode(val as any);
                }
              }}
              className="inline-flex"
            />
          </div>

          {/* Search Input - Hidden in MatchPoint mode */}
          {searchMode !== "matchpoint" && (
            <div className={styles.searchBox}>
              <div className={styles.searchInputWrapper}>
                <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                <Input
                  ref={inputRef}
                  type="text"
                  className={styles.searchInput}
                  placeholder={searchMode === "ai" 
                    ? "Try: 'Mind-bending sci-fi like Inception'" 
                    : "Search for movies, TV shows..."
                  }
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={handleKeyDown}
                  style={{ height: '56px', paddingLeft: '52px', paddingRight: '120px', fontSize: '18px' }}
                />
                <button
                  className={styles.searchButton}
                  onClick={() => handleSearch()}
                  disabled={isLoading || (!query.trim() && !isDiscoveryMode())}
                  style={{ 
                    position: 'absolute', 
                    right: '6px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    height: '46px', 
                    padding: '0 24px', 
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2
                  }}
                >
                  {isLoading ? (
                    <div className={styles.buttonSpinner} />
                  ) : searchMode === "ai" ? "Ask AI" : "Search"}
                </button>

                {/* Autocomplete Dropdown */}
                <AnimatePresence>
                  {showDropdown && (
                    <motion.div 
                      ref={suggestionsRef} 
                      className={styles.suggestions}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {query.length < 2 && popularSearches && popularSearches.length > 0 && (
                        <>
                          <div className={styles.suggestionsLabel}>🔥 Trending Searches</div>
                          {popularSearches.map((s) => (
                            <button
                              key={s}
                              className={styles.suggestionItem}
                              onClick={() => handleSuggestionClick(s)}
                            >
                              <span className={styles.suggestionIcon}>🔍</span>
                              {s}
                            </button>
                          ))}
                        </>
                      )}
                      
                      {query.length >= 2 && allSuggestions.length > 0 && (
                        <>
                          {allSuggestions.filter(s => s.type === "recent").length > 0 && (
                            <>
                              <div className={styles.suggestionsLabel}>
                                🕐 Recent
                                <button className={styles.clearButton} onClick={clearRecentSearches}>Clear</button>
                              </div>
                              {allSuggestions.filter(s => s.type === "recent").map((s) => (
                                <button
                                  key={s.text}
                                  className={styles.suggestionItem}
                                  onClick={() => handleSuggestionClick(s.text)}
                                >
                                  <span className={styles.suggestionIcon}>🕐</span>
                                  {s.text}
                                </button>
                              ))}
                            </>
                          )}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* MatchPoint Component */}
          {/* MatchPoint Component Removed - Moved to /matchpoint */}

          {/* Filter Chips - Only for regular search */}
          {searchMode === "regular" && (
            <div className={styles.filterChips}>
              {(["all", "movie", "tv"] as FilterType[]).map((f) => (
                <SelectionChip
                  key={f}
                  label={f === "all" ? "All" : f === "movie" ? "Movies" : "TV Shows"}
                  selected={filter === f}
                  onClick={() => handleFilterChipChange(f)}
                />
              ))}
               
               <SelectionChip
                label="Filters"
                selected={isDiscoveryMode()}
                onClick={() => setIsFilterOpen(true)}
                className={isDiscoveryMode() ? "" : "!bg-black/30 !border-white/30"}
               >
                 <span style={{ marginRight: '4px' }}>⚙️</span> Filters
               </SelectionChip>
            </div>
          )}
        </motion.section>

        <section className={styles.content}>
          {error && <div className={styles.error}>{error}</div>}

          {/* Trending Section - Show when no search performed */}
          {!hasSearched && !isDiscoveryMode() && trending.length > 0 && searchMode !== "matchpoint" && (
            <motion.div 
              className={styles.trendingSection}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className={styles.sectionTitle}>🔥 Trending This Week</h2>
              <div className={styles.trendingScroll}>
                {trending.map((item) => (
                  <div 
                    key={item.id} 
                    className={styles.trendingCard}
                    onClick={() => handleItemClick(item.id, item.media_type === "tv" ? "tv" : "movie")}
                  >
                    {item.poster_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                        alt={item.title || item.name}
                        className={styles.trendingPoster}
                      />
                    )}
                    <div className={styles.trendingInfo}>
                      <span className={styles.trendingTitle}>{item.title || item.name}</span>
                      <span className={styles.trendingRating}>⭐ {item.vote_average?.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* AI Search Results */}
          {searchMode === "ai" && hasSearched && (
            <div className={styles.aiResults}>
              {aiLoading && (
                <div className={styles.aiLoading}>
                  <span className={styles.aiLoadingIcon}>✨</span>
                  AI is thinking...
                </div>
              )}

              {aiResults.length > 0 && (
                <motion.div 
                  className={styles.aiResultsList}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <h2 className={styles.sectionTitle}>AI Recommendations</h2>
                  {aiResults.map((rec, i) => (
                    <motion.div
                      key={i}
                      className={styles.aiResultCard}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => handleAiResultClick(rec.title)}
                    >
                      <div className={styles.aiResultHeader}>
                        <span className={styles.aiResultTitle}>{rec.title}</span>
                        {rec.year && <span className={styles.aiResultYear}>({rec.year})</span>}
                      </div>
                      <p className={styles.aiResultReason}>{rec.reason}</p>
                      <span className={styles.aiResultAction}>Click to search →</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          )}

          {/* Regular Search Results */}
          {searchMode === "regular" && hasSearched && (
            <>
              {/* Result Count */}
              {results.length > 0 && (
                <div className={styles.resultInfo}>
                  <span className={styles.resultCount}>
                    Found {totalResults.toLocaleString()} results 
                    {query ? ` for "${query}"` : " matching filters"}
                  </span>
                </div>
              )}

              {results.length === 0 && !isLoading && (
                <div className={styles.noResults}>
                  No results found {query ? `for "${query}"` : "matching your filters"}
                </div>
              )}

              <motion.div 
                className={styles.grid}
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.05 }
                  }
                }}
              >
                <AnimatePresence>
                  {results.map((item, index) => (
                    <motion.div
                      key={`${item.id}-${index}`}
                      variants={{
                        hidden: { opacity: 0, scale: 0.9 },
                        visible: { opacity: 1, scale: 1 }
                      }}
                      layout
                    >
                      <MovieCard
                        id={item.id}
                        title={item.title || item.name || ""}
                        posterPath={item.poster_path}
                        voteAverage={item.vote_average}
                        mediaType={item.media_type === "tv" ? "tv" : "movie"}
                        releaseDate={item.release_date || item.first_air_date}
                        onClick={() => handleItemClick(
                          item.id,
                          item.media_type === "tv" ? "tv" : "movie"
                        )}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Infinite scroll observer */}
              <div ref={observerRef} className={styles.loadMoreTrigger}>
                {isLoading && hasSearched && (
                  <div className={styles.loadingMore}>
                    <div className={styles.spinner} />
                    <span>Loading more...</span>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </main>

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters}
        mediaType={filter === "tv" ? "tv" : "movie"}
        initialFilters={advancedFilters}
      />
    </>
  );
}
