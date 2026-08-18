"use client";

import { usePathname } from "next/navigation";
import styles from "./Footer.module.css";

export function Footer() {
  const pathname = usePathname();

  if (pathname === "/ai-search" || pathname === "/login") return null;

  return (
    <footer className={styles.footer}>
      <p className={styles.text}>
        Made with <span className={styles.heart} role="img" aria-label="love">❤️</span> by{" "}
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
