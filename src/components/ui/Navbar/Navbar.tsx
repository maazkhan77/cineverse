"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { UserMenu } from "@/components/auth";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { 
  Search, Film, Tv, Sparkles, ChevronDown, 
  Zap, Smile, Ghost, Rocket, Heart, Skull, Palette, 
  Flame, Star, Calendar, MonitorPlay, Clapperboard,
  Sword, Map, User, Music, Binoculars
} from "lucide-react";
import styles from "./Navbar.module.css";

// Lucide Icons mapped for Genres
const MOVIE_GENRES = [
  { id: 28, name: "Action", icon: Zap },
  { id: 35, name: "Comedy", icon: Smile },
  { id: 18, name: "Drama", icon: Heart }, // Drama often assoc with emotion
  { id: 27, name: "Horror", icon: Ghost },
  { id: 878, name: "Sci-Fi", icon: Rocket },
  { id: 10749, name: "Romance", icon: Heart },
  { id: 53, name: "Thriller", icon: Skull },
  { id: 16, name: "Animation", icon: Palette },
];

const TV_GENRES = [
  { id: 10759, name: "Action & Adventure", icon: Sword },
  { id: 35, name: "Comedy", icon: Smile },
  { id: 18, name: "Drama", icon: Mask }, // Using a generic icon if mask not avail, fallback below
  { id: 10765, name: "Sci-Fi & Fantasy", icon: Rocket },
  { id: 80, name: "Crime", icon: Binoculars }, // Crime/Investigation
  { id: 10766, name: "Soap", icon: User }, // Character driven
  { id: 10764, name: "Reality", icon: Map }, // "Real world"
  { id: 16, name: "Animation", icon: Palette },
];

// Fallback for missing icons
function Mask(props: any) {
  return <Film {...props} />;
}

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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
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
                      <genre.icon size={16} className={styles.genreIcon} />
                      <span>{genre.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Right Column: Featured */}
              <div className={styles.megaSidebar}>
                <div className={styles.sectionTitle}>Featured Collections</div>
                <div className={styles.quickLinkList}>
                  <Link href={basePath} className={styles.featuredLink} onClick={onClose}>
                    <div className={styles.featuredIconWrapper}>
                      <Flame size={18} />
                    </div>
                    <div className={styles.featuredText}>
                      <h4>Popular Now</h4>
                      <p>Trending worldwide</p>
                    </div>
                  </Link>
                  
                  <Link href={`${basePath}?sort=vote_average.desc`} className={styles.featuredLink} onClick={onClose}>
                    <div className={styles.featuredIconWrapper}>
                      <Star size={18} />
                    </div>
                     <div className={styles.featuredText}>
                      <h4>Top Rated</h4>
                      <p>All-time favorites</p>
                    </div>
                  </Link>

                  {type === "movies" ? (
                    <Link href={`${basePath}?filter=upcoming`} className={styles.featuredLink} onClick={onClose}>
                      <div className={styles.featuredIconWrapper}>
                        <Calendar size={18} />
                      </div>
                       <div className={styles.featuredText}>
                        <h4>Upcoming</h4>
                        <p>Coming directly to theaters</p>
                      </div>
                    </Link>
                  ) : (
                    <Link href={`${basePath}?filter=airing_today`} className={styles.featuredLink} onClick={onClose}>
                      <div className={styles.featuredIconWrapper}>
                        <MonitorPlay size={18} />
                      </div>
                       <div className={styles.featuredText}>
                        <h4>Airing Today</h4>
                        <p>New episodes dropping now</p>
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
    // Check initial state
    setIsScrolled(window.scrollY > 10);
    
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
          <span className={styles.logoText}>CINEVERSE</span>
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
            href="/matchpoint" 
            className={`${styles.navLink} ${isActive("/matchpoint") ? styles.active : ""}`}
          >
            MatchPoint
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
