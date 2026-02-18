"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./Carousel.module.css";

interface CarouselProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Carousel({ title, children, className }: CarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Combine refs: emblaRef (callback ref) + our own ref for wheel events
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      viewportRef.current = node;
      emblaRef(node);
    },
    [emblaRef]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Mouse wheel horizontal scrolling
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !emblaApi) return;

    const handleWheel = (e: WheelEvent) => {
      // Use deltaY (vertical scroll) to scroll horizontally
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (delta === 0) return;

      e.preventDefault();
      const scrollContainer = emblaApi.rootNode();
      if (scrollContainer) {
        emblaApi.scrollTo(
          emblaApi.selectedScrollSnap() + (delta > 0 ? 1 : -1)
        );
      }
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [emblaApi]);

  return (
    <section className={`${styles.section} ${className || ""}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.controls}>
          <button
            className={`${styles.navButton} ${!canScrollPrev ? styles.disabled : ""}`}
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className={`${styles.navButton} ${!canScrollNext ? styles.disabled : ""}`}
            onClick={scrollNext}
            disabled={!canScrollNext}
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className={styles.viewport} ref={setRefs}>
        <div className={styles.container}>
          {children}
        </div>
      </div>
    </section>
  );
}

interface CarouselItemProps {
  children: React.ReactNode;
  className?: string;
}

export function CarouselItem({ children, className }: CarouselItemProps) {
  return (
    <div className={`${styles.slide} ${className || ""}`}>
      {children}
    </div>
  );
}
