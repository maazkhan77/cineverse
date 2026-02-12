"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./AISearchInput.module.css";

interface AIRecommendation {
  title: string;
  year?: number;
  reason: string;
}

interface AISearchInputProps {
  onSearch?: (query: string) => void;
}

export function AISearchInput({ onSearch }: AISearchInputProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AIRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const recommendMovies = useAction(api.ai.recommendMovies);

  const handleAISearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults([]);
    setIsExpanded(true);

    try {
      const response = await recommendMovies({ query });
      if (response?.recommendations) {
        setResults(response.recommendations);
      }
    } catch (err) {
      console.error("AI search failed:", err);
      setError("AI search failed. Make sure your Groq API key is set.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAISearch();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <span className={styles.aiIcon}>✨</span>
        <input
          type="text"
          className={styles.input}
          placeholder="Ask AI: 'Mind-bending sci-fi like Inception'..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsExpanded(true)}
        />
        <button
          className={styles.searchButton}
          onClick={handleAISearch}
          disabled={isLoading || !query.trim()}
        >
          {isLoading ? "Thinking..." : "Ask AI"}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (results.length > 0 || isLoading || error) && (
          <motion.div
            className={styles.results}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            {isLoading && (
              <div className={styles.loading}>
                <span className={styles.spinner}>🔮</span>
                AI is thinking...
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}

            {results.length > 0 && (
              <ul className={styles.list}>
                {results.map((rec, i) => (
                  <motion.li
                    key={i}
                    className={styles.item}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => onSearch?.(rec.title)}
                  >
                    <div className={styles.itemHeader}>
                      <span className={styles.itemTitle}>{rec.title}</span>
                      {rec.year && <span className={styles.itemYear}>({rec.year})</span>}
                    </div>
                    <p className={styles.itemReason}>{rec.reason}</p>
                  </motion.li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
