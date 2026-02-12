"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import styles from "./TrailerPlayer.module.css";

interface TrailerPlayerProps {
  youtubeKey: string;
  title?: string;
  autoplay?: boolean;
  onClose?: () => void;
}

export function TrailerPlayer({
  youtubeKey,
  title,
  autoplay = true,
  onClose,
}: TrailerPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);

  const embedUrl = `https://www.youtube.com/embed/${youtubeKey}?${new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    modestbranding: "1",
    rel: "0",
    showinfo: "0",
    controls: "1",
    playsinline: "1",
  }).toString()}`;

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.container}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button className={styles.closeButton} onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Title */}
        {title && <h3 className={styles.title}>{title}</h3>}

        {/* Video Frame */}
        <div className={styles.videoWrapper}>
          {isLoading && (
            <div className={styles.loader}>
              <div className={styles.spinner} />
              <span>Loading trailer...</span>
            </div>
          )}
          <iframe
            src={embedUrl}
            className={styles.iframe}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

// Inline trailer (no overlay, embeds in page)
export function InlineTrailer({ youtubeKey }: { youtubeKey: string }) {
  return (
    <div className={styles.inlineWrapper}>
      <iframe
        src={`https://www.youtube.com/embed/${youtubeKey}?modestbranding=1&rel=0`}
        className={styles.inlineIframe}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
