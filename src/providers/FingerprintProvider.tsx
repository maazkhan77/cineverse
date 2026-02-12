"use client";

import { FingerprintProvider as BaseFingerprintProvider } from "@fingerprint/react";

interface FingerprintProviderProps {
  children: React.ReactNode;
}

export function FingerprintProvider({ children }: FingerprintProviderProps) {
  return (
    <BaseFingerprintProvider
      apiKey="XCktW0OF20ug24fPiNJT"
      region="ap"
    >
      {children}
    </BaseFingerprintProvider>
  );
}
