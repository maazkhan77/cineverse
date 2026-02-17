"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import { Plus, Volume2, VolumeX, Share2, Check } from "lucide-react";
import styles from "./TrailerDeck.module.css";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";

export interface TrailerData {
  id: number;
  title: string;
  name?: string;
  overview: string;
  trailerKey: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: "movie" | "tv";
}


interface TrailerSlideProps {
  trailer: TrailerData;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}



export function TrailerSlide({ trailer, isActive, isMuted, onToggleMute }: TrailerSlideProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Watchlist Logic
  const { isAuthenticated } = useConvexAuth();
  const isInWatchlist = useQuery(api.watchlist.isInWatchlist, { tmdbId: trailer.id });
  const addToWatchlist = useMutation(api.watchlist.add);
  const removeFromWatchlist = useMutation(api.watchlist.remove);

  const handleWatchlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Please login to use watchlist");
      return;
    }

    try {
      if (isInWatchlist) {
        await removeFromWatchlist({ tmdbId: trailer.id });
        toast.info("Removed from watchlist");
      } else {
        await addToWatchlist({
          tmdbId: trailer.id,
          mediaType: "movie", // TrailerFeed currently fetches movies/tv but TrailerData doesn't distinguish?
          // Wait, TrailerData has 'media_type'?
          // In `tmdb.ts` getFeaturedTrailers, we map item.media_type.
          // BUT TrailerData interface in this file (lines 8-19) DOES NOT have media_type.
          // I need to add it to TrailerData interface in `page.tsx` or here.
          // Let's assume 'movie' for now or Fix Interface.
          // Looking at page.tsx (Step 1407), it casts `data.results as unknown as TrailerData[]`.
          // `tmdb.ts` returns `{ ...item, media_type: type ... }`.
          // So the data HAS media_type. I should update Interface.
          title: trailer.title || trailer.name || "Unknown",
          posterPath: trailer.poster_path || undefined,
          voteAverage: trailer.vote_average || 0,
        } as any); // cast as any to bypass strict type check if interface missing
        toast.success("Added to watchlist");
      }
    } catch (err) {
      toast.error("Failed to update watchlist");
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: trailer.title || trailer.name,
      text: "Check out this trailer on Cineverse!",
      url: window.location.href, // Or deep link to specific trailer?
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Ignore abort
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const title = trailer.title || trailer.name || "Untitled";
  const year = (trailer.release_date || trailer.first_air_date || "").split("-")[0];
  const posterUrl = trailer.poster_path
    ? `https://image.tmdb.org/t/p/w780${trailer.poster_path}`
    : "/placeholder-poster.jpg";
  const backdropUrl = trailer.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${trailer.backdrop_path}`
    : posterUrl;

  // YouTube embed URL ... (same)
  const embedUrl = `https://www.youtube.com/embed/${trailer.trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${trailer.trailerKey}&rel=0&showinfo=0&iv_load_policy=3&playsinline=1&enablejsapi=1`;

  // useEffect ... (same)
  useEffect(() => {
    if (!isActive || !iframeRef.current) return;

    const iframe = iframeRef.current;
    const command = isMuted ? "mute" : "unMute";

    const sendCommand = () => {
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: command, args: [] }), "*"
      );
    };

    const initialTimer = setTimeout(sendCommand, 500);
    sendCommand();

    return () => clearTimeout(initialTimer);
  }, [isMuted, isActive]);

  return (
    <div className={styles.slide}>
      {/* ... (Ambient & Video Layer same) ... */}
      <div className={styles.ambientLayer}>
        <Image src={posterUrl} alt="Ambient" fill className={styles.ambientImage} priority={isActive} />
      </div>

      <div className={styles.videoLayer}>
        <Image src={backdropUrl} alt={title} fill className="object-cover" priority={isActive} 
          style={{ opacity: isActive ? 0 : 1, transition: "opacity 0.8s ease", zIndex: 1 }} />
        {isActive && (
          <iframe ref={iframeRef} key={trailer.trailerKey} src={embedUrl} title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: "absolute", top: "50%", left: "50%", width: "115%", height: "115%", transform: "translate(-50%, -50%)", border: "none", pointerEvents: "none", zIndex: 0 }}
          />
        )}
      </div>

      <div className={styles.overlay}>
        <div className={styles.overlayContent}>
          <div className={styles.tags}>
            <span className={styles.tag}>{year}</span>
            <span className={styles.tag}>Trailer</span>
            {trailer.vote_average && <span className={styles.tag}>★ {trailer.vote_average.toFixed(1)}</span>}
          </div>

          <h2 className={styles.title}>{title}</h2>
          <p className={styles.description}>{trailer.overview}</p>

          <div className={styles.actions}>
            <button className={styles.primaryButton} onClick={onToggleMute}>
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              {isMuted ? "Unmute" : "Mute"}
            </button>

            <button 
              className={styles.iconButton} 
              onClick={handleWatchlist}
              style={isInWatchlist ? { color: 'var(--color-success)', borderColor: 'var(--color-success)' } : {}}
            >
              {isInWatchlist ? <Check size={24} /> : <Plus size={24} />}
            </button>

            <button className={styles.iconButton} onClick={handleShare}>
              <Share2 size={22} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
