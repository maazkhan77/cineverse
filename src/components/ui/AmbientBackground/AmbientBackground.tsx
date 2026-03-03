"use client";

import styles from "./AmbientBackground.module.css";

export function AmbientBackground() {
  return (
    <div className={styles.container}>
      <div className={styles.staticGradient} />
      <div className={styles.noise} />
    </div>
  );
}
