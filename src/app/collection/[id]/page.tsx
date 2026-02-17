"use client";

import { ContentRow } from "@/components/ui/ContentRow/ContentRow";
import { ContentModal } from "@/components/ui/ContentModal/ContentModal";
import { useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import styles from "./page.module.css";

interface CollectionDetails {
  id: number;
  name: string;
  overview: string;
  backdrop_path: string | null;
  poster_path: string | null;
  parts: {
    id: number;
    title: string;
    poster_path: string | null;
    vote_average: number;
    release_date: string;
  }[];
}

export default function CollectionPage() {
  const params = useParams();
  const collectionId = Number(params.id);
  const getCollection = useAction(api.tmdb.getCollection);
  
  const [collection, setCollection] = useState<CollectionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<{ id: number; mediaType: "movie" | "tv" } | null>(null);

  useEffect(() => {
    async function fetchCollection() {
      try {
        const data = await getCollection({ id: collectionId }) as CollectionDetails;
        setCollection(data);
      } catch (err) {
        console.error("Failed to fetch collection", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCollection();
  }, [collectionId, getCollection]);

  const handleItemClick = (id: number) => {
    setSelectedItem({ id, mediaType: "movie" });
  };

  if (isLoading) {
    return (
      <>
        <main className={styles.main}>
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        </main>
      </>
    );
  }

  if (!collection) {
    return (
      <>
        <main className={styles.main}>
          <div className={styles.error}>Collection not found</div>
        </main>
      </>
    );
  }

  const sortedParts = [...collection.parts].sort(
    (a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
  );

  return (
    <>
      <main className={styles.main}>
        <div className={styles.hero}>
          {collection.backdrop_path && (
            <Image
              src={`https://image.tmdb.org/t/p/original${collection.backdrop_path}`}
              alt={collection.name}
              fill
              className={styles.backdrop}
              priority
            />
          )}
          <div className={styles.heroGradient} />
          <motion.div 
            className={styles.heroContent}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className={styles.title}>{collection.name}</h1>
            <span className={styles.count}>{collection.parts.length} Movies</span>
            {collection.overview && (
              <p className={styles.overview}>{collection.overview}</p>
            )}
          </motion.div>
        </div>

        <div className={styles.content}>
          <ContentRow
            title="Movies in Collection"
            items={sortedParts}
            mediaType="movie"
            onItemClick={handleItemClick}
          />
        </div>
      </main>

      <ContentModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        id={selectedItem?.id || 0}
        mediaType={selectedItem?.mediaType || "movie"}
      />
    </>
  );
}
