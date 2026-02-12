"use client";

import React from "react";
import styles from "./Label.module.css";
import { cn } from "@/lib/utils";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export function Label({ className, children, ...props }: LabelProps) {
  return (
    <label className={cn(styles.label, className)} {...props}>
      {children}
    </label>
  );
}
