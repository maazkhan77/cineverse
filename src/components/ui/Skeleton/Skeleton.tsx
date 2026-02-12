"use client";

import styles from "./Skeleton.module.css";
import { CSSProperties } from "react";

interface SkeletonProps {
  className?: string;
  variant?: "rect" | "circle" | "text";
  style?: CSSProperties;
}

export function Skeleton({ className, variant = "rect", style }: SkeletonProps) {
  return (
    <div className={`${styles.skeleton} ${styles[variant]} ${className || ""}`} style={style}>
      <div className={styles.shimmer} />
    </div>
  );
}

