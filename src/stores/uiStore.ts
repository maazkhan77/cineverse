import { create } from "zustand";

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
}));
