"use client";

import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import styles from "./CanimaSyncLobby.module.css";
import { motion } from "framer-motion";
import { Users, Smartphone, Film, Zap, Copy, Check, ArrowRight } from "lucide-react";
import { Button3D } from "../ui/Button3D/Button3D";
import { Input } from "../ui/Input/Input";
import { Label } from "../ui/Label/Label";
import { SegmentedControl } from "../ui/SegmentedControl/SegmentedControl";
import { SelectionChip } from "../ui/SelectionChip/SelectionChip";

interface CanimaSyncLobbyProps {
  onJoin: (roomId: string, userId: string, isHost: boolean) => void;
}

export function CanimaSyncLobby({ onJoin }: CanimaSyncLobbyProps) {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [userName, setUserName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);

  const createRoom = useMutation(api.canimasync.createRoom);
  const joinRoom = useMutation(api.canimasync.joinRoom);

  const PROVIDERS = [
    { id: "8", name: "Netflix" },
    { id: "119", name: "Prime Video" },
    { id: "122", name: "Hotstar" },
    { id: "220", name: "JioCinema" },
    { id: "237", name: "SonyLIV" },
    { id: "232", name: "Zee5" },
  ];

  const POPULAR_MOVIE_GENRES = [
    { id: 28, name: "Action" },
    { id: 12, name: "Adventure" },
    { id: 35, name: "Comedy" },
    { id: 18, name: "Drama" },
    { id: 878, name: "Sci-Fi" },
    { id: 27, name: "Horror" },
    { id: 53, name: "Thriller" },
    { id: 10749, name: "Romance" },
  ];

  const POPULAR_TV_GENRES = [
    { id: 10759, name: "Action & Adventure" },
    { id: 35, name: "Comedy" },
    { id: 18, name: "Drama" },
    { id: 10765, name: "Sci-Fi & Fantasy" },
    { id: 9648, name: "Mystery" },
    { id: 10764, name: "Reality" },
    { id: 16, name: "Animation" },
    { id: 99, name: "Documentary" },
  ];

  const currentGenres = mediaType === "movie" ? POPULAR_MOVIE_GENRES : POPULAR_TV_GENRES;

  const handleCreate = async () => {
    if (!userName || selectedGenres.length === 0) return;
    setIsSubmitting(true);
    try {
      const { roomId, userId } = await createRoom({
        hostName: userName,
        genres: selectedGenres,
        providers: selectedProviders,
        mediaType
      });
      onJoin(roomId, userId, true);
    } catch (err) {
      console.error(err);
      alert("Failed to create room");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async () => {
    if (!userName || !roomCode) return;
    setIsSubmitting(true);
    try {
      const { userId } = await joinRoom({
        roomId: roomCode.toUpperCase(),
        userName
      });
      onJoin(roomCode.toUpperCase(), userId, false);
    } catch (err) {
      console.error(err);
      alert("Failed to join room. Check the code!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleGenre = (id: number) => {
    if (selectedGenres.includes(id)) {
      setSelectedGenres(selectedGenres.filter(g => g !== id));
    } else {
      setSelectedGenres([...selectedGenres, id]);
    }
  };

  const toggleProvider = (id: string) => {
    if (selectedProviders.includes(id)) {
      setSelectedProviders(selectedProviders.filter(p => p !== id));
    } else {
      setSelectedProviders([...selectedProviders, id]);
    }
  };

  return (
    <div className={styles.container}>
      {/* Visual Hook (Left Panel) */}
      <div className={styles.leftPanel}>
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
        
        <div className={styles.leftContent}>
            <div className={styles.logo}>
                <Zap fill="currentColor" /> CanimaSync
            </div>
            <h1 className={styles.heroTitle}>
                Swipe.<br/>Match.<br/>Watch.
            </h1>
            <p className={styles.heroSubtitle}>
                Stop arguing over what to watch. Find the perfect movie or show in seconds.
            </p>

            <div className={styles.steps}>
                <div className={styles.step}>
                    <div className={styles.stepNumber}>1</div>
                    <div className={styles.stepContent}>
                        <h3>Create a Room</h3>
                        <p>Choose your genres and streaming services.</p>
                    </div>
                </div>
                <div className={styles.step}>
                    <div className={styles.stepNumber}>2</div>
                    <div className={styles.stepContent}>
                        <h3>Invite Friends</h3>
                        <p>Share the 4-digit code. Works on any device.</p>
                    </div>
                </div>
                <div className={styles.step}>
                    <div className={styles.stepNumber}>3</div>
                    <div className={styles.stepContent}>
                        <h3>Swipe to Match</h3>
                        <p>We show you trailers. You vote Pass or Keep.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Action Form (Right Panel) */}
      <div className={styles.rightPanel}>
        <motion.div 
            className={styles.formCard}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
        >
             {/* Mode Switch (Reusable Segmented Control) */}
             <div style={{ marginBottom: 24 }}>
                <SegmentedControl 
                    options={[
                        {  value: "create", label: "New Game" },
                        {  value: "join", label: "Join Game" }
                    ]}
                    value={mode}
                    onChange={(v) => setMode(v as any)}
                />
             </div>

            <motion.div 
                key={mode}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
            >
                <div className={styles.field}>
                    <Label>Your Name</Label>
                    <Input 
                        placeholder="e.g. Alex"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                    />
                </div>

                {mode === "create" ? (
                <>
                    <div style={{ marginBottom: 24 }}>
                        <SegmentedControl 
                             options={[
                                { value: "movie", label: <><Film size={16} /> Movies</> },
                                { value: "tv", label: <><Smartphone size={16} /> TV Shows</> }
                             ]}
                             value={mediaType}
                             onChange={(v) => { setMediaType(v as any); setSelectedGenres([]); }}
                        />
                    </div>

                    <div className={styles.field}>
                        <Label>Where do you watch?</Label>
                        <div className={styles.pillsGrid}>
                            {PROVIDERS.map(p => (
                                <SelectionChip
                                    key={p.id}
                                    label={p.name}
                                    selected={selectedProviders.includes(p.id)}
                                    onClick={() => toggleProvider(p.id)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className={styles.field}>
                        <Label>Genres</Label>
                        <div className={styles.pillsGrid}>
                            {currentGenres.map(g => (
                                <SelectionChip
                                    key={g.id}
                                    label={g.name}
                                    selected={selectedGenres.includes(g.id)}
                                    onClick={() => toggleGenre(g.id)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className={styles.submitBtnWrapper}>
                      <Button3D 
                        variant="primary"
                        onClick={handleCreate}
                        disabled={!userName || selectedGenres.length === 0 || isSubmitting}
                        icon={<ArrowRight size={16} />}
                        className={styles.submitBtn}
                      >
                        {isSubmitting ? "Creating..." : "Start Matching"}
                      </Button3D>
                    </div>
                </>
                ) : (
                <>
                    <div className={styles.field}>
                        <Label>Room Code</Label>
                        <Input 
                            placeholder="ABCD"
                            maxLength={4}
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            className={styles.codeInput} // Keep style override for monospace
                        />
                    </div>
                    
                    <div className={styles.submitBtnWrapper}>
                      <Button3D 
                        variant="secondary"
                        onClick={handleJoin}
                        disabled={!userName || roomCode.length !== 4 || isSubmitting}
                        icon={<ArrowRight size={16} />}
                        className="w-full"
                      >
                        {isSubmitting ? "Joining..." : "Enter Room"}
                      </Button3D>
                    </div>
                </>
                )}
            </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
