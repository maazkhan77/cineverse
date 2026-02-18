import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { AmbientBackground } from "@/components/ui/AmbientBackground/AmbientBackground";
import { Navbar } from "@/components/ui/Navbar/Navbar";
import { ScrollToTop } from "@/components/ui/ScrollToTop/ScrollToTop";
import { Footer } from "@/components/ui/Footer/Footer";
import { FloatingDock } from "@/components/ui/FloatingDock/FloatingDock";
import { RegionSelector } from "@/components/ui/RegionSelector/RegionSelector";
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
  title: {
    default: "Cineverse - Discover Your Next Favorite Movie or TV Show",
    template: "%s | Cineverse",
  },
  description: "Your ultimate destination for discovering movies and TV series. Explore trending titles, watch trailers, and find hidden gems with AI-powered recommendations.",
  keywords: ["movies", "tv shows", "streaming", "recommendations", "cinema", "entertainment", "trailers", "reviews", "tmdb", "film"],
  authors: [{ name: "Cineverse Team" }],
  creator: "Cineverse",
  publisher: "Cineverse",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://cineverse.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Cineverse - Cinematic Discovery Reimagined",
    description: "Experience movies and TV shows like never before. AI-powered search, stunning visuals, and a community of film lovers.",
    url: "https://cineverse.app",
    siteName: "Cineverse",
    images: [
      {
        url: "/icon.png",
        width: 1024,
        height: 1024,
        alt: "Cineverse Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cineverse - Discover Movies & TV Shows",
    description: "Your next favorite story is waiting. Search, discover, and track movies and TV shows with Cineverse.",
    images: ["/icon.png"],
    creator: "@cineverse",
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
                <Footer />
                <RegionSelector />
                <FloatingDock />
                <Toaster 
                  position="bottom-right" 
                  richColors 
                  closeButton 
                />
              </ThemeProvider>
            </ConvexClientProvider>
          </QueryProvider>
        </FingerprintProvider>
      </body>
    </html>
  );
}
