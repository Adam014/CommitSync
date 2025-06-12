// utils.ts
import { format } from "date-fns";
import { GitHubCommit, GitLabCommit, GitHubPrItem } from "@/types/types";

export const legendCounts = [0, 1, 3, 6, 10];

export function getCurrentMonthYear() {
  return format(new Date(), "MMMM yyyy");
}

export function calculateTotalEvents(dayCounts: Record<string, number>) {
  return Object.values(dayCounts).reduce((acc, count) => acc + count, 0);
}

export async function fetchEvents(
  githubUsername: string,
  gitlabUsername: string,
  year?: number,
  month?: number,
): Promise<Record<string, number>> {
  const now = new Date();
  const currentYear = year ?? now.getFullYear();
  const currentMonth = month ?? now.getMonth();
  const eventsAggregate: Record<string, number> = {};

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = format(
      new Date(currentYear, currentMonth, day),
      "yyyy-MM-dd"
    );
    eventsAggregate[dateKey] = 0;
  }

  if (githubUsername) {
    try {
      const firstDay = new Date(currentYear, currentMonth, 1).toISOString();
      const lastDay = new Date(
        currentYear,
        currentMonth,
        daysInMonth,
        23,
        59,
        59
      ).toISOString();

      // Fetch commits
      const githubCommitQuery = `author:${githubUsername} committer-date:${firstDay}..${lastDay}`;
      const ghCommitRes = await fetch(
        `https://api.github.com/search/commits?q=${encodeURIComponent(
          githubCommitQuery
        )}&per_page=100`,
        {
          headers: {
            Accept: "application/vnd.github.cloak-preview",
            Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_API_KEY}`,
          },
        }
      );
      const ghCommitData = await ghCommitRes.json();
      (ghCommitData.items || []).forEach((commit: GitHubCommit) => {
        const commitDate = new Date(commit.commit.author.date);
        const dateKey = format(commitDate, "yyyy-MM-dd");
        if (dateKey in eventsAggregate) {
          eventsAggregate[dateKey] += 1;
        }
      });

      // Fetch PR creations
      const githubPrQuery = `type:pr author:${githubUsername} created:${firstDay}..${lastDay}`;
      const ghPrRes = await fetch(
        `https://api.github.com/search/issues?q=${encodeURIComponent(
          githubPrQuery
        )}&per_page=100`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_API_KEY}`,
          },
        }
      );
      const ghPrData = await ghPrRes.json();
      (ghPrData.items || []).forEach((pr: GitHubPrItem) => {
        const prDate = new Date(pr.created_at);
        const dateKey = format(prDate, "yyyy-MM-dd");
        if (dateKey in eventsAggregate) {
          eventsAggregate[dateKey] += 1;
        }
      });
    } catch (err) {
      console.error("Error fetching GitHub commits or PRs:", err);
    }
  }

  if (process.env.NEXT_PUBLIC_GITLAB_TOKEN && gitlabUsername) {
    try {
      const gitlabToken = process.env.NEXT_PUBLIC_GITLAB_TOKEN;
      const glUserRes = await fetch(
        `https://gitlab.com/api/v4/users?username=${gitlabUsername}`,
        { headers: { "Private-Token": gitlabToken } }
      );
      const glUsers = await glUserRes.json();
      if (Array.isArray(glUsers) && glUsers.length > 0) {
        const userId = glUsers[0].id;
        const glEventsRes = await fetch(
          `https://gitlab.com/api/v4/users/${userId}/events?per_page=100`,
          { headers: { "Private-Token": gitlabToken } }
        );
        const glEvents = await glEventsRes.json();
        (glEvents || []).forEach((event: GitLabCommit) => {
          const eventDate = new Date(event.created_at);
          if (
            eventDate.getFullYear() === currentYear &&
            eventDate.getMonth() === currentMonth
          ) {
            const dateKey = format(eventDate, "yyyy-MM-dd");
            if (dateKey in eventsAggregate) {
              eventsAggregate[dateKey] += 1;
            }
          }
        });
      }
    } catch (err) {
      console.error("Error fetching GitLab events:", err);
    }
  }

  return eventsAggregate;
}

export function handleCopy(
  embedCode: string,
  setCopied: (copied: boolean) => void,
) {
  navigator.clipboard.writeText(embedCode);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
}

export function updateEmbedCode(
  setEmbedCode: (code: string) => void,
  embedTheme: "light" | "dark",
  gitHubUsername: string,
  gitLabUsername: string,
) {
  const origin = window.location.origin;
  const embedUrl =
    `${origin}${window.location.pathname}` +
    `?embed=true` +
    `&theme=${embedTheme}` +
    `&github=${encodeURIComponent(gitHubUsername)}` +
    `&gitlab=${encodeURIComponent(gitLabUsername)}`;

  setEmbedCode(
    `<iframe
       src="${embedUrl}"
       width="100%"
       height="300"
       style="border:none; overflow:hidden; background: transparent;"
       scrolling="no"
       frameborder="0"
     ></iframe>`,
  );
}

export function getColor(count: number, darkMode: boolean): string {
  if (!darkMode) {
    if (count === 0) return "#F3E5F5";
    if (count < 3) return "#CE93D8";
    if (count < 6) return "#AB47BC";
    if (count < 10) return "#8E24AA";
    return "#6A1B9A";
  } else {
    if (count === 0) return "#3A3A3A";
    if (count < 3) return "#6A1B9A";
    if (count < 6) return "#7B1FA2";
    if (count < 10) return "#8E24AA";
    return "#9C27B0";
  }
}
