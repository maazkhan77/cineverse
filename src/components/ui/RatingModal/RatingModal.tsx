"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../../../convex/_generated/api";
import { StarRating } from "../StarRating";
import styles from "./RatingModal.module.css";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  initialRating?: number;
  initialReview?: string;
}

export function RatingModal({
  isOpen,
  onClose,
  tmdbId,
  mediaType,
  title,
  initialRating,
  initialReview,
}: RatingModalProps) {
  const rateContent = useMutation(api.ratings.rateContent);
  const deleteRating = useMutation(api.ratings.deleteRating);

  const [rating, setRating] = useState<number | null>(initialRating || null);
  const [review, setReview] = useState(initialReview || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRating(initialRating || null);
      setReview(initialReview || "");
    }
  }, [isOpen, initialRating, initialReview]);

  const handleSubmit = async () => {
    if (!rating) return;
    
    setIsSubmitting(true);
    try {
      await rateContent({
        tmdbId,
        mediaType,
        rating,
        review: review.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to submit rating:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to remove your rating?")) return;
    
    setIsSubmitting(true);
    try {
      await deleteRating({ tmdbId, mediaType });
      onClose();
    } catch (error) {
      console.error("Failed to delete rating:", error);
    } finally {
      setIsSubmitting(false);
    }
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
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            <div className={styles.header}>
              <h2 className={styles.title}>Rate {title}</h2>
              <button className={styles.closeButton} onClick={onClose}>×</button>
            </div>

            <div className={styles.content}>
              <div className={styles.starSection}>
                <StarRating
                  rating={rating || 0}
                  size="lg"
                  interactive
                  onRate={setRating}
                />
                <div className={styles.ratingLabel}>
                  {rating ? `${rating}/10` : "Select a rating"}
                </div>
              </div>

              <textarea
                className={styles.reviewInput}
                placeholder="Write a review (optional)..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />

              <div className={styles.actions}>
                {initialRating && (
                  <button
                    className={styles.deleteButton}
                    onClick={handleDelete}
                    disabled={isSubmitting}
                  >
                    Remove Rating
                  </button>
                )}
                <div className={styles.rightActions}>
                  <button className={styles.cancelButton} onClick={onClose}>
                    Cancel
                  </button>
                  <button
                    className={styles.submitButton}
                    onClick={handleSubmit}
                    disabled={!rating || isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Submit"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
