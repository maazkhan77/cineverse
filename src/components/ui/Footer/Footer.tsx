"use client";

import { usePathname } from "next/navigation";
import styles from "./Footer.module.css";

export function Footer() {
  const pathname = usePathname();

  if (pathname === "/ai-search" || pathname === "/login") return null;

  return (
    <footer className={styles.footer}>
      <p className={styles.text}>
        <span className={styles.label}>Made with</span>
        <span className={styles.heart} role="img" aria-label="love">❤️</span>
        <span className={styles.by}>by</span>
        <a
          href="https://iammaaz.in"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          Maaz
        </a>
      </p>
    </footer>
  );
}
