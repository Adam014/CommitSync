import { StateCreator } from "zustand";

export interface ThemeSlice {
  darkMode: boolean;
  isEmbed: boolean;
  mounted: boolean;
  setDarkMode: (value: boolean) => void;
  toggleDarkMode: () => void;
  setIsEmbed: (value: boolean) => void;
  setMounted: (value: boolean) => void;
  resetTheme: () => void;
}

export const createThemeSlice: StateCreator<ThemeSlice, [], [], ThemeSlice> = (
  set,
  get,
) => ({
  darkMode: false,
  isEmbed: false,
  mounted: false,
  setDarkMode: (value) => set({ darkMode: value }),
  toggleDarkMode: () => set({ darkMode: !get().darkMode }),
  setIsEmbed: (value) => set({ isEmbed: value }),
  setMounted: (value) => set({ mounted: value }),
  resetTheme: () =>
    set({
      darkMode: false,
      isEmbed: false,
      mounted: false,
    }),
});
