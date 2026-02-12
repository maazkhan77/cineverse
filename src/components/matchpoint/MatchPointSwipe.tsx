"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./MatchPointSwipe.module.css";
import Image from "next/image";
import { X, Heart, Info, Play, History, Volume2, VolumeX, MonitorPlay } from "lucide-react";
import dynamic from "next/dynamic";
import { CurtainTransition } from "./CurtainTransition";

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

interface MatchPointSwipeProps {
  movies: Card[];
  onVote: (movieId: number, vote: "like" | "dislike", details: any) => void;
  history?: any[];
  matches?: any[];
  onFinish?: () => void;
}

export function MatchPointSwipe({ movies, onVote, history = [], matches = [], onFinish }: MatchPointSwipeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCurtain, setShowCurtain] = useState(false);
  const [muted, setMuted] = useState(true);
  
  // Modals
  const [showInfo, setShowInfo] = useState<Card | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showMatches, setShowMatches] = useState(false);

  const currentMovie = movies[currentIndex];
  const nextMovie = movies[currentIndex + 1]; // Preload hint?

  // Find trailer
  const trailerKey = currentMovie?.videos?.find(
    (v: any) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
  )?.key;

  const handleVote = (vote: "like" | "dislike") => {
    // 1. Trigger Curtain Close
    setShowCurtain(true);

    // 2. Wait for curtain to cover (approx 600ms)
    setTimeout(() => {
        // 3. Commit Vote & Change Movie
        onVote(currentMovie.tmdbId, vote, currentMovie);
        setCurrentIndex(prev => prev + 1);
        
        // 4. Reset Mute for next video? Or keep user preference.
        // setMuted(true); 

        // 5. Open Curtain
        setTimeout(() => {
            setShowCurtain(false);
        }, 400); // Short delay before opening
    }, 800);
  };

  const toggleMute = () => setMuted(!muted);

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

      {/* Video Stage */}
      <div className={styles.videoStage}>
        {trailerKey ? (
            <div className={styles.videoWrapper}>
                <ReactPlayer
                    url={`https://www.youtube.com/watch?v=${trailerKey}`}
                    width="100%"
                    height="100%"
                    playing={!showCurtain && !showInfo && !showHistory && !showMatches} // Pause when curtain/modal open
                    muted={muted}
                    loop={true}
                    controls={false}
                    config={{
                        youtube: {
                            playerVars: { showinfo: 0, controls: 0, modestbranding: 1, rel: 0 }
                        }
                    }}
                    style={{pointerEvents: 'none'}} // Prevent interaction with YT embedded
                />
            </div>
        ) : (
            // Fallback to Poster
             <div className={styles.videoWrapper}>
                {currentMovie.posterPath && (
                    <Image
                        src={`https://image.tmdb.org/t/p/original${currentMovie.posterPath}`}
                        alt={currentMovie.title}
                        fill
                        style={{objectFit: 'cover'}}
                    />
                )}
             </div>
        )}
      </div>

      {/* Overlays */}
      <div className={styles.overlayGradient} />
      <div className={styles.topOverlay} />

      {/* Top Actions */}
      <div className={styles.topActions}>
        <button className={styles.iconBtn} onClick={toggleMute}>
            {muted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
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

      {/* Control Deck */}
      <div className={styles.controlDeck}>
        <div className={styles.movieInfo}>
            <h1 className={styles.title}>{currentMovie.title}</h1>
            <div className={styles.meta}>
                <div className={styles.rating}>⭐ {currentMovie.voteAverage?.toFixed(1)}</div>
                <div className={styles.badge}>{currentMovie.releaseDate?.split('-')[0]}</div>
                {currentMovie.mediaType === 'tv' && <div className={styles.badge}>TV Series</div>}
                
                {/* Provider Icons */}
                {currentMovie.providers && currentMovie.providers.length > 0 && (
                    <div className={styles.providers}>
                        {currentMovie.providers.slice(0, 4).map((provider: any) => (
                            <div key={provider.provider_id} className={styles.providerIcon} title={provider.provider_name}>
                                {provider.logo_path ? (
                                    <Image 
                                        src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                                        alt={provider.provider_name}
                                        width={28}
                                        height={28}
                                    />
                                ) : (
                                    <span>{provider.provider_name.charAt(0)}</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <p className={styles.overview}>{currentMovie.overview}</p>

            <div className={styles.actionBar}>
                <div className={styles.leftActions}>
                    <button className={styles.textBtn} onClick={() => setShowInfo(currentMovie)}>
                        <Info size={18} /> Details
                    </button>
                </div>

                <div className={styles.voteActions}>
                    <button className={`${styles.voteBtn} ${styles.passBtn}`} onClick={() => handleVote("dislike")}>
                        <X size={32} />
                    </button>
                    <button className={`${styles.voteBtn} ${styles.likeBtn}`} onClick={() => handleVote("like")}>
                        <Heart size={32} fill="currentColor" />
                    </button>
                </div>
            </div>
        </div>
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
