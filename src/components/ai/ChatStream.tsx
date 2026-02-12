"use client";

import styles from "./ChatStream.module.css";
import { AIMovieGrid, EnrichedMovie } from "./AIMovieCard";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  movies?: EnrichedMovie[];
  isStreaming?: boolean;
}

interface ChatStreamProps {
  messages: Message[];
}

export function ChatStream({ messages }: ChatStreamProps) {
  // Simple markdown-like parsing for bold text
  const parseContent = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part.split('\n').map((line, j, arr) => (
        <span key={`${i}-${j}`}>
          {line}
          {j < arr.length - 1 && <br />}
        </span>
      ));
    });
  };

  return (
    <div className={styles.streamContainer}>
      {messages.map((msg) => (
        <div key={msg.id} className={`${styles.messageRow} ${styles[msg.role]}`}>
          <div className={`${styles.avatar} ${styles[msg.role]}`}>
            {msg.role === "user" ? "U" : "✨"}
          </div>
          
          <div className={styles.messageContent}>
            {parseContent(msg.content)}
            
            {/* Render movie cards if present */}
            {msg.movies && msg.movies.length > 0 && (
              <AIMovieGrid movies={msg.movies} />
            )}
            
            {msg.isStreaming && <span className={styles.cursor} />}
          </div>
        </div>
      ))}
    </div>
  );
}
