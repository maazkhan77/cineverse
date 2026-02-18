import { create } from "zustand";

const REGION_STORAGE_KEY = "canima-regions";

function getInitialRegions(): string[] {
  if (typeof window === "undefined") return ["IN"];
  try {
    const stored = localStorage.getItem(REGION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return ["IN"];
}

interface UIState {
  // Modal states
  isFilterDrawerOpen: boolean;
  setFilterDrawerOpen: (open: boolean) => void;

  // Global loading indicator (for page transitions, etc.)
  isGlobalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;

  // Command Palette
  isCommandPaletteOpen: boolean;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;

  // Site-wide Region Configuration
  selectedRegions: string[];
  setSelectedRegions: (regions: string[]) => void;
  toggleRegion: (regionCode: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Filter Drawer
  isFilterDrawerOpen: false,
  setFilterDrawerOpen: (open) => set({ isFilterDrawerOpen: open }),

  // Global Loading
  isGlobalLoading: false,
  setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),

  // Command Palette
  isCommandPaletteOpen: false,
  toggleCommandPalette: () =>
    set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),

  // Regions
  selectedRegions: getInitialRegions(),
  setSelectedRegions: (regions) => {
    localStorage.setItem(REGION_STORAGE_KEY, JSON.stringify(regions));
    set({ selectedRegions: regions });
  },
  toggleRegion: (regionCode) =>
    set((state) => {
      const current = state.selectedRegions;
      let next: string[];
      if (current.includes(regionCode)) {
        next = current.filter((r) => r !== regionCode);
        if (next.length === 0) next = [regionCode]; // Keep at least one
      } else {
        next = [...current, regionCode];
      }
      localStorage.setItem(REGION_STORAGE_KEY, JSON.stringify(next));
      return { selectedRegions: next };
    }),
}));
