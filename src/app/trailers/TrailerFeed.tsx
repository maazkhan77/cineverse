"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./TrailerFeed.module.css";
import { TrailerFeedItem } from "./TrailerFeedItem";
import { Navbar } from "@/components/ui";

export interface TrailerData {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  trailerKey: string;
  poster_path: string | null;
}

interface TrailerFeedProps {
  trailers: TrailerData[];
}

export default function TrailerFeed({ trailers }: TrailerFeedProps) {
  const [activeId, setActiveId] = useState<number>(trailers[0]?.id || 0);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Find the id from the element's data attribute
            const id = Number(entry.target.getAttribute("data-id"));
            setActiveId(id);
          }
        });
      },
      {
        root: container,
        threshold: 0.6, // Trigger when 60% visible
      }
    );

    const items = container.querySelectorAll(`.${styles.feedItemWrapper}`);
    items.forEach((item) => observer.observe(item));

    return () => {
      items.forEach((item) => observer.unobserve(item));
      observer.disconnect();
    };
  }, [trailers]);

  return (
    <>
      <Navbar /> 
      {/* Navbar might overlay, check z-index */}
      <div className={styles.container}>
        <div className={styles.feed} ref={containerRef}>
          {trailers.map((trailer) => (
            <div 
                key={trailer.id} 
                data-id={trailer.id} 
                className={styles.feedItemWrapper}
            >
              <TrailerFeedItem 
                item={trailer} 
                isActive={activeId === trailer.id}
                isMuted={isMuted}
                onToggleMute={() => setIsMuted(!isMuted)}
              />
            </div>
          ))}
          
          {trailers.length === 0 && (
             <div className={styles.emptyState}>
                <p>No trailers available right now.</p>
             </div>
          )}
        </div>
      </div>
    </>
  );
}
