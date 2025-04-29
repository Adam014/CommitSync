import { Dispatch, SetStateAction } from "react";

export interface HeatmapProps {
  dayCounts: Record<string, number>;
  darkMode: boolean;
}

export interface GitHubCommit {
  commit: {
    author: {
      date: string;
    };
  };
}

export interface GitLabCommit {
  created_at: string;
}

export interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  mounted: boolean;
  setMounted: Dispatch<SetStateAction<boolean>>;
}
