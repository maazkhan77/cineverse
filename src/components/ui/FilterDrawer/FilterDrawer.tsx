"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import styles from "./FilterDrawer.module.css";
import { GenreFilter } from "../GenreFilter";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  mediaType: "movie" | "tv";
  initialFilters?: FilterState;
}

export interface FilterState {
  year?: number;
  minRating: number;
  minVotes?: number;
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
  { label: "Release Date Newest", value: "primary_release_date.desc" },
  { label: "Release Date Oldest", value: "primary_release_date.asc" },
];

export function FilterDrawer({ isOpen, onClose, onApply, mediaType, initialFilters }: FilterDrawerProps) {
  const [filters, setFilters] = useState<FilterState>({
    minRating: 0,
    sortBy: "popularity.desc",
    withGenres: "",
    maxRuntime: 0, // 0 means no limit
    ...initialFilters
  });

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      minRating: 0,
      sortBy: "popularity.desc",
      withGenres: "",
      maxRuntime: 0,
    });
  };

  const formatRuntime = (mins: number) => {
    if (mins === 0) return "Any";
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={styles.drawer}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className={styles.header}>
              <h2 className={styles.title}>Filters & Sort</h2>
              <button className={styles.closeButton} onClick={onClose}>✕</button>
            </div>

            <div className={styles.content}>
              <div className={styles.section}>
                <h3 className={styles.label}>Sort By</h3>
                <select 
                  className={styles.select}
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.section}>
                <h3 className={styles.label}>
                  Time to Kill (Max Duration): {formatRuntime(filters.maxRuntime || 0)}
                </h3>
                  <div className={styles.sliderContainer}>
                  <input 
                    type="range"
                    min="0"
                    max="240" // 4 hours
                    step="15"
                    value={filters.maxRuntime || 0}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxRuntime: Number(e.target.value) }))}
                    className={styles.range}
                  />
                  <div className={styles.rangeLabels}>
                    <span>Any</span>
                    <span>2h</span>
                    <span>4h</span>
                  </div>
                </div>
                <p className={styles.helperText}>
                  Find {mediaType === "movie" ? "movies" : "shows"} shorter than this. 
                  (0 = No limit)
                </p>
              </div>

              <div className={styles.section}>
                <h3 className={styles.label}>Minimum Rating: {filters.minRating}+</h3>
                <input 
                  type="range"
                  min="0"
                  max="9"
                  step="1"
                  value={filters.minRating}
                  onChange={(e) => setFilters(prev => ({ ...prev, minRating: Number(e.target.value) }))}
                  className={styles.range}
                />
                <div className={styles.rangeLabels}>
                  <span>0</span>
                  <span>5</span>
                  <span>9</span>
                </div>
              </div>

              <div className={styles.section}>
                <h3 className={styles.label}>Genres</h3>
                <GenreFilter
                  selectedGenres={filters.withGenres ? filters.withGenres.split(",").map(Number) : []}
                  onGenreChange={(ids) => setFilters(prev => ({ ...prev, withGenres: ids.join(",") }))}
                  mediaType={mediaType}
                />
              </div>

              <div className={styles.section}>
                <h3 className={styles.label}>Region</h3>
                <select 
                  className={styles.select}
                  value={filters.region || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
                >
                  <option value="">All Regions</option>
                  <option value="US">United States</option>
                  <option value="IN">India</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="FR">France</option>
                  <option value="DE">Germany</option>
                  <option value="JP">Japan</option>
                  <option value="KR">South Korea</option>
                  <option value="BR">Brazil</option>
                </select>
              </div>
            </div>

            <div className={styles.footer}>
              <button className={styles.resetButton} onClick={handleReset}>Reset</button>
              <button className={styles.applyButton} onClick={handleApply}>Show Results</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
