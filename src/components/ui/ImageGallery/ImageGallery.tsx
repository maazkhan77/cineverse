"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import styles from "./ImageGallery.module.css";

interface ImageType {
  file_path: string;
  vote_average?: number;
}

interface ImageGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  images: ImageType[];
  initialIndex?: number;
}

// Inner component that gets remounted when gallery opens
function GalleryContent({ 
  onClose, 
  images, 
  initialIndex 
}: { 
  onClose: () => void; 
  images: ImageType[]; 
  initialIndex: number;
}) {
  const [index, setIndex] = useState(initialIndex);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handleNext, handlePrev]);

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>✕</button>
        
        <div className={styles.imageWrapper}>
          {images[index] && (
            <Image
              src={`https://image.tmdb.org/t/p/original${images[index].file_path}`}
              alt=""
              fill
              className={styles.image}
              priority
            />
          )}
        </div>

        <button className={`${styles.navButton} ${styles.prevButton}`} onClick={handlePrev}>‹</button>
        <button className={`${styles.navButton} ${styles.nextButton}`} onClick={handleNext}>›</button>

        <div className={styles.counter}>
          {index + 1} / {images.length}
        </div>
      </div>

      <div className={styles.thumbnails}>
        {images.map((img, i) => (
          <button
            key={img.file_path}
            className={`${styles.thumbnail} ${i === index ? styles.activeThumbnail : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              setIndex(i);
            }}
          >
            <Image
              src={`https://image.tmdb.org/t/p/w200${img.file_path}`}
              alt=""
              width={60}
              height={40}
              className={styles.thumbImage}
            />
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export function ImageGallery({ isOpen, onClose, images, initialIndex = 0 }: ImageGalleryProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <GalleryContent 
          key={`gallery-${initialIndex}`}
          onClose={onClose} 
          images={images} 
          initialIndex={initialIndex} 
        />
      )}
    </AnimatePresence>
  );
}

