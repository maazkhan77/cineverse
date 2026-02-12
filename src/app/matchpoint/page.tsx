"use client";

import { useState, useEffect } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MatchPointLobby } from "@/components/matchpoint/MatchPointLobby";
import { MatchPointSwipe } from "@/components/matchpoint/MatchPointSwipe";
import { MatchPointResults } from "@/components/matchpoint/MatchPointResults";
import styles from "../../components/matchpoint/MatchPointLobby.module.css"; // Reuse lobby styles for waiting
import { Id } from "../../../convex/_generated/dataModel";

export default function MatchPointPage() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  
  // Polling room state
  // In Convex, queries update automatically!
  const roomState = useQuery(api.matchpoint.getRoomState, roomId ? { roomId } : "skip");
  
  const generateMoviePool = useAction(api.matchpoint.generateMoviePool);
  const submitVote = useMutation(api.matchpoint.submitVote);
  const getMovies = useAction(api.tmdb.getMovies); // We need this to hydrate the IDs
  
  const [movieCards, setMovieCards] = useState<any[]>([]);
  const [sessionLikes, setSessionLikes] = useState<any[]>([]);

  // Effect: Hydrate movie pool when it changes
  useEffect(() => {
    if (roomState?.status === "voting" && roomState.moviePool && movieCards.length === 0) {
      const fetchDetails = async () => {
        const ids = roomState.moviePool.slice(0, 15); // Increased limit slightly
        const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || "eec102d1a3eb8c2672da104a3ad39b56"; 
        const type = roomState.mediaType || "movie";
        
        const promises = ids.map(id => 
            fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}&append_to_response=videos,credits,release_dates,content_ratings,watch/providers`).then(r => r.json())
        );
        
        try {
            const results = await Promise.all(promises);
            setMovieCards(results.map((m: any) => ({
                tmdbId: m.id,
                title: m.title || m.name, // Support TV (name) vs Movie (title)
                posterPath: m.poster_path,
                backdropPath: m.backdrop_path,
                overview: m.overview,
                voteAverage: m.vote_average,
                releaseDate: m.release_date || m.first_air_date,
                genres: m.genres?.map((g: any) => g.name).slice(0, 3) || [],
                videos: m.videos?.results || [],
                credits: m.credits,
                runtime: m.runtime || (m.episode_run_time ? m.episode_run_time[0] : null),
                mediaType: type,
                providers: m["watch/providers"]?.results?.IN?.flatrate || []
            })));
        } catch (e) {
            console.error("Failed to fetch content", e);
        }
      };
      
      fetchDetails();
    }
  }, [roomState?.status, roomState?.moviePool, roomState?.mediaType]);

  const handleStart = async () => {
    if (roomId && isHost) {
      await generateMoviePool({ roomId });
    }
  };

  const handleVote = async (tmdbId: number, vote: "like" | "dislike", details: any) => {
    if (roomId && userId) {
      if (vote === "like") {
        setSessionLikes(prev => [...prev, { ...details, tmdbId }]);
      }
      await submitVote({ roomId, userId, tmdbId, vote, movieDetails: details });
    }
  };

  if (!roomId) {
    return (
      <main style={{ minHeight: '100vh', background: '#000' }}>
        <div style={{ paddingTop: '80px' }}>
          <MatchPointLobby onJoin={(rid, uid, host) => {
            setRoomId(rid);
            setUserId(uid);
            setIsHost(host);
          }} />
        </div>
      </main>
    );
  }

  if (roomState?.status === "waiting") {
    return (
      <main style={{ minHeight: '100vh', background: '#000', color: 'white' }}>
        <div style={{ paddingTop: '100px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h1>Waiting Lobby</h1>
          <div className={styles.roomCode}>{roomId}</div>
          <p className={styles.copyHint}>Share this code with your friends</p>
          
          <div className={styles.participantsList}>
            {roomState.participants.map((p: any) => (
              <div key={p.userId} className={styles.participant}>
                {p.isHost ? '👑' : '👤'} {p.name}
              </div>
            ))}
          </div>

          {isHost ? (
            <button 
              className={styles.actionButton}
              onClick={handleStart}
              disabled={roomState.participants.length < 1} // Can play solo too? Maybe need > 1
            >
              Start Game ({roomState.participants.length} Players)
            </button>
          ) : (
            <p>Waiting for host to start...</p>
          )}
        </div>
      </main>
    );
  }

  const finishSession = useMutation(api.matchpoint.finishSession);

  const handleFinish = async () => {
    if (roomId) {
      await finishSession({ roomId });
    }
  };

  if (roomState?.status === "voting" || (roomState?.status === "matched" && roomState?.matches)) {
      if (movieCards.length === 0) {
          return <div style={{color: 'white', display: 'flex', justifyContent: 'center', paddingTop: '100px'}}>Loading movies...</div>;
      }
      return (
        <main style={{ minHeight: '100vh', background: '#000' }}>
            {/* Minimal header/nav */}
            <MatchPointSwipe 
              movies={movieCards} 
              onVote={handleVote} 
              history={sessionLikes}
              matches={roomState.matches || []}
              onFinish={handleFinish}
            />
        </main>
      );
  }

  // Fallback for single match legacy rooms or error states
  // Updated to handle multi-match results
  if (roomState?.status === "matched") {
    return (
        <main style={{ minHeight: '100vh', background: '#000' }}>
            <MatchPointResults 
                matches={roomState.matches || []} 
            />
        </main>
    );
  }



  return <div style={{color: 'white'}}>Loading...</div>;
}
