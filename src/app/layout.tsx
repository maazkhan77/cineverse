import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { AmbientBackground } from "@/components/ui/AmbientBackground/AmbientBackground";
import { Navbar } from "@/components/ui/Navbar/Navbar";
import { ScrollToTop } from "@/components/ui/ScrollToTop/ScrollToTop";
import { FloatingDock } from "@/components/ui/FloatingDock/FloatingDock";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary/ErrorBoundary";
import { FingerprintProvider } from "@/providers/FingerprintProvider";

// Primary body font - Inter with full weight range
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Display font for headings - Outfit is modern & cinematic
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CineVerse - Discover Movies & TV Shows",
  description: "AI-powered movie and TV show discovery platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} antialiased`}>
        <FingerprintProvider>
          <QueryProvider>
            <ConvexClientProvider>
              <ThemeProvider>
                <ScrollToTop />
                <Navbar />
                <AmbientBackground />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <ErrorBoundary>
                    {children}
                  </ErrorBoundary>
                </div>
                <FloatingDock />
                <Toaster 
                  position="bottom-right" 
                  richColors 
                  closeButton 
                  theme="dark"
                />
              </ThemeProvider>
            </ConvexClientProvider>
          </QueryProvider>
        </FingerprintProvider>
      </body>
    </html>
  );
}
