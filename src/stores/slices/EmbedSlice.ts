import { StateCreator } from "zustand";

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
}

export const createEmbedSlice: StateCreator<EmbedSlice, [], [], EmbedSlice> = (
  set,
) => ({
  dayCounts: {},
  loading: false,
  gitHubUsername: "",
  gitLabUsername: "",
  autoSyncEnabled: false,
  embedCode: "",
  copied: false,
  embedTheme: "light",
  bgColor: "#ffffff",

  setDayCounts: (counts: Record<string, number>) => set({ dayCounts: counts }),
  setLoading: (loading: boolean) => set({ loading }),
  setGitHubUsername: (username: string) => set({ gitHubUsername: username }),
  setGitLabUsername: (username: string) => set({ gitLabUsername: username }),
  setAutoSyncEnabled: (enabled: boolean) => set({ autoSyncEnabled: enabled }),
  setEmbedCode: (code: string) => set({ embedCode: code }),
  setCopied: (copied: boolean) => set({ copied }),
  setEmbedTheme: (theme: "light" | "dark") => set({ embedTheme: theme }),
  setBgColor: (color: string) => set({ bgColor: color }),
});
