"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import { Plus, Volume2, VolumeX, Share2 } from "lucide-react";
import styles from "./TrailerDeck.module.css";

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
}

interface TrailerSlideProps {
  trailer: TrailerData;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export function TrailerSlide({ trailer, isActive, isMuted, onToggleMute }: TrailerSlideProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const title = trailer.title || trailer.name || "Untitled";
  const year = (trailer.release_date || trailer.first_air_date || "").split("-")[0];
  const posterUrl = trailer.poster_path
    ? `https://image.tmdb.org/t/p/w780${trailer.poster_path}`
    : "/placeholder-poster.jpg";
  const backdropUrl = trailer.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${trailer.backdrop_path}`
    : posterUrl;

  // YouTube embed URL - always start muted for autoplay to work
  // Mute/unmute is controlled via postMessage API
  const embedUrl = `https://www.youtube.com/embed/${trailer.trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${trailer.trailerKey}&rel=0&showinfo=0&iv_load_policy=3&playsinline=1&enablejsapi=1`;

  // Control mute/unmute via YouTube IFrame API postMessage
  // We need a small delay when iframe first loads to ensure player is ready
  useEffect(() => {
    if (!isActive || !iframeRef.current) return;

    const iframe = iframeRef.current;
    const command = isMuted ? "mute" : "unMute";

    // Send command to YouTube player with a delay to ensure it's ready
    const sendCommand = () => {
      iframe.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: command,
          args: [],
        }),
        "*"
      );
    };

    // Initial delay when iframe first loads (YouTube needs time to initialize)
    const initialTimer = setTimeout(sendCommand, 500);
    
    // Also send immediately for subsequent mute toggles
    sendCommand();

    return () => clearTimeout(initialTimer);
  }, [isMuted, isActive]);

  return (
    <div className={styles.slide}>
      {/* Ambient Background */}
      <div className={styles.ambientLayer}>
        <Image
          src={posterUrl}
          alt="Ambient"
          fill
          className={styles.ambientImage}
          priority={isActive}
        />
      </div>

      {/* Video Layer */}
      <div className={styles.videoLayer}>
        {/* Backdrop placeholder - fades when video loads */}
        <Image
          src={backdropUrl}
          alt={title}
          fill
          className="object-cover"
          priority={isActive}
          style={{
            opacity: isActive ? 0 : 1,
            transition: "opacity 0.8s ease",
            zIndex: 1,
          }}
        />

        {/* YouTube iframe - ONLY render when active */}
        {isActive && (
          <iframe
            ref={iframeRef}
            key={trailer.trailerKey}
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "115%",
              height: "115%",
              transform: "translate(-50%, -50%)",
              border: "none",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
        )}
      </div>

      {/* Overlay */}
      <div className={styles.overlay}>
        <div className={styles.overlayContent}>
          <div className={styles.tags}>
            <span className={styles.tag}>{year}</span>
            <span className={styles.tag}>Trailer</span>
            {trailer.vote_average && (
              <span className={styles.tag}>★ {trailer.vote_average.toFixed(1)}</span>
            )}
          </div>

          <h2 className={styles.title}>{title}</h2>
          <p className={styles.description}>{trailer.overview}</p>

          <div className={styles.actions}>
            <button className={styles.primaryButton} onClick={onToggleMute}>
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              {isMuted ? "Unmute" : "Mute"}
            </button>

            <button className={styles.iconButton}>
              <Plus size={24} />
            </button>

            <button className={styles.iconButton}>
              <Share2 size={22} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
