"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { CanimaSyncLobby } from "@/components/canimasync/CanimaSyncLobby";
import { CanimaSyncWaitingRoom } from "@/components/canimasync/CanimaSyncWaitingRoom";
import { CanimaSyncSwipe } from "@/components/canimasync/CanimaSyncSwipe";
import { CanimaSyncResults } from "@/components/canimasync/CanimaSyncResults";

// Local types to match component expected props
interface CanimaParticipant {
  userId: string;
  name?: string;
  isHost?: boolean;
}

interface CanimaCard {
  tmdbId: number;
  title?: string;
  posterPath?: string | null;
  overview?: string;
  releaseDate?: string;
  voteAverage?: number;
}

export default function CanimaSyncPage() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

  // All handlers defined at the top — before any conditional returns (#9)
  const handleExit = useCallback(() => {
    localStorage.removeItem("canima_roomId");
    localStorage.removeItem("canima_userId");
    localStorage.removeItem("canima_isHost");
    setRoomId(null);
    setUserId(null);
    setIsHost(false);
    setMovieCards([]);
    setSessionLikes([]);
    setLoadedUpTo(0);
  }, []);

  // Reactive room state via Convex subscription
  const roomState = useQuery(api.canimasync.getRoomState, roomId ? { roomId } : "skip");
  
  const generateMoviePool = useAction(api.canimasync.generateMoviePool);
  const hydrateMovies = useAction(api.canimasync.hydrateMovies);
  const submitVote = useMutation(api.canimasync.submitVote);
  const finishSession = useMutation(api.canimasync.finishSession);
  
  // Load session from localStorage on mount
  useEffect(() => {
    const savedRoom = localStorage.getItem("canima_roomId");
    const savedUser = localStorage.getItem("canima_userId");
    const savedHost = localStorage.getItem("canima_isHost");
    if (savedRoom && savedUser) {
      setRoomId(savedRoom);
      setUserId(savedUser);
      setIsHost(savedHost === "true");
    }
  }, []);

  // Save session to localStorage — but only for active rooms
  useEffect(() => {
    if (roomId && userId && roomState && (roomState.status === "waiting" || roomState.status === "voting")) {
      localStorage.setItem("canima_roomId", roomId);
      localStorage.setItem("canima_userId", userId);
      localStorage.setItem("canima_isHost", String(isHost));
    }
  }, [roomId, userId, isHost, roomState]);

  // Clear session if room is gone or has ended
  useEffect(() => {
    if (!roomId) return;
    // roomState is `undefined` while loading, `null` when room doesn't exist
    if (roomState === null) {
      handleExit();
    }
    // Auto-clear for ended sessions
    if (roomState && (roomState.status === "matched" || roomState.status === "failed")) {
      localStorage.removeItem("canima_roomId");
      localStorage.removeItem("canima_userId");
      localStorage.removeItem("canima_isHost");
    }
  }, [roomId, roomState, handleExit]);

  const [movieCards, setMovieCards] = useState<CanimaCard[]>([]);
  const [sessionLikes, setSessionLikes] = useState<CanimaCard[]>([]);
  const [loadedUpTo, setLoadedUpTo] = useState(0);
  const [isLoadingMovies, setIsLoadingMovies] = useState(false);

  const BATCH_SIZE = 20;

  // Load a batch of movies from server (#1, #2, #5, #6)
  const loadMoreMovies = useCallback(async () => {
    if (!roomState?.moviePool || isLoadingMovies) return;
    
    const pool = roomState.moviePool;
    if (loadedUpTo >= pool.length) return; // All loaded

    setIsLoadingMovies(true);
    try {
      const nextBatch = pool.slice(loadedUpTo, loadedUpTo + BATCH_SIZE);
      const mediaType = roomState.mediaType || "movie";
      
      // Server-side TMDB fetching — no API key in client (#1, #2)
      const results = await hydrateMovies({ 
        tmdbIds: nextBatch, 
        mediaType: mediaType as "movie" | "tv"
      });

      setMovieCards(prev => [...prev, ...results]);
      setLoadedUpTo(prev => prev + nextBatch.length);
    } catch (e) {
      console.error("Failed to load movies:", e);
    } finally {
      setIsLoadingMovies(false);
    }
  }, [roomState?.moviePool, roomState?.mediaType, loadedUpTo, isLoadingMovies, hydrateMovies]);

  // Initial load when room transitions to voting
  useEffect(() => {
    if (roomState?.status === "voting" && roomState.moviePool && movieCards.length === 0 && !isLoadingMovies) {
      loadMoreMovies();
    }
  }, [roomState?.status, roomState?.moviePool, movieCards.length, isLoadingMovies, loadMoreMovies]);

  const handleStart = async () => {
    if (roomId && isHost) {
      try {
        await generateMoviePool({ roomId });
      } catch (err) {
        console.error("Failed to start:", err);
        alert("Failed to generate movie pool. Please try again.");
      }
    }
  };

  const handleVote = async (tmdbId: number, vote: "like" | "dislike", details: { title?: string; posterPath?: string | null; releaseDate?: string }) => {
    if (roomId && userId) {
      const finalTitle = details.title || "Untitled";
      if (vote === "like") {
        setSessionLikes(prev => [...prev, { ...details, title: finalTitle, tmdbId }]);
      }
      const safeDetails = {
        title: finalTitle,
        posterPath: details.posterPath || undefined,
        releaseDate: details.releaseDate
      };
      await submitVote({ roomId, userId, tmdbId, vote, movieDetails: safeDetails });
    }
  };

  const handleFinish = async () => {
    if (roomId) {
      await finishSession({ roomId });
    }
  };

  const handlePlayAgain = () => {
    handleExit(); // Clear everything and go back to lobby
  };

  // --- Render Logic ---

  if (!roomId) {
    return (
      <main style={{ minHeight: '100vh', background: '#000' }}>
        <div style={{ paddingTop: '80px' }}>
          <CanimaSyncLobby onJoin={(rid, uid, host) => {
            setRoomId(rid);
            setUserId(uid);
            setIsHost(host);
          }} />
        </div>
      </main>
    );
  }

  // Room failed to generate movies (#10)
  if (roomState?.status === "failed") {
    return (
      <main style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'white', textAlign: 'center', padding: '0 24px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 16 }}>Something went wrong</h2>
          <p style={{ color: '#999', marginBottom: 24 }}>Failed to load movies. Try different genres or providers.</p>
          <button 
            onClick={handleExit}
            style={{
              padding: '12px 24px', background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12,
              color: 'white', cursor: 'pointer', fontSize: '1rem'
            }}
          >
            Back to Lobby
          </button>
        </div>
      </main>
    );
  }

  if (roomState?.status === "waiting") {
    return (
      <CanimaSyncWaitingRoom 
        roomId={roomId}
        participants={roomState.participants.map((p: Partial<CanimaParticipant>) => ({
          ...p,
          userId: p.userId || "unknown",
          name: p.name || "Guest",
          isHost: p.isHost || false
        }))}
        isHost={isHost}
        onStart={handleStart}
        onExit={handleExit}
      />
    );
  }

  // Voting state — show the swipe UI (#7 — only "voting" here, not "matched")
  if (roomState?.status === "voting") {
    if (movieCards.length === 0) {
      return <div style={{color: 'white', display: 'flex', justifyContent: 'center', paddingTop: '100px'}}>Loading movies...</div>;
    }
    return (
      <main style={{ minHeight: '100vh', background: '#000' }}>
        <CanimaSyncSwipe 
          movies={movieCards} 
          onVote={handleVote} 
          history={sessionLikes}
          matches={roomState.matches || []}
          onFinish={handleFinish}
          onExit={handleExit}
          votes={roomState.votes || []}
          participants={roomState.participants || []}
          onLoadMore={loadMoreMovies}
          isLoadingMore={isLoadingMovies}
          totalPoolSize={roomState.moviePool?.length || 0}
        />
      </main>
    );
  }

  // Matched state — show the results screen (#7 — now reachable!)
  if (roomState?.status === "matched") {
    return (
      <main style={{ minHeight: '100vh', background: '#000' }}>
        <CanimaSyncResults 
          matches={roomState.matches || []} 
          onPlayAgain={handlePlayAgain}
          mediaType={(roomState.mediaType as "movie" | "tv") || "movie"}
        />
      </main>
    );
  }

  return <div style={{color: 'white'}}>Loading...</div>;
}
