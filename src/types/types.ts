export interface CommitEvent {
  platform: "GitHub" | "GitLab";
  type: string;
  message: string;
  sha?: string;
  repo: string;
  date: Date;
}

export interface GitHubCommit {
  message: string;
  sha: string;
}

export interface GitHubPayload {
  commits?: GitHubCommit[];
  action?: string;
  description?: string;
}

export interface GitHubRepo {
  name: string;
}

export interface GitHubEvent {
  created_at: string;
  type: string;
  payload: GitHubPayload;
  repo?: GitHubRepo;
}

export interface GitLabEvent {
  created_at: string;
  action_name?: string;
  title?: string;
  project_id?: number;
}
