"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./CanimaSyncTutorial.module.css";

const TUTORIAL_STEPS = [
  {
    icon: "🎬",
    title: "Welcome to CanimaSync!",
    description: "Swipe through movies with your friends and find what everyone wants to watch together.",
  },
  {
    icon: "❤️",
    title: "Like or Pass",
    description: "Tap the green heart to like a movie, or the red X to pass. Your votes are matched with your friends' votes.",
  },
  {
    icon: "🎯",
    title: "Find Matches",
    description: "When everyone likes the same movie, it becomes a match! Check your matches using the green icon at the top.",
  },
  {
    icon: "🏁",
    title: "Finish & Decide",
    description: "Once you have enough matches, hit 'Finish Game' to see your results and pick the perfect movie!",
  },
];

interface CanimaSyncTutorialProps {
  onComplete: () => void;
}

export function CanimaSyncTutorial({ onComplete }: CanimaSyncTutorialProps) {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem("canima_tutorialSeen", "true");
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem("canima_tutorialSeen", "true");
    onComplete();
  };

  const current = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;

  return (
    <div className={styles.overlay}>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className={styles.stepCard}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <span className={styles.stepIcon}>{current.icon}</span>
          <h2 className={styles.stepTitle}>{current.title}</h2>
          <p className={styles.stepDescription}>{current.description}</p>

          {/* Progress Dots */}
          <div className={styles.progress}>
            {TUTORIAL_STEPS.map((_, i) => (
              <div
                key={i}
                className={`${styles.dot} ${i === step ? styles.dotActive : ""}`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button className={styles.skipBtn} onClick={handleSkip}>
              Skip
            </button>
            <button className={styles.nextBtn} onClick={handleNext}>
              {isLast ? "Got it!" : "Next"}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
