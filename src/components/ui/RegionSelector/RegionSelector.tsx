"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import styles from "./RegionSelector.module.css";

// Common regions supported by TMDB — expanded list
const REGIONS = [
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "RU", name: "Russia", flag: "🇷🇺" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
];

export function RegionSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRegions = useUIStore((s) => s.selectedRegions);
  const toggleRegion = useUIStore((s) => s.toggleRegion);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Build display label
  const selectedFlags = selectedRegions
    .map((code) => REGIONS.find((r) => r.code === code))
    .filter(Boolean);

  const displayLabel =
    selectedFlags.length === 1
      ? selectedFlags[0]!.name
      : `${selectedFlags.length} regions`;

  return (
    <div className={styles.container} ref={containerRef}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.popover}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.popoverHeader}>Select Regions</div>
            {REGIONS.map((region) => {
              const isSelected = selectedRegions.includes(region.code);
              return (
                <button
                  key={region.code}
                  className={`${styles.option} ${isSelected ? styles.active : ""}`}
                  onClick={() => toggleRegion(region.code)}
                >
                  <span className={styles.optionFlag}>{region.flag}</span>
                  <span className={styles.optionName}>{region.name}</span>
                  {isSelected && (
                    <Check size={16} className={styles.checkIcon} />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        className={styles.button}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change Region"
      >
        <span className={styles.flagGroup}>
          {selectedFlags.slice(0, 3).map((r) => (
            <span key={r!.code} className={styles.flag}>
              {r!.flag}
            </span>
          ))}
          {selectedFlags.length > 3 && (
            <span className={styles.flagMore}>+{selectedFlags.length - 3}</span>
          )}
        </span>
        <div className={styles.label}>
          <span className={styles.labelText}>Region</span>
          <span className={styles.regionName}>{displayLabel}</span>
        </div>
        <Globe size={16} style={{ marginLeft: "auto", opacity: 0.5 }} />
      </button>
    </div>
  );
}
