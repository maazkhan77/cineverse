"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { StarRating } from "../StarRating";
import styles from "./ReviewList.module.css";
import { motion } from "framer-motion";

interface ReviewListProps {
  tmdbId: number;
  mediaType: "movie" | "tv";
}

export function ReviewList({ tmdbId, mediaType }: ReviewListProps) {
  const reviews = useQuery(api.ratings.getContentReviews, { tmdbId, mediaType, limit: 10 });

  if (reviews === undefined) {
    return <div className={styles.loading}>Loading reviews...</div>;
  }

  if (reviews.length === 0) {
    return null; // Don't show anything if no reviews
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>User Reviews</h3>
      <div className={styles.grid}>
        {reviews.map((review, i) => (
          <motion.div 
            key={review._id} 
            className={styles.reviewCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className={styles.header}>
              <div className={styles.userInfo}>
                <div className={styles.avatar}>
                  {review.userImage ? (
                    <img src={review.userImage} alt={review.userName} />
                  ) : (
                    <span className={styles.avatarPlaceholder}>
                      {review.userName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className={styles.meta}>
                  <span className={styles.userName}>{review.userName}</span>
                  <span className={styles.date}>
                    {new Date(review.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <StarRating rating={review.rating} size="sm" showValue={false} />
            </div>
            
            <p className={styles.content}>{review.review}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
