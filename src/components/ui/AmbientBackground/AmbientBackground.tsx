"use client";

import styles from "./AmbientBackground.module.css";
import { useEffect, useState } from "react";

interface AmbientBackgroundProps {
  color?: string;
  intensity?: number;
}

export function AmbientBackground({ color = "#e50914", intensity = 0.3 }: AmbientBackgroundProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className={styles.container} />;

  return (
    <div className={styles.container}>
      <div className={styles.staticGradient} />
      <div className={styles.noise} />
    </div>
  );
}
