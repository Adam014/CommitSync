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

export interface GitHubPrItem{
  created_at: string;
}