"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { User, LogOut, Film, Bookmark } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { Button3D } from "../../ui/Button3D/Button3D";
import { Avatar } from "@/components/ui/Avatar/Avatar";
import styles from "./UserMenu.module.css";

export function UserMenu() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const profile = useQuery(api.profiles.getMyProfile);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return <div className={styles.skeleton} />;
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.authButtons}>
        <Button3D
          variant="primary"
          onClick={() => router.push("/login")}
        >
          Sign In
        </Button3D>
      </div>
    );
  }

  return (
    <div className={styles.container} ref={menuRef}>
      <Avatar 
        src={profile?.avatarUrl} 
        fallback={profile?.displayName || "User"} 
        size="md"
        onClick={() => setIsOpen(!isOpen)}
        className={styles.avatarTrigger}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className={styles.dropdown}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
             <div className={styles.userInfo}>
               <p className={styles.userName}>{profile?.displayName || "User"}</p>
               <p className={styles.userEmail}>{profile?.email}</p>
             </div>
             
             <div className={styles.divider} />

             <Link href="/profile" className={styles.dropdownItem} onClick={() => setIsOpen(false)}>
              <User size={16} />
              <span>My Profile</span>
            </Link>
            <Link href="/watchlist" className={styles.dropdownItem} onClick={() => setIsOpen(false)}>
              <Bookmark size={16} />
              <span>Watchlist</span>
            </Link>
            
            <div className={styles.divider} />
            
            <button
              className={`${styles.dropdownItem} ${styles.signOut}`}
              onClick={() => {
                signOut();
                setIsOpen(false);
              }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
