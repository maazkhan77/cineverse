"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./CanimaSyncSwipe.module.css";
import Image from "next/image";
import { X, Heart, Info, Play, History, Volume2, VolumeX, MonitorPlay } from "lucide-react";
import dynamic from "next/dynamic";
import { CurtainTransition } from "./CurtainTransition";
import { CanimaSyncCard } from "./CanimaSyncCard";

// Fix for ReactPlayer types with dynamic import
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

interface Card {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  backdropPath?: string | null;
  overview: string;
  voteAverage: number;
  releaseDate: string;
  genres?: string[];
  videos?: any[];
  credits?: any;
  runtime?: number;
  mediaType?: "movie" | "tv";
  providers?: any[]; // For StreamSync (if passed)
}

interface CanimaSyncSwipeProps {
  movies: Card[];
  onVote: (movieId: number, vote: "like" | "dislike", details: any) => void;
  history?: any[];
  matches?: any[];
  onFinish?: () => void;
  votes?: any[];
  participants?: any[];
}

export function CanimaSyncSwipe({ 
  movies, 
  onVote, 
  history = [], 
  matches = [], 
  onFinish,
  votes = [],
  participants = []
}: CanimaSyncSwipeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCurtain, setShowCurtain] = useState(false);
  const [muted, setMuted] = useState(true);
  
  // Modals
  const [showInfo, setShowInfo] = useState<Card | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showMatches, setShowMatches] = useState(false);

  // Scroll to top on index change? Not needed for swipe container usually.
  
  const currentMovie = movies[currentIndex];
  const nextMovie = movies[currentIndex + 1]; // Preload hint?

  const handleVote = (vote: "like" | "dislike") => {
    // 1. Trigger Curtain Close
    setShowCurtain(true);

    // 2. Wait for curtain to cover (approx 600ms)
    setTimeout(() => {
        // 3. Commit Vote & Change Movie
        onVote(currentMovie.tmdbId, vote, currentMovie);
        setCurrentIndex(prev => prev + 1);
        
        // 5. Open Curtain
        setTimeout(() => {
            setShowCurtain(false);
        }, 400); // Short delay before opening
    }, 800);
  };

  const toggleMute = () => setMuted(!muted);

  // Calculate Voting Stats for Current Movie
  const getVotingStats = () => {
    if (!currentMovie || !votes || !participants) return undefined;
    
    // Filter likes for this movie
    const movieLikes = votes.filter((v: any) => v.tmdbId === currentMovie.tmdbId && v.vote === "like");
    
    if (movieLikes.length === 0) return undefined;

    // Map userIds to names
    const profiles = movieLikes.map((like: any) => {
        const participant = participants.find((p: any) => p.userId === like.userId);
        return {
            name: participant ? participant.name : "Unknown",
            avatar: "" // Generate avatar letter in Card component
        };
    });

    return {
        count: movieLikes.length,
        profiles
    };
  };

  const votingStats = getVotingStats();

  if (!currentMovie) {
    return (
      <div className={styles.container}>
        <div style={{color: 'white', textAlign: 'center', zIndex: 50}}>
          <h2>All caught up!</h2>
          <p>Waiting for matches...</p>
          <div className={styles.buttonGroup} style={{display: 'flex', gap: 20, justifyContent: 'center', marginTop: 20}}>
            <button 
                    className={styles.iconBtn} 
                    onClick={() => setShowHistory(true)}
                    title="History"
                >
                    <History size={24} />
            </button>
            <button 
                    className={styles.iconBtn} 
                    onClick={() => setShowMatches(true)}
                    style={{borderColor: '#4ade80', color: '#4ade80'}}
                    title="Matches"
                >
                    <MonitorPlay size={24} />
                    {matches.length > 0 && <span className={styles.badgeCount}>{matches.length}</span>}
            </button>
          </div>
        </div>
        {/* History Modal */}
        {showHistory && (
            <div className={styles.historyOverlay}>
                <div className={styles.historyHeader}>
                    <h2 className={styles.historyTitle}>Your Likes</h2>
                    <button onClick={() => setShowHistory(false)} className={styles.closeBtn}><X /></button>
                </div>
                <div className={styles.historyGrid}>
                    {history.map((m: any) => (
                        <div key={m.tmdbId} className={styles.historyItem}>
                            {m.posterPath && (
                            <Image 
                                src={`https://image.tmdb.org/t/p/w342${m.posterPath}`} 
                                alt={m.title} 
                                fill 
                                className={styles.historyPoster}
                            />
                        )}
                        <div className={styles.historyTitleOverlay}>{m.title}</div>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </div>
    );
  }

  return (
    <div className={styles.container}>
      <CurtainTransition show={showCurtain} />

      {/* Main Card */}
      <CanimaSyncCard 
        movie={currentMovie}
        isActive={!showCurtain && !showInfo && !showHistory && !showMatches}
        onVote={(vote: "like" | "dislike") => handleVote(vote)}
        onInfo={() => setShowInfo(currentMovie)}
        muted={muted}
        onToggleMute={toggleMute}
        votingStats={votingStats}
      />

      {/* Top Actions (History/Matches only - Sound moved to Card) */}
      <div className={styles.topActions}>
        <button className={styles.iconBtn} onClick={() => setShowHistory(true)}>
          <History size={24} />
          {history.length > 0 && <span style={{
                position: 'absolute', top: 0, right: 0, background: 'red', 
                borderRadius: '50%', width:16, height:16, fontSize:10, display:'flex', alignItems:'center', justifyContent:'center'
            }}>{history.length}</span>}
        </button>
        {matches.length > 0 && (
             <button className={styles.iconBtn} onClick={() => setShowMatches(true)} style={{borderColor: '#4ade80', color: '#4ade80'}}>
                <MonitorPlay size={24} />
                <span style={{
                    position: 'absolute', top: 0, right: 0, background: '#4ade80', color: 'black', fontWeight: 'bold',
                    borderRadius: '50%', width:16, height:16, fontSize:10, display:'flex', alignItems:'center', justifyContent:'center'
                }}>{matches.length}</span>
            </button>
        )}
      </div>

      {/* Info Modal */}
      {showInfo && (
        <div className={styles.historyOverlay}>
             <div className={styles.historyHeader}>
                <h2 className={styles.historyTitle} style={{maxWidth: '80%'}}>{showInfo.title}</h2>
                <button onClick={() => setShowInfo(null)} className={styles.closeBtn}><X size={32}/></button>
            </div>
            <div style={{color: 'white', paddingBottom: 40, maxWidth: 800, margin: '0 auto'}}>
                <p style={{fontSize: '1.2rem', lineHeight: 1.6, marginBottom: 30}}>{showInfo.overview}</p>
                
                {/* Providers */}
                {showInfo.providers && showInfo.providers.length > 0 && (
                    <div style={{marginBottom: 30}}>
                        <h3 style={{marginBottom: 15, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1}}>Streaming In India</h3>
                        <div style={{display: 'flex', gap: 12}}>
                            {showInfo.providers.map((p: any) => (
                                <div key={p.provider_id} title={p.provider_name}>
                                    <Image 
                                        src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                                        alt={p.provider_name}
                                        width={48}
                                        height={48}
                                        style={{borderRadius: 8}}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {showInfo.credits?.cast && (
                    <>
                        <h3 style={{marginBottom: 15, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1}}>Cast</h3>
                        <div style={{display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 20}}>
                            {showInfo.credits.cast.slice(0, 10).map((actor: any) => (
                                <div key={actor.id} style={{minWidth: 100, textAlign: 'center'}}>
                                    {actor.profile_path ? (
                                        <Image 
                                            src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`} 
                                            alt={actor.name} 
                                            width={100} 
                                            height={150} 
                                            style={{borderRadius: 12, objectFit: 'cover', marginBottom: 8}} 
                                        />
                                    ) : (
                                        <div style={{width: 100, height: 150, background: '#333', borderRadius: 12, marginBottom: 8}} />
                                    )}
                                    <p style={{fontSize: '0.9rem', fontWeight: 500}}>{actor.name}</p>
                                    <p style={{fontSize: '0.8rem', color: '#888'}}>{actor.character}</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className={styles.historyOverlay}>
            <div className={styles.historyHeader}>
                <h2 className={styles.historyTitle}>Session Likes</h2>
                <button onClick={() => setShowHistory(false)} className={styles.closeBtn}><X size={32}/></button>
            </div>
            <div className={styles.historyGrid}>
                {history.map((m: any) => (
                    <div key={m.tmdbId} className={styles.historyItem}>
                         {m.posterPath && (
                            <Image 
                                src={`https://image.tmdb.org/t/p/w342${m.posterPath}`} 
                                alt={m.title} 
                                fill 
                                className={styles.historyPoster}
                            />
                        )}
                        <div className={styles.historyTitleOverlay}>{m.title}</div>
                    </div>
                ))}
                 {history.length === 0 && <p style={{color: '#999', gridColumn: '1/-1', textAlign: 'center'}}>No likes yet!</p>}
            </div>
        </div>
      )}

      {/* Matches Modal */}
      {showMatches && (
        <div className={styles.historyOverlay}>
            <div className={styles.historyHeader}>
                <h2 className={styles.historyTitle}>Matches Found! 🎉</h2>
                <button onClick={() => setShowMatches(false)} className={styles.closeBtn}><X size={32}/></button>
            </div>
            <div className={styles.historyGrid}>
                {matches.map((m: any) => (
                    <div key={m.tmdbId} className={styles.historyItem} style={{borderColor: '#4ade80', borderWidth: 2, borderStyle: 'solid'}}>
                         {m.posterPath && (
                            <Image 
                                src={`https://image.tmdb.org/t/p/w342${m.posterPath}`} 
                                alt={m.title} 
                                fill 
                                className={styles.historyPoster}
                            />
                        )}
                        <div className={styles.historyTitleOverlay} style={{background: 'rgba(74, 222, 128, 0.8)'}}>{m.title}</div>
                    </div>
                ))}
                 {matches.length === 0 && <p style={{color: '#999', gridColumn: '1/-1', textAlign: 'center'}}>No matches yet.</p>}
                 
                {matches.length > 0 && (
                    <div style={{gridColumn: '1/-1', textAlign: 'center', marginTop: 20}}>
                        <button 
                            className={styles.textBtn} 
                            style={{background: '#4ade80', color: 'black', margin: '0 auto'}}
                            onClick={onFinish}
                        >
                            Finish Game & View Results
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}

    </div>
  );
}
