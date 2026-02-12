"use client";

import React from "react";
import styles from "./SegmentedControl.module.css";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Option {
  value: string;
  label: React.ReactNode;
}

interface SegmentedControlProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  return (
    <div className={cn(styles.container, className)}>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(styles.option, isActive && styles.active)}
            type="button"
          >
            {isActive && (
              <motion.div
                layoutId={`segment-${options.map(o => o.value).join("-")}`}
                className={styles.activeBackground}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className={styles.label}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
