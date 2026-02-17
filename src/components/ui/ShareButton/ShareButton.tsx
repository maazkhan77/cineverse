"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import styles from "./ShareButton.module.css";

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  variant?: "icon" | "button";
}

export function ShareButton({ 
  title, 
  text, 
  url,
  variant = "button" 
}: ShareButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const shareText = text || `Check out "${title}" on Canima!`;

  const handleShare = async () => {
    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: shareText,
          url: shareUrl,
        });
        toast.success("Shared successfully!");
      } catch (err) {
        // User cancelled or share failed silently
        if ((err as Error).name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      // Desktop fallback - show dropdown
      setShowDropdown(!showDropdown);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
      setShowDropdown(false);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleShareTwitter = () => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(tweetUrl, "_blank", "noopener,noreferrer");
    setShowDropdown(false);
  };

  const handleShareFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(fbUrl, "_blank", "noopener,noreferrer");
    setShowDropdown(false);
  };

  const handleShareWhatsApp = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    setShowDropdown(false);
  };

  return (
    <div className={styles.wrapper}>
      <motion.button
        className={`${styles.shareButton} ${styles[variant]}`}
        onClick={handleShare}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Share"
      >
        <svg 
          className={styles.icon} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        {variant === "button" && <span>Share</span>}
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <>
            {/* Backdrop */}
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDropdown(false)}
            />
            
            {/* Dropdown Menu */}
            <motion.div
              className={styles.dropdown}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
            >
              <button className={styles.dropdownItem} onClick={handleCopyLink}>
                <span className={styles.itemIcon}>🔗</span>
                Copy Link
              </button>
              <button className={styles.dropdownItem} onClick={handleShareTwitter}>
                <span className={styles.itemIcon}>𝕏</span>
                Share on X
              </button>
              <button className={styles.dropdownItem} onClick={handleShareFacebook}>
                <span className={styles.itemIcon}>📘</span>
                Share on Facebook
              </button>
              <button className={styles.dropdownItem} onClick={handleShareWhatsApp}>
                <span className={styles.itemIcon}>💬</span>
                WhatsApp
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
