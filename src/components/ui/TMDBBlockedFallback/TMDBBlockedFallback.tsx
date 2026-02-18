
"use client";

import { WifiOff, AlertTriangle } from "lucide-react";
import styles from "./TMDBBlockedFallback.module.css";
import { Button3D } from "@/components/ui/Button3D/Button3D";

export function TMDBBlockedFallback() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <WifiOff size={48} className={styles.icon} />
        </div>
        
        <h2 className={styles.title}>Connection Issue Detected</h2>
        
        <p className={styles.message}>
          We're having trouble connecting to the movie database (TMDB). This often happens if your Internet Service Provider (ISP) blocks access to TMDB.
        </p>

        <div className={styles.recommendations}>
          <div className={styles.recommendationItem}>
            <AlertTriangle size={20} className={styles.warningIcon} />
            <span>Try switching to a different network (e.g., Mobile Data or a different WiFi).</span>
          </div>
          <div className={styles.recommendationItem}>
            <AlertTriangle size={20} className={styles.warningIcon} />
            <span>If you are using a VPN, try disabling it, or enable it if you aren't using one.</span>
          </div>
        </div>

        <Button3D 
          onClick={() => window.location.reload()}
          className={styles.retryButton}
        >
          Retry Connection
        </Button3D>
      </div>
    </div>
  );
}
