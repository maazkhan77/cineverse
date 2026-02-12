"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { StarRating } from "../StarRating";
import styles from "./CommunityRating.module.css";

interface CommunityRatingProps {
  tmdbId: number;
  mediaType: "movie" | "tv";
}

export function CommunityRating({ tmdbId, mediaType }: CommunityRatingProps) {
  const ratingData = useQuery(api.ratings.getCommunityRating, { tmdbId, mediaType });

  if (!ratingData || ratingData.total === 0) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.noRatings}>No community ratings yet. Be the first!</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainScore}>
        <div className={styles.scoreWrapper}>
          <span className={styles.score}>{ratingData.average.toFixed(1)}</span>
          <span className={styles.maxScore}>/10</span>
        </div>
        <div className={styles.starsWrapper}>
          <StarRating rating={ratingData.average} size="md" showValue={false} />
          <span className={styles.totalRatings}>
            Based on {ratingData.total} {ratingData.total === 1 ? "rating" : "ratings"}
          </span>
        </div>
      </div>

      {ratingData.distribution && (
        <div className={styles.distribution}>
          <div className={styles.barContainer}>
             {/* Simplified distribution visualization if needed later */}
             <div className={styles.distributionLabel}>Rating Distribution</div>
             {/* Actual bars would go here if distribution data is fully populated */}
          </div>
        </div>
      )}
    </div>
  );
}
