import { StateCreator } from "zustand";
import { StoreState } from "../store";

export interface EmbedSlice {
  dayCounts: Record<string, number>;
  loading: boolean;
  gitHubUsername: string;
  gitLabUsername: string;
  autoSyncEnabled: boolean;
  embedCode: string;
  copied: boolean;
  embedTheme: "light" | "dark";
  bgColor: string;

  setDayCounts: (counts: Record<string, number>) => void;
  setLoading: (loading: boolean) => void;
  setGitHubUsername: (username: string) => void;
  setGitLabUsername: (username: string) => void;
  setAutoSyncEnabled: (enabled: boolean) => void;
  setEmbedCode: (code: string) => void;
  setCopied: (copied: boolean) => void;
  setEmbedTheme: (theme: "light" | "dark") => void;
  setBgColor: (color: string) => void;
  resetEmbed: () => void; // NEW
}

export const createEmbedSlice: StateCreator<StoreState, [], [], EmbedSlice> = (set) => ({
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
  resetEmbed: () =>
    set({
      dayCounts: {},
      loading: false,
      gitHubUsername: "",
      gitLabUsername: "",
      autoSyncEnabled: false,
      embedCode: "",
      copied: false,
      embedTheme: "light",
      bgColor: "#ffffff",
    }),
});
