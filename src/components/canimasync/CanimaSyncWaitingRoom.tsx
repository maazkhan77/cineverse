import { motion } from "framer-motion";
import { Button3D } from "@/components/ui/Button3D/Button3D";
import { LogOut } from "lucide-react";
import styles from "./CanimaSyncWaitingRoom.module.css";
import { toast } from "sonner";

interface Participant {
  userId: string;
  name: string;
  isHost: boolean;
}

interface CanimaSyncWaitingRoomProps {
  roomId: string;
  participants: Participant[];
  isHost: boolean;
  onStart: () => void;
  onExit?: () => void;
}

export function CanimaSyncWaitingRoom({ roomId, participants, isHost, onStart, onExit }: CanimaSyncWaitingRoomProps) {
  
  const copyCode = () => {
    navigator.clipboard.writeText(roomId);
    toast.success("Room code copied to clipboard!");
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.orb} ${styles.orb1}`} />
      <div className={`${styles.orb} ${styles.orb2}`} />

      <motion.div 
        className={styles.content}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className={styles.title}>CanimaSync Lobby</div>
        
        <motion.div 
          className={styles.codeContainer}
          onClick={copyCode}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className={styles.codeLabel}>ROOM CODE</span>
          <div className={styles.roomCode}>{roomId}</div>
          <div className={styles.copyHint}>Click to Copy</div>
        </motion.div>

        <div className={styles.participantsSection}>
          <div className={styles.participantsHeader}>
            <span className={styles.participantsTitle}>Crew Members</span>
            <span className={styles.participantsCount}>{participants.length} Ready</span>
          </div>

          <div className={styles.participantsGrid}>
            {participants.map((p) => (
              <motion.div 
                key={p.userId} 
                className={`${styles.participantCard} ${p.isHost ? styles.isHost : ''}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                layout
              >
                <div className={styles.avatar}>
                  {p.isHost ? "👑" : "🎬"}
                </div>
                <div className={styles.participantName}>
                  {p.name}
                </div>
                {p.isHost && <div className={styles.hostBadge}>Host</div>}
              </motion.div>
            ))}
          </div>
        </div>

        <div className={styles.controls}>
          {isHost ? (
            <Button3D 
              onClick={onStart}
              disabled={participants.length < 1}
              style={{ minWidth: 200 }}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              }
            >
              Start Session
            </Button3D>
          ) : (
            <div className={styles.waitingMessage}>
              <div className={styles.spinner} />
              <span>Waiting for host to start...</span>
            </div>
          )}
          {onExit && (
            <button 
              onClick={onExit}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
                color: '#ff6b6b', cursor: 'pointer', fontSize: '0.9rem',
                fontWeight: 500, marginTop: 12, transition: 'all 0.2s'
              }}
            >
              <LogOut size={16} />
              Leave Room
            </button>
          )}
        </div>

      </motion.div>
    </div>
  );
}
