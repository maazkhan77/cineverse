"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useAction, useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { motion } from "framer-motion";
import styles from "./page.module.css";
import Image from "next/image";
import { Input } from "@/components/ui/Input/Input";
import { Label } from "@/components/ui/Label/Label";
import { Textarea } from "@/components/ui/Textarea/Textarea";
import { Button3D } from "@/components/ui/Button3D/Button3D";
import { SelectionChip } from "@/components/ui/SelectionChip/SelectionChip";
import { Avatar } from "@/components/ui/Avatar/Avatar";
import { Edit2, Mail, Calendar, Film, Star } from "lucide-react";

interface Genre {
  id: number;
  name: string;
}

export default function ProfilePage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const router = useRouter();
  const profile = useQuery(api.profiles.getMyProfile);
  const ratingsCount = useQuery(api.ratings.getUserRatingsCount);
  const watchlistCount = useQuery(api.watchlist.getWatchlistCount);
  const updateProfile = useMutation(api.profiles.updateProfile);
  const generateUploadUrl = useMutation(api.profiles.generateUploadUrl);
  const updateAvatar = useMutation(api.profiles.updateAvatar);
  const getGenres = useAction(api.tmdb.getGenres);
  
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [country, setCountry] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [allGenres, setAllGenres] = useState<Genre[]>([]);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // Initialize form data
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setBio(profile.bio || "");
      setFavoriteGenres(profile.favoriteGenres || []);
      setCountry(profile.country || "");
    }
  }, [profile]);

  // Fetch genres
  useEffect(() => {
    async function fetchGenres() {
      try {
        const data = await getGenres({ mediaType: "movie" });
        setAllGenres((data as { genres: Genre[] }).genres);
      } catch (err) {
        console.error("Failed to fetch genres", err);
      }
    }
    fetchGenres();
  }, [getGenres]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) throw new Error("Upload failed");
      const { storageId } = await result.json();
      await updateAvatar({ storageId });
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      alert("Failed to upload avatar. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setIsEditing(true);
    try {
      await updateProfile({
        displayName,
        bio,
        favoriteGenres,
        country,
      });
      setIsEditing(false); // Exit edit mode on success
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile. Please try again.");
      setIsEditing(false);
    }
  };

  const toggleGenre = (genreName: string) => {
    if (favoriteGenres.includes(genreName)) {
      setFavoriteGenres(favoriteGenres.filter(g => g !== genreName));
    } else {
      if (favoriteGenres.length >= 5) {
        alert("You can select up to 5 favorite genres");
        return;
      }
      setFavoriteGenres([...favoriteGenres, genreName]);
    }
  };

  if (isAuthLoading || profile === undefined) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  // if (!profile) return null; // Removed to allow empty state rendering

  return (
    <main className={styles.main}>
      {/* Hero Banner */}
      <div className={styles.heroBanner}>
        <Image
          src="/login-hero.png" // Reusing the high-quality login hero
          alt="Profile Banner"
          fill
          className={styles.heroImage}
        />
        <div className={styles.heroOverlay} />
      </div>

      <div className={styles.container}>
        <motion.div 
          className={styles.profileCard}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header Section */}
          <div className={styles.header}>
            <div className={styles.avatarSection}>
              <div onClick={handleAvatarClick} style={{ position: 'relative', width: 'fit-content', cursor: 'pointer' }}>
                <Avatar 
                  src={profile?.avatarUrl} 
                  fallback={displayName || "User"} 
                  size="xl"
                  className={styles.profileAvatar}
                />
                <div className={styles.uploadOverlay}>
                  <Edit2 size={24} />
                  <span>Change</span>
                  {uploading && <span>...</span>}
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className={styles.uploadInput}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            <div className={styles.headerInfo}>
              <h1 className={styles.displayName}>
                {displayName || "Movie Fan"}
              </h1>
              <div className={styles.email}>
                <Mail size={14} />
                {profile?.email || "No Email"}
                <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
                <Calendar size={14} />
                Joined {new Date(profile?.createdAt || Date.now()).toLocaleDateString()}
              </div>

              <div className={styles.statsRow}>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{watchlistCount ?? 0}</span>
                  <span className={styles.statLabel}>Watchlist</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{ratingsCount ?? 0}</span>
                  <span className={styles.statLabel}>Ratings</span>
                </div>
              </div>
            </div>

            <div className={styles.controls}>
               <Button3D
                  variant={isEditing ? "secondary" : "primary"}
                  onClick={handleSubmit}
                  disabled={uploading}
                  icon={isEditing ? <Edit2 size={16} /> : undefined}
                >
                  {isEditing ? "Saving..." : "Save Changes"}
                </Button3D>
            </div>
          </div>

          {/* Form Content */}
          <div className={styles.formGrid}>
            
            {/* Left Col: Personal Info */}
            <div className={styles.fields}>
              <h2 className={styles.sectionTitle}>
                <UserIcon /> Personal Details
              </h2>
              
              <div className={styles.field}>
                <Label>Display Name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                />
              </div>

              <div className={styles.field}>
                <Label>Bio</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>

              <div className={styles.field}>
                <Label>Country</Label>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. United States"
                />
              </div>
            </div>

            {/* Right Col: Preferences */}
            <div>
              <h2 className={styles.sectionTitle}>
                <Star size={20} fill="currentColor" /> Favorites
              </h2>
              
              <div className={styles.genresSection}>
                <Label style={{ marginBottom: '1rem', display: 'block' }}>
                  Favorite Genres (Max 5)
                </Label>
                <div className={styles.genreGrid}>
                  {allGenres.map((genre) => (
                    <SelectionChip
                      key={genre.id}
                      label={genre.name}
                      selected={favoriteGenres.includes(genre.name)}
                      onClick={() => toggleGenre(genre.name)}
                    />
                  ))}
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </main>
  );
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );
}
