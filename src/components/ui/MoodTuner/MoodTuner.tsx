"use client";

import { motion } from "framer-motion";
import styles from "./MoodTuner.module.css";

export type Mood = "all" | "feel-good" | "dark" | "blockbusters";

interface MoodTunerProps {
  activeMood: Mood;
  onMoodChange: (mood: Mood) => void;
}

const MOODS = [
  { id: "all" as Mood, label: "All" },
  { id: "feel-good" as Mood, label: "Feel Good" },
  { id: "dark" as Mood, label: "Dark & Gritty" },
  { id: "blockbusters" as Mood, label: "Blockbusters" },
];

// Genre ID mappings from TMDB
export const MOOD_GENRES: Record<Mood, number[]> = {
  "all": [],
  "feel-good": [35, 10751, 16, 10749], // Comedy, Family, Animation, Romance
  "dark": [27, 53, 80, 18], // Horror, Thriller, Crime, Drama
  "blockbusters": [28, 12, 878], // Action, Adventure, Sci-Fi
};

export function MoodTuner({ activeMood, onMoodChange }: MoodTunerProps) {
  return (
    <div className={styles.container}>
      <div className={styles.pills}>
        {MOODS.map((mood) => (
          <motion.button
            key={mood.id}
            className={`${styles.pill} ${activeMood === mood.id ? styles.active : ""}`}
            onClick={() => onMoodChange(mood.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className={styles.label}>{mood.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
