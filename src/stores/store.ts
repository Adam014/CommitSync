import { EmbedSlice, ThemeSlice } from './../types/types';
import { create } from "zustand";

type Store = ThemeSlice & EmbedSlice;

export const useStore = create<Store>((set, get) => ({
  darkMode: false,
  isEmbed: false,
  mounted: false,
  setDarkMode: (value) => set({ darkMode: value }),
  toggleDarkMode: () => set({ darkMode: !get().darkMode }),
  setIsEmbed: (value) => set({ isEmbed: value }),
  setMounted: (value) => set({ mounted: value }),

  dayCounts: {},
  loading: false,
  gitHubUsername: "",
  gitLabUsername: "",
  autoSyncEnabled: false,
  embedCode: "",
  copied: false,
  embedTheme: "light",
  bgColor: "#ffffff",

  setDayCounts: (counts) => set({ dayCounts: counts }),
  setLoading: (loading) => set({ loading }),
  setGitHubUsername: (username) => set({ gitHubUsername: username }),
  setGitLabUsername: (username) => set({ gitLabUsername: username }),
  setAutoSyncEnabled: (enabled) => set({ autoSyncEnabled: enabled }),
  setEmbedCode: (code) => set({ embedCode: code }),
  setCopied: (copied) => set({ copied }),
  setEmbedTheme: (theme) => set({ embedTheme: theme }),
  setBgColor: (color) => set({ bgColor: color }),
}));
