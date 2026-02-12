"use client";

import { useMemo } from "react";
import styles from "./Avatar.module.css";

interface AvatarProps {
  src?: string | null;
  fallback?: string;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
}

export function Avatar({ 
  src, 
  fallback = "User", 
  alt = "User Avatar", 
  size = "md", 
  className = "",
  onClick
}: AvatarProps) {
  
  // Generate a consistent color based on the fallback string
  const bgColor = useMemo(() => {
    const colors = [
      "linear-gradient(135deg, #FF512F 0%, #DD2476 100%)", // Orange-Pink
      "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", // Blue-Cyan
      "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", // Green-Teal
      "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", // Pink-Yellow
      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", // Purple-Blue
      "linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)", // Deep Purple
    ];
    
    let hash = 0;
    for (let i = 0; i < fallback.length; i++) {
      hash = fallback.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }, [fallback]);

  const initials = useMemo(() => {
    return fallback
      .split(" ")
      .map(n => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [fallback]);

  return (
    <div 
      className={`${styles.avatar} ${styles[size]} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      style={{ background: !src ? bgColor : undefined }}
    >
      {src ? (
        <img src={src} alt={alt} className={styles.image} />
      ) : (
        <span className={styles.initials}>{initials}</span>
      )}
    </div>
  );
}
