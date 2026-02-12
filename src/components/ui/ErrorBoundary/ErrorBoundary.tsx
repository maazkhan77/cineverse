"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global Error Boundary
 * Catches React render errors and shows a recovery UI
 * instead of crashing the entire application.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "50vh",
            padding: "2rem",
            textAlign: "center",
            color: "var(--color-text, #fff)",
          }}
        >
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              marginBottom: "0.75rem",
              fontFamily: "var(--font-display, sans-serif)",
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              color: "var(--color-text-secondary, #b3b3b3)",
              marginBottom: "1.5rem",
              maxWidth: "400px",
              lineHeight: 1.6,
            }}
          >
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: "0.625rem 1.5rem",
              background: "var(--color-accent, #e50914)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-md, 6px)",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "opacity 150ms ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
