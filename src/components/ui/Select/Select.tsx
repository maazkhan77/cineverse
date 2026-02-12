"use client";

import React from "react";
import styles from "./Select.module.css";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className={styles.selectWrapper}>
        <select
          className={cn(styles.select, error && styles.error, className)}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <div className={styles.chevron}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
