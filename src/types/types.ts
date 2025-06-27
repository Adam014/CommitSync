export interface HeatmapProps {
  dayCounts: Record<string, number>;
  darkMode: boolean;
}

// Define a common interface for GitHub user details within a commit
export interface GitHubCommitUser {
  name?: string; // Name can be optional, sometimes not present for bots or specific commit types
  email?: string; // Email can be optional
  date: string; // This is crucial for both author and committer dates
}

export interface GitHubCommit {
  commit: {
    author: GitHubCommitUser;
    committer: GitHubCommitUser; // <--- ADD THIS LINE
    message: string; // Optionally add other properties you might use
    // tree: { sha: string; url: string; };
    // url: string;
    // comment_count: number;
    // verification: { verified: boolean; reason: string; signature: string | null; payload: string | null; };
  };
  sha: string; // Add sha as it's used in debugging logs, useful for identifying commits
  // url: string;
  // html_url: string;
  // comments_url: string;
  // node_id: string;
  // parents: Array<{ sha: string; url: string; html_url: string; }>;
}

export interface GitLabCommit {
  created_at: string;
  // Add other GitLab commit/event properties if you use them, e.g., id, action_name, project_id
}

export interface GitHubPrItem {
  created_at: string;
  id: number; // Add id and number if you use them
  number: number;
  // Add other PR properties if you use them, e.g., title, url, user, state
}