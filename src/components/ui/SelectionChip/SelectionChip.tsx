"use client";

import React from "react";
import styles from "./SelectionChip.module.css";
import { cn } from "@/lib/utils";

interface SelectionChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function SelectionChip({ label, selected, onClick, className, children, style }: SelectionChipProps) {
  return (
    <button
      className={cn(styles.chip, selected && styles.selected, className)}
      onClick={onClick}
      type="button"
      style={style}
    >
      {children || label}
    </button>
  );
}
