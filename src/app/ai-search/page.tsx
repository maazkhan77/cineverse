"use client";

import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { ChatStream, Message } from "@/components/ai/ChatStream";
import { EnrichedMovie } from "@/components/ai/AIMovieCard";
import styles from "./page.module.css";

const SUGGESTIONS = [
  "Movies like Interstellar but happier",
  "Dark psychological thrillers",
  "Feel-good 90s comedies",
  "Hidden gems on Netflix",
  "Oscar-winning performances",
  "Mind-bending sci-fi",
];

export default function AISearchPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // AI Recommendation Action
  const recommendMovies = useAction(api.ai.recommendMovies);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [inputValue]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setHasStarted(true);
    setInputValue("");

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await recommendMovies({ query: text });
      const recommendations: EnrichedMovie[] = response?.recommendations || [];
      
      // Create response with embedded movie cards
      const hasResults = recommendations.length > 0;
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: hasResults 
          ? `Here's what I found for "${text}":` 
          : "I couldn't find specific matches. Try describing the mood, a similar movie, or a genre you're into!",
        movies: hasResults ? recommendations : undefined,
      };
      
      setIsLoading(false);
      setMessages((prev) => [...prev, aiMsg]);

    } catch (err) {
      console.error(err);
      setIsLoading(false);
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Oops! Something went wrong. Make sure the AI is configured and try again.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  return (
    <main className={styles.main}>
      {/* Ambient Background */}
      <div className={styles.ambientBg} />
      
      {/* Chat History */}
      <div className={`${styles.chatArea} ${!hasStarted ? styles.hidden : ''}`}>
        <ChatStream messages={messages} />
        
        {isLoading && (
          <div className={styles.thinkingWrapper}>
            <div className={styles.thinkingDots}>
              <span className={styles.thinkingDot} />
              <span className={styles.thinkingDot} />
              <span className={styles.thinkingDot} />
              <span className={styles.thinkingText}>Thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      {/* Input Section */}
      <div className={`${styles.inputContainer} ${hasStarted ? styles.chat : styles.hero}`}>
        <div className={styles.inputInner}>
          
          {/* Hero Title */}
          <div className={styles.titleWrapper}>
            {/* Back Button */}
            <button 
              onClick={() => window.history.back()} 
              className={styles.backButton}
              aria-label="Go Back"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back
            </button>

            <h1 className={styles.heroTitle}>The Oracle</h1>
            <p className={styles.heroSubtitle}>
              Your personal AI movie advisor. Ask anything.
            </p>
            
            {/* Suggestion Chips */}
            <div className={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <button 
                  key={s} 
                  className={styles.suggestionChip}
                  onClick={() => handleSend(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className={styles.inputWrapper}>
            <div className={styles.inputRow}>
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you're in the mood for..."
                rows={1}
              />
              <button 
                className={styles.submitBtn}
                onClick={() => handleSend(inputValue)}
                disabled={!inputValue.trim() || isLoading}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
