"use client";

import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Sparkles, RotateCcw, Send, Film, Compass } from "lucide-react";
import { ChatStream, Message } from "@/components/ai/ChatStream";
import { EnrichedMovie } from "@/components/ai/AIMovieCard";
import styles from "./page.module.css";

const SUGGESTIONS = [
  "Movies like Interstellar with mind-bending visuals",
  "Dark psychological thrillers with shocking twists",
  "Cozy feel-good 90s cinema with nostalgic vibes",
  "Underrated hidden gems with great cinematography",
  "Masterpiece cinema with incredible original scores",
  "High-tension detective murder mysteries",
];

export default function AISearchPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  // AI Recommendation Action
  const recommendMovies = useAction(api.ai.recommendMovies);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [inputValue]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (hasStarted) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, hasStarted]);

  const handleReset = () => {
    setMessages([]);
    setHasStarted(false);
    setInputValue("");
    setIsLoading(false);
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setHasStarted(true);
    setInputValue("");

    const userMsg: Message = {
      id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
        role: "assistant",
        content: hasResults 
          ? `Here are curated cinema matches based on **"${text}"**:` 
          : "I couldn't find exact matches for that description. Try describing the mood, visual tone, or a favorite movie you'd like something similar to!",
        movies: hasResults ? recommendations : undefined,
      };
      
      setIsLoading(false);
      setMessages((prev) => [...prev, aiMsg]);

    } catch (err) {
      console.error(err);
      setIsLoading(false);
      
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "We encountered an issue connecting to the AI Oracle. Please try again shortly.",
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
      {/* Ambient Background Glow */}
      <div className={styles.ambientBg} />
      
      {/* Top Sub-Header Bar (Respects 75px Navbar Height) */}
      <div className={styles.subHeader}>
        <button 
          onClick={() => window.history.back()} 
          className={styles.navActionBtn}
          aria-label="Go Back"
        >
          <ArrowLeft size={15} />
          <span>Back</span>
        </button>

        <div className={styles.oracleBadge}>
          <Sparkles size={13} className={styles.sparkleIcon} />
          <span>Canima Oracle AI</span>
        </div>

        {hasStarted ? (
          <button 
            onClick={handleReset} 
            className={styles.resetChatBtn}
            aria-label="New Session"
          >
            <RotateCcw size={13} />
            <span>New Search</span>
          </button>
        ) : (
          <div style={{ width: 80 }} />
        )}
      </div>

      {/* Main Viewport Content Area */}
      {!hasStarted ? (
        /* Hero View (Centered in available height) */
        <div className={styles.heroView}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <Compass size={14} />
              <span>AI Cinematic Intelligence</span>
            </div>

            <h1 className={styles.heroTitle}>The Oracle</h1>
            <p className={styles.heroSubtitle}>
              Describe any mood, aesthetic, plot twist, or vibe to discover your next favorite movie.
            </p>
            
            {/* Input Box in Hero */}
            <div className={styles.heroInputWrapper}>
              <div className={styles.inputRow}>
                <textarea
                  ref={textareaRef}
                  className={styles.textarea}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything... e.g. 'Nostalgic 80s sci-fi with synth soundtrack'"
                  rows={1}
                />
                <button 
                  className={styles.submitBtn}
                  onClick={() => handleSend(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                  aria-label="Send query"
                >
                  <Send size={15} />
                </button>
              </div>

              <div className={styles.inputFooter}>
                <span className={styles.keyboardHint}>
                  Press <kbd className={styles.kbd}>↵ Enter</kbd> to search • <kbd className={styles.kbd}>Shift + ↵</kbd> for new line
                </span>
              </div>
            </div>

            {/* Curated Suggestion Chips */}
            <div className={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <button 
                  key={s} 
                  className={styles.suggestionChip}
                  onClick={() => handleSend(s)}
                >
                  <Film size={12} className={styles.chipIcon} />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Chat View (Scrollable container + Pinned bottom input) */
        <div className={styles.chatView}>
          <div className={styles.chatScrollArea} ref={chatScrollRef}>
            <div className={styles.chatInner}>
              <ChatStream messages={messages} />
              
              {isLoading && (
                <div className={styles.thinkingWrapper}>
                  <div className={styles.thinkingBox}>
                    <div className={styles.thinkingIcon}>
                      <Sparkles size={16} />
                    </div>
                    <div className={styles.thinkingTextCol}>
                      <span className={styles.thinkingTitle}>Consulting The Oracle</span>
                      <span className={styles.thinkingSubtitle}>Analyzing themes, cinematography, and reviews...</span>
                    </div>
                    <div className={styles.thinkingWave}>
                      <span className={styles.waveBar} />
                      <span className={styles.waveBar} />
                      <span className={styles.waveBar} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Pinned Bottom Input Bar */}
          <div className={styles.bottomBar}>
            <div className={styles.bottomInputWrapper}>
              <div className={styles.inputRow}>
                <textarea
                  ref={textareaRef}
                  className={styles.textarea}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a follow-up or explore another cinema theme..."
                  rows={1}
                />
                <button 
                  className={styles.submitBtn}
                  onClick={() => handleSend(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                  aria-label="Send query"
                >
                  <Send size={15} />
                </button>
              </div>

              <div className={styles.inputFooter}>
                <span className={styles.keyboardHint}>
                  Press <kbd className={styles.kbd}>↵ Enter</kbd> to send • <kbd className={styles.kbd}>Shift + ↵</kbd> for new line
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
