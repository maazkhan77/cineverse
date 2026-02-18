"use client";

import { HeroSection, MoodTuner, MOOD_GENRES, Carousel, CarouselItem, TMDBBlockedFallback } from "@/components/ui";
import { BentoGrid } from "@/components/ui/BentoGrid/BentoGrid";
import { MovieCard } from "@/components/ui/MovieCard";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import styles from "@/app/page.module.css";
import { TMDBResult } from "@/lib/tmdb";
import {
  useTrendingMovies,
  useTrendingTV,
  useNowPlaying,
  useUpcoming,
  useTopRatedMovies,
  useTopRatedTV,
  useAiringToday,
  useOnTheAir,
} from "@/hooks/useTMDB";

import type { Mood } from "@/components/ui/MoodTuner/MoodTuner";

export default function HomeContent() {
  const router = useRouter();
  const [activeMood, setActiveMood] = useState<Mood>("all");

  // Fetch all data with TanStack Query
  const { 
    data: trendingMoviesData, 
    isLoading: loadingTrendingMovies, 
    isError: isTrendingError 
  } = useTrendingMovies();
  const { data: trendingTVData, isLoading: loadingTrendingTV } = useTrendingTV();
  const { data: nowPlayingData, isLoading: loadingNowPlaying } = useNowPlaying();
  const { data: upcomingData, isLoading: loadingUpcoming } = useUpcoming();
  const { data: topRatedMoviesData, isLoading: loadingTopRatedMovies } = useTopRatedMovies();
  const { data: topRatedTVData, isLoading: loadingTopRatedTV } = useTopRatedTV();
  const { data: airingTodayData, isLoading: loadingAiringToday } = useAiringToday();
  const { data: onTheAirData, isLoading: loadingOnTheAir } = useOnTheAir();

  const trendingMovies = trendingMoviesData?.results ?? [];
  const trendingTV = trendingTVData?.results ?? [];
  const nowPlaying = nowPlayingData?.results ?? [];
  const upcoming = upcomingData?.results ?? [];
  const topRatedMovies = topRatedMoviesData?.results ?? [];
  const topRatedTV = topRatedTVData?.results ?? [];
  const airingToday = airingTodayData?.results ?? [];
  const onTheAir = onTheAirData?.results ?? [];

  // Filter content by mood
  const filterByMood = useMemo(() => {
    const moodGenres = MOOD_GENRES[activeMood as keyof typeof MOOD_GENRES];
    if (moodGenres.length === 0) return (items: TMDBResult[]) => items;
    return (items: TMDBResult[]) => items.filter(item => 
      item.genre_ids?.some(id => moodGenres.includes(id))
    );
  }, [activeMood]);

  const handleItemClick = (id: number, mediaType: "movie" | "tv") => {
    router.push(`/${mediaType}/${id}`);
  };

  const renderCarousel = (
    title: string, 
    items: TMDBResult[], 
    mediaType: "movie" | "tv", 
    loading: boolean
  ) => {
    if (loading) {
      return (
        <Carousel title={title}>
          {Array.from({ length: 8 }).map((_, i) => (
            <CarouselItem key={i}>
              <Skeleton variant="rect" style={{ width: 180, height: 270, borderRadius: 12 }} />
            </CarouselItem>
          ))}
        </Carousel>
      );
    }

    const filtered = filterByMood(items);
    if (filtered.length === 0) return null;

    return (
      <Carousel title={title}>
        {filtered.slice(0, 20).map((item) => (
          <CarouselItem key={item.id}>
            <MovieCard
              id={item.id}
              title={item.title || item.name || ""}
              posterPath={item.poster_path}
              voteAverage={item.vote_average}
              mediaType={item.media_type || mediaType}
              releaseDate={item.release_date || item.first_air_date}
              onClick={() => handleItemClick(item.id, item.media_type || mediaType)}
            />
          </CarouselItem>
        ))}
      </Carousel>
    );
  };

  if (isTrendingError) {
    return (
      <main className={styles.main}>
        <TMDBBlockedFallback />
      </main>
    );
  }

  return (
    <main className={styles.main}>
      {/* Hero Section */}
      {!loadingTrendingMovies && trendingMovies.length > 0 && (
        <HeroSection
          items={trendingMovies.slice(0, 5).map(item => ({
            id: item.id,
            title: item.title || item.name || "",
            overview: item.overview,
            backdropPath: item.backdrop_path,
            voteAverage: item.vote_average,
            mediaType: item.media_type || "movie",
            trailerKey: item.trailerKey,
          }))}
          onItemClick={handleItemClick}
        />
      )}

      <motion.div 
        className={styles.content}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.3 }
          }
        }}
      >
        {/* Mood Tuner */}
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <MoodTuner activeMood={activeMood} onMoodChange={setActiveMood} />
        </motion.div>

        {/* Movies Section */}
        <motion.h2 
          className={styles.sectionHeader}
          variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
        >
          Movies
        </motion.h2>
        
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          {renderCarousel("Trending Movies", trendingMovies.slice(1), "movie", loadingTrendingMovies)}
        </motion.div>

        {/* Bento Grid */}
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <h3 className={styles.sectionHeader} style={{ marginBottom: '20px', marginTop: '40px' }}>
            Featured Collections
          </h3>
          <BentoGrid movies={filterByMood(trendingMovies)} />
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          {renderCarousel("Now Playing in Theaters", nowPlaying, "movie", loadingNowPlaying)}
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          {renderCarousel("Coming Soon", upcoming, "movie", loadingUpcoming)}
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          {renderCarousel("Top Rated Movies", topRatedMovies, "movie", loadingTopRatedMovies)}
        </motion.div>

        {/* TV Series Section */}
        <motion.h2 
          className={styles.sectionHeader}
          variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
        >
          TV Series
        </motion.h2>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          {renderCarousel("Trending TV Shows", trendingTV, "tv", loadingTrendingTV)}
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          {renderCarousel("Airing Today", airingToday, "tv", loadingAiringToday)}
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          {renderCarousel("Currently On Air", onTheAir, "tv", loadingOnTheAir)}
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          {renderCarousel("Top Rated TV Shows", topRatedTV, "tv", loadingTopRatedTV)}
        </motion.div>
      </motion.div>
    </main>
  );
}
