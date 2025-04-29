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

export interface ThemeSlice {
  darkMode: boolean;
  isEmbed: boolean;
  mounted: boolean;
  setDarkMode: (value: boolean) => void;
  toggleDarkMode: () => void;
  setIsEmbed: (value: boolean) => void;
  setMounted: (value: boolean) => void;
}

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

