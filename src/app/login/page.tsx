"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button3D } from "@/components/ui/Button3D/Button3D";
import { Input } from "@/components/ui/Input/Input";
import { Label } from "@/components/ui/Label/Label";
import styles from "./page.module.css";

type AuthMode = "signIn" | "signUp";

// Password strength calculator
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  if (score <= 1) return { score: 1, label: "Weak", color: "#ff4444" };
  if (score <= 2) return { score: 2, label: "Fair", color: "#ffaa00" };
  if (score <= 3) return { score: 3, label: "Good", color: "#88cc00" };
  return { score: 4, label: "Strong", color: "#00cc66" };
}

// Wrapper component to handle Suspense for useSearchParams
export default function LoginPage() {
  return (
    <Suspense fallback={<div className={styles.loading}><div className={styles.spinner} /></div>}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [mode, setMode] = useState<AuthMode>("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordStrength = getPasswordStrength(password);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);
      formData.set("flow", mode);
      if (mode === "signUp" && name) {
        formData.set("name", name);
      }

      await signIn("password", formData);
      router.push(redirectTo);
    } catch (err) {
      console.error("Auth error:", err);
      setError(
        mode === "signIn"
          ? "Invalid email or password"
          : "Failed to create account. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = async (provider: "github") => {
    setIsSubmitting(true);
    setError(null);
    try {
      await signIn(provider);
    } catch (err) {
      console.error("OAuth error:", err);
      setError("Sign-in failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = () => {
    setEmail("guest@cineverse.com");
    setPassword("GuestUser123!");
    // Small delay to allow state update before auto-submission
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    }, 100);
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.page}>
      <div className={styles.backButtonWrapper}>
        <Button3D 
          variant="secondary"
          onClick={() => router.push("/")}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          }
        >
          Back to Home
        </Button3D>
      </div>

      {/* Left Panel - Hero Image */}
      <div className={styles.heroPanel}>
        <Image
          src="/login-hero.png"
          alt="Cinematic background"
          fill
          className={styles.heroImage}
          priority
        />
        <div className={styles.heroOverlay} />
        
        {/* Floating animated particles */}
        <div className={styles.particles}>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className={styles.particle}
              initial={{ opacity: 0, y: 100 }}
              animate={{ 
                opacity: [0.3, 0.6, 0.3], 
                y: [-20, -100, -20],
                x: [0, (i % 2 === 0 ? 30 : -30), 0]
              }}
              transition={{ 
                duration: 8 + i * 2, 
                repeat: Infinity, 
                delay: i * 0.8,
                ease: "easeInOut"
              }}
              style={{ left: `${15 + i * 15}%`, bottom: `${10 + i * 5}%` }}
            />
          ))}
        </div>
        
        <motion.div 
          className={styles.heroContent}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <h1 className={styles.heroTitle}>
            Your Personal<br />Cinema Awaits
          </h1>
          <p className={styles.heroSubtitle}>
            Discover movies, track your favorites, and never miss what to watch next.
          </p>
          <div className={styles.featureList}>
            {[
              "Create personalized watchlists",
              "Sync across all your devices",
              "Get tailored recommendations"
            ].map((feature, i) => (
              <motion.div 
                key={i}
                className={styles.feature}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.15 }}
              >
                <span className={styles.featureIcon}>✓</span>
                <span>{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Auth Form */}
      <motion.div 
        className={styles.authPanel}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >

        <motion.div 
          className={styles.authContainer}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >

          <motion.div 
            className={styles.logo}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            CINEVERSE
          </motion.div>
          
          <h2 className={styles.authTitle}>
            {mode === "signIn" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className={styles.authSubtitle}>
            {mode === "signIn"
              ? "Sign in to access your watchlist and personalized recommendations"
              : "Join millions of movie lovers and start your journey"
            }
          </p>

          {/* OAuth Buttons */}
          <motion.div 
            className={styles.oauthButtons}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
           <Button3D
              variant="secondary"
              onClick={() => handleOAuth("github")}
              disabled={isSubmitting}
              style={{ width: '100%' }}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              }
            >
              Continue with GitHub
            </Button3D>
          </motion.div>

          {/* Divider */}
          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>or</span>
            <span className={styles.dividerLine} />
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Name field - only show in signup mode */}
            <AnimatePresence mode="wait">
              {mode === "signUp" && (
                <motion.div 
                  className={styles.field}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Label htmlFor="name">
                    Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className={styles.field}>
              <Label htmlFor="email">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className={styles.field}>
              <Label htmlFor="password">
                Password
              </Label>
              <div className={styles.passwordWrapper}>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  required
                  style={{ paddingRight: 50 }}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Password strength indicator */}
              <AnimatePresence>
                {mode === "signUp" && password.length > 0 && (
                  <motion.div
                    className={styles.passwordStrength}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className={styles.strengthBar}>
                      {[1, 2, 3, 4].map((level) => (
                        <motion.div
                          key={level}
                          className={styles.strengthSegment}
                          initial={{ scaleX: 0 }}
                          animate={{ 
                            scaleX: passwordStrength.score >= level ? 1 : 0,
                            backgroundColor: passwordStrength.score >= level ? passwordStrength.color : "rgba(255,255,255,0.1)"
                          }}
                          transition={{ duration: 0.3, delay: level * 0.05 }}
                        />
                      ))}
                    </div>
                    <span 
                      className={styles.strengthLabel}
                      style={{ color: passwordStrength.color }}
                    >
                      {passwordStrength.label}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {error && (
              <motion.div 
                className={styles.error}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <Button3D
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
              icon={
                isSubmitting ? (
                  <div className={styles.spinner} style={{ width: 16, height: 16, borderTopColor: 'white', borderWidth: 2 }} />
                ) : null
              }
            >
              {isSubmitting
                ? "Please wait..."
                : mode === "signIn"
                ? "Sign In"
                : "Create Account"
              }
            </Button3D>

            {/* Guest Login Button (Styled as Secondary Button3D) */}
            {mode === "signIn" && (
               <div style={{ marginTop: '1rem' }}>
                  <Button3D
                    variant="secondary"
                    onClick={handleGuestLogin}
                    disabled={isSubmitting}
                    style={{ width: '100%' }}
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                         <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                         <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    }
                  >
                    Login as Guest
                  </Button3D>
               </div>
            )}
          </form>

          {/* Mode Switch */}
          <p className={styles.modeSwitch}>
            {mode === "signIn" ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              className={styles.modeSwitchButton}
              onClick={() => {
                setMode(mode === "signIn" ? "signUp" : "signIn");
                setError(null);
              }}
            >
              {mode === "signIn" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
