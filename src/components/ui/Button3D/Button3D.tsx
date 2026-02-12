"use client";

import React from "react";
import styles from "./Button3D.module.css";

interface Button3DProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  icon?: React.ReactNode;
}

export function Button3D({ 
  children, 
  variant = "primary", 
  className, 
  icon,
  ...props 
}: Button3DProps) {
  return (
    <button 
      className={`${styles.buttonContainer} ${styles[variant]} ${className || ""}`}
      {...props}
    >
      <div className={styles.buttonBottom} aria-hidden="true" />
      <div className={styles.buttonTop}>
        {icon && <span className={styles.icon}>{icon}</span>}
        {children}
      </div>
    </button>
  );
}
