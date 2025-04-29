import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { createThemeSlice, ThemeSlice } from "./slices/ThemeSlice";
import { createEmbedSlice, EmbedSlice } from "./slices/EmbedSlice";

export type StoreState = ThemeSlice & EmbedSlice;

export const useStore = create<StoreState>()(
  devtools(
    persist(
      (set, get, store) => ({
        ...createThemeSlice(set, get, store),
        ...createEmbedSlice(set, get, store),
      }),
      {
        name: "commit-zustand",
        partialize: (state) => ({
          gitHubUsername: state.gitHubUsername,
          gitLabUsername: state.gitLabUsername,
          embedTheme: state.embedTheme,
          bgColor: state.bgColor,
        }),
      },
    ),
  ),
);
