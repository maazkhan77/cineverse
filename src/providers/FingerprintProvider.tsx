"use client";
    
// Custom wrapper to handle ad-blocker errors gracefully
import { FingerprintProvider as BaseFingerprintProvider } from "@fingerprint/react";
import React, { Component, ErrorInfo, ReactNode } from "react";

interface FingerprintErrorBoundaryProps {
  children: ReactNode;
}

interface FingerprintErrorBoundaryState {
  hasError: boolean;
}

class FingerprintErrorBoundary extends Component<FingerprintErrorBoundaryProps, FingerprintErrorBoundaryState> {
  constructor(props: FingerprintErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): FingerprintErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Only log if it's NOT the expected ad-blocker error to avoid noise
    if (!error.message?.includes("Failed to load") && error.name !== "FingerprintError") {
      console.error("Fingerprint SDK Error:", error, errorInfo);
    } else {
      console.warn("Fingerprint SDK blocked by client (likely ad-blocker). Feature disabled.");
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.children; // Fail gracefully by just rendering children without provider
    }
    return this.props.children;
  }
}

interface FingerprintProviderProps {
  children: React.ReactNode;
}

export function FingerprintProvider({ children }: FingerprintProviderProps) {
  return (
    <FingerprintErrorBoundary>
      <BaseFingerprintProvider
        apiKey="XCktW0OF20ug24fPiNJT"
        region="ap"
      >
        {children}
      </BaseFingerprintProvider>
    </FingerprintErrorBoundary>
  );
}
