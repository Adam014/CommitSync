import { create } from "zustand";

interface Store {
  darkMode: boolean;
  isEmbed: boolean;
  mounted: boolean;
  setDarkMode: (value: boolean) => void;
  toggleDarkMode: () => void;
  setIsEmbed: (value: boolean) => void;
  setMounted: (value: boolean) => void;

  dayCounts: Record<string, number>;
  loading: boolean;
  gitHubUsername: string;
  gitLabUsername: string;
  autoSyncEnabled: boolean;
  embedCode: string;
  copied: boolean;
  embedTheme: "light" | "dark";

  setDayCounts: (counts: Record<string, number>) => void;
  setLoading: (loading: boolean) => void;
  setGitHubUsername: (username: string) => void;
  setGitLabUsername: (username: string) => void;
  setAutoSyncEnabled: (enabled: boolean) => void;
  setEmbedCode: (code: string) => void;
  setCopied: (copied: boolean) => void;
  setEmbedTheme: (theme: "light" | "dark") => void;
}

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

  setDayCounts: (counts) => set({ dayCounts: counts }),
  setLoading: (loading) => set({ loading }),
  setGitHubUsername: (username) => set({ gitHubUsername: username }),
  setGitLabUsername: (username) => set({ gitLabUsername: username }),
  setAutoSyncEnabled: (enabled) => set({ autoSyncEnabled: enabled }),
  setEmbedCode: (code) => set({ embedCode: code }),
  setCopied: (copied) => set({ copied }),
  setEmbedTheme: (theme) => set({ embedTheme: theme }),
}));
