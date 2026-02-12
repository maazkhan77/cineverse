"use client";

import { ContentRow, ContentModal } from "@/components/ui";
import { useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import styles from "./page.module.css";

interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  profile_path: string | null;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  known_for_department: string;
  combined_credits?: {
    cast: {
      id: number;
      title?: string;
      name?: string;
      poster_path: string | null;
      vote_average: number;
      media_type: "movie" | "tv";
      character?: string;
      release_date?: string;
      first_air_date?: string;
    }[];
  };
}

export default function PersonPage() {
  const params = useParams();
  const personId = Number(params.id);
  const getPersonDetails = useAction(api.tmdb.getPersonDetails);
  
  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<{ id: number; mediaType: "movie" | "tv" } | null>(null);

  useEffect(() => {
    async function fetchPerson() {
      try {
        const data = await getPersonDetails({ id: personId }) as PersonDetails;
        setPerson(data);
      } catch (err) {
        console.error("Failed to fetch person", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPerson();
  }, [personId, getPersonDetails]);

  const handleItemClick = (id: number, mediaType: "movie" | "tv") => {
    setSelectedItem({ id, mediaType });
  };

  if (isLoading) {
    return (
      <main className={styles.main}>
        {/* Navbar is in layout */}
        <div className={styles.profileHeader}>
          <div className={styles.spinner} />
        </div>
      </main>
    );
  }

  if (!person) {
    return (
      <>
        <main className={styles.main}>
        {/* Navbar is in layout */}
        <div className={styles.error}>Person not found</div>
      </main>
      </>
    );
  }

  const age = person.birthday
    ? Math.floor((Date.now() - new Date(person.birthday).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  const movies = person.combined_credits?.cast
    .filter((c) => c.media_type === "movie")
    .sort((a, b) => b.vote_average - a.vote_average)
    .slice(0, 20) || [];

  const tvShows = person.combined_credits?.cast
    .filter((c) => c.media_type === "tv")
    .sort((a, b) => b.vote_average - a.vote_average)
    .slice(0, 20) || [];

  return (
    <>
      <main className={styles.main}>
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className={styles.profileImage}>
            {person.profile_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w500${person.profile_path}`}
                alt={person.name}
                width={300}
                height={450}
                className={styles.image}
              />
            ) : (
              <div className={styles.noImage}>👤</div>
            )}
          </div>
          
          <div className={styles.info}>
            <h1 className={styles.name}>{person.name}</h1>
            <p className={styles.department}>{person.known_for_department}</p>
            
            <div className={styles.meta}>
              {person.birthday && (
                <span>🎂 Born: {new Date(person.birthday).toLocaleDateString()} {age && `(${age} years old)`}</span>
              )}
              {person.place_of_birth && <span>📍 {person.place_of_birth}</span>}
            </div>

            {person.biography && (
              <p className={styles.bio}>{person.biography.slice(0, 800)}{person.biography.length > 800 ? "..." : ""}</p>
            )}
          </div>
        </motion.div>

        <div className={styles.content}>
          {movies.length > 0 && (
            <ContentRow
              title="🎬 Movies"
              items={movies}
              onItemClick={handleItemClick}
            />
          )}

          {tvShows.length > 0 && (
            <ContentRow
              title="📺 TV Shows"
              items={tvShows}
              onItemClick={handleItemClick}
            />
          )}
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
