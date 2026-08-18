"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { UserMenu } from "@/components/auth";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { 
  Search, Sparkles, ChevronDown, 
  Flame, Star, Calendar, MonitorPlay, Clapperboard
} from "lucide-react";
import styles from "./Navbar.module.css";

// Minimalist Genre definitions (Clean, silent luxury)
const MOVIE_GENRES = [
  { id: 28, name: "Action" },
  { id: 35, name: "Comedy" },
  { id: 18, name: "Drama" },
  { id: 27, name: "Horror" },
  { id: 878, name: "Sci-Fi" },
  { id: 10749, name: "Romance" },
  { id: 53, name: "Thriller" },
  { id: 16, name: "Animation" },
];

const TV_GENRES = [
  { id: 10759, name: "Action & Adventure" },
  { id: 35, name: "Comedy" },
  { id: 18, name: "Drama" },
  { id: 10765, name: "Sci-Fi & Fantasy" },
  { id: 80, name: "Crime" },
  { id: 10766, name: "Soap" },
  { id: 10764, name: "Reality" },
  { id: 16, name: "Animation" },
];

interface MegaMenuProps {
  type: "movies" | "series";
  isOpen: boolean;
  onClose: () => void;
}

function MegaMenu({ type, isOpen, onClose }: MegaMenuProps) {
  const genres = type === "movies" ? MOVIE_GENRES : TV_GENRES;
  const basePath = type === "movies" ? "/movies" : "/series";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className={styles.megaBackdrop} onClick={onClose} />
          <motion.div
            className={styles.megaMenu}
            initial={{ opacity: 0, y: 8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.99 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={styles.megaContent}>
              {/* Left Column: Genres */}
              <div className={styles.megaMain}>
                <div className={styles.sectionTitle}>Categories</div>
                <div className={styles.genreGrid}>
                  {genres.map((genre) => (
                    <Link
                      key={genre.id}
                      href={`${basePath}?genre=${genre.id}`}
                      className={styles.genreLink}
                      onClick={onClose}
                    >
                      <span className={styles.genreDot} />
                      <span className={styles.genreName}>{genre.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Right Column: Curated */}
              <div className={styles.megaSidebar}>
                <div className={styles.sectionTitle}>Curated</div>
                <div className={styles.quickLinkList}>
                  <Link href={basePath} className={styles.featuredLink} onClick={onClose}>
                    <div className={styles.featuredIconWrapper}>
                      <Flame size={16} strokeWidth={2} />
                    </div>
                    <div className={styles.featuredText}>
                      <h4>Popular Now</h4>
                      <p>Trending worldwide</p>
                    </div>
                  </Link>
                  
                  <Link href={`${basePath}?sort=vote_average.desc`} className={styles.featuredLink} onClick={onClose}>
                    <div className={styles.featuredIconWrapper}>
                      <Star size={16} strokeWidth={2} />
                    </div>
                    <div className={styles.featuredText}>
                      <h4>Top Rated</h4>
                      <p>Critically acclaimed</p>
                    </div>
                  </Link>

                  {type === "movies" ? (
                    <Link href={`${basePath}?filter=upcoming`} className={styles.featuredLink} onClick={onClose}>
                      <div className={styles.featuredIconWrapper}>
                        <Calendar size={16} strokeWidth={2} />
                      </div>
                      <div className={styles.featuredText}>
                        <h4>Upcoming</h4>
                        <p>Coming to theaters</p>
                      </div>
                    </Link>
                  ) : (
                    <Link href={`${basePath}?filter=airing_today`} className={styles.featuredLink} onClick={onClose}>
                      <div className={styles.featuredIconWrapper}>
                        <MonitorPlay size={16} strokeWidth={2} />
                      </div>
                      <div className={styles.featuredText}>
                        <h4>Airing Today</h4>
                        <p>New episodes</p>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<"movies" | "series" | null>(null);
  const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10); // Lower threshold for faster response
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Set initial without a separate useEffect dependency loop
    if (typeof window !== "undefined") {
      queueMicrotask(() => setIsScrolled(window.scrollY > 10));
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMenuEnter = (menu: "movies" | "series") => {
    if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
    setOpenMenu(menu);
  };

  const handleMenuLeave = () => {
    menuTimeoutRef.current = setTimeout(() => {
      setOpenMenu(null);
    }, 200); // Slightly longer delay for safety
  };

  const isActive = (path: string) => pathname === path;

  if (pathname === "/login") return null;

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ""}`}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <Clapperboard size={28} strokeWidth={2} className={styles.logoIcon} />
          <div className={styles.logoInfo}>
            <span className={styles.logoText}>CANIMA</span>
            <div className={styles.pronunciationWrapper}>
              <span className={styles.pronunciation}>/saneema/</span>
              <div 
                role="button"
                tabIndex={0}
                className={styles.audioButton}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  new Audio("/assets/audio/canima.mp3").play().catch(() => console.log("Audio file missing - placeholder"));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    new Audio("/assets/audio/canima.mp3").play().catch(() => console.log("Audio file missing - placeholder"));
                  }
                }}
                aria-label="Play pronunciation"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className={styles.audioIcon}>
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Center Navigation */}
        <div className={styles.centerNav}>
          <Link 
            href="/" 
            className={`${styles.navLink} ${isActive("/") ? styles.active : ""}`}
          >
            Home
          </Link>

          {/* Movies Dropdown */}
          <div 
            className={styles.navDropdown}
            onMouseEnter={() => handleMenuEnter("movies")}
            onMouseLeave={handleMenuLeave}
          >
            <Link 
              href="/movies" 
              className={`${styles.navLink} ${isActive("/movies") || pathname.startsWith("/movie") ? styles.active : ""}`}
            >
              Movies
              <ChevronDown size={14} className={styles.chevron} />
            </Link>
            <MegaMenu type="movies" isOpen={openMenu === "movies"} onClose={() => setOpenMenu(null)} />
          </div>

          {/* Series Dropdown */}
          <div 
            className={styles.navDropdown}
            onMouseEnter={() => handleMenuEnter("series")}
            onMouseLeave={handleMenuLeave}
          >
            <Link 
              href="/series" 
              className={`${styles.navLink} ${isActive("/series") || pathname.startsWith("/tv") ? styles.active : ""}`}
            >
              Series
              <ChevronDown size={14} className={styles.chevron} />
            </Link>
            <MegaMenu type="series" isOpen={openMenu === "series"} onClose={() => setOpenMenu(null)} />
          </div>

          <Link 
            href="/trailers" 
            className={`${styles.navLink} ${isActive("/trailers") ? styles.active : ""}`}
          >
            Trailers
          </Link>

          <Link 
            href="/canimasync" 
            className={`${styles.navLink} ${isActive("/canimasync") ? styles.active : ""}`}
          >
            CanimaSync
          </Link>

          <Link 
            href="/lists" 
            className={`${styles.navLink} ${isActive("/lists") ? styles.active : ""}`}
          >
            Lists
          </Link>
        </div>

        {/* Right Actions */}
        <div className={styles.actions}>
          <Link href="/search" className={styles.iconButton} aria-label="Search">
            <Search size={22} strokeWidth={2} />
          </Link>
          
          <Link href="/ai-search" className={styles.aiButton}>
            <Sparkles size={16} className={styles.aiSparkle} />
            <span>AI Search</span>
          </Link>

          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
