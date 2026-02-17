"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import styles from "./TrailerModal.module.css";
import { Button3D } from "@/components/ui/Button3D/Button3D";

interface TrailerModalProps {
  trailerKey: string;
  onClose: () => void;
}

export function TrailerModal({ trailerKey, onClose }: TrailerModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = "hidden";
        return () => { 
            setMounted(false);
            document.body.style.overflow = "unset" 
        };
    }, []);

    if (!mounted || typeof document === "undefined") return null;

    return createPortal(
        <div className={styles.trailerModal} onClick={onClose}>
          <div className={styles.closeContainer}>
             <Button3D 
                variant="secondary"
                onClick={onClose}
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                }
             >
                Close
             </Button3D>
          </div>
          
          <div className={styles.trailerContent} onClick={(e) => e.stopPropagation()}>
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              className={styles.trailerIframe}
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
            />
          </div>
        </div>,
        document.body
    );
}
