"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./FloatingDock.module.css";
import { ThemeToggle } from "../ThemeToggle/ThemeToggle"; // We can integrate this? Or keep it separate? Let's keep separate for now.

export function FloatingDock() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/", icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )},
    { label: "Movies", href: "/movies", icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
        <polyline points="17 2 12 7 7 2" />
      </svg>
    )},
    { label: "Series", href: "/series", icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
        <polyline points="17 2 12 7 7 2" />
      </svg>
    )},
  ];

  const secondaryItems = [
    { label: "Lists", href: "/lists", icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    )},
    { label: "Profile", href: "/profile", icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )},
  ];

  if (pathname === "/ai-search") return null;

  return (
    <motion.div 
      className={styles.dockContainer}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <div className={styles.group}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div 
                className={`${styles.dockItem} ${isActive ? styles.active : ''}`}
                style={{ width: 48, height: 48 }}
                whileHover={{ width: 56, height: 56 }}
              >
                {item.icon}
                <span className={styles.tooltip}>{item.label}</span>
                {isActive && <motion.div layoutId="activeDot" className={styles.activeDot} />}
              </motion.div>
            </Link>
          );
        })}
      </div>

      <div className={styles.divider} />

      {/* The Oracle (AI Search) */}
      <Link href="/ai-search">
        <motion.div 
          className={`${styles.dockItem} ${styles.aiButton}`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className={styles.aiIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a10 10 0 1 0 10 10 0.5 0.5 0 0 1-0.5-0.5V2" />
            <path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="M4.93 4.93l2.83 2.83" />
            <path d="M16.24 16.24l2.83 2.83" />
          </svg>
          <span className={styles.tooltip}>Ask the Oracle</span>
        </motion.div>
      </Link>

      <div className={styles.divider} />

      <div className={styles.group}>
        {secondaryItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div 
                className={`${styles.dockItem} ${isActive ? styles.active : ''}`}
                style={{ width: 48, height: 48 }}
                whileHover={{ width: 56, height: 56 }}
              >
                {item.icon}
                <span className={styles.tooltip}>{item.label}</span>
                {isActive && <motion.div layoutId="activeDot" className={styles.activeDot} />}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
