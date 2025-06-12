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
  const pad = (n: number) => String(n).padStart(2, "0");

  // populate keys YYYY-MM-DD
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
    eventsAggregate[dateKey] = 0;
  }

  const fmtPrague = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
  });

  if (githubUsername) {
    try {
      const firstDay = new Date(currentYear, currentMonth, 1).toISOString();
      const lastDay = new Date(
        currentYear,
        currentMonth,
        daysInMonth,
        23,
        59,
        59,
      ).toISOString();

      // commits
      const commitQ = `author:${githubUsername} committer-date:${firstDay}..${lastDay}`;
      const commitRes = await fetch(
        `https://api.github.com/search/commits?q=${encodeURIComponent(
          commitQ,
        )}&per_page=100`,
        {
          headers: {
            Accept: "application/vnd.github.cloak-preview",
            Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_API_KEY}`,
          },
        },
      );
      const commitData = await commitRes.json();
      (commitData.items || []).forEach((c: GitHubCommit) => {
        const d = new Date(c.commit.author.date);
        const key = fmtPrague.format(d);
        if (key in eventsAggregate) eventsAggregate[key]++;
      });

      // pull requests
      const prQ = `type:pr author:${githubUsername} created:${firstDay}..${lastDay}`;
      const prRes = await fetch(
        `https://api.github.com/search/issues?q=${encodeURIComponent(
          prQ,
        )}&per_page=100`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_API_KEY}`,
          },
        },
      );
      const prData = await prRes.json();
      (prData.items || []).forEach((pr: GitHubPrItem) => {
        const d = new Date(pr.created_at);
        const key = fmtPrague.format(d);
        if (key in eventsAggregate) eventsAggregate[key]++;
      });
    } catch (e) {
      console.error("Error fetching GitHub data:", e);
    }
  }

  if (process.env.NEXT_PUBLIC_GITLAB_TOKEN && gitlabUsername) {
    try {
      const token = process.env.NEXT_PUBLIC_GITLAB_TOKEN;
      const uRes = await fetch(
        `https://gitlab.com/api/v4/users?username=${gitlabUsername}`,
        { headers: { "Private-Token": token } },
      );
      const users = await uRes.json();
      if (Array.isArray(users) && users.length) {
        const userId = users[0].id;
        const evRes = await fetch(
          `https://gitlab.com/api/v4/users/${userId}/events?per_page=100`,
          { headers: { "Private-Token": token } },
        );
        const events = await evRes.json();
        (events || []).forEach((ev: GitLabCommit) => {
          const d = new Date(ev.created_at);
          const key = fmtPrague.format(d);
          if (key in eventsAggregate) eventsAggregate[key]++;
        });
      }
    } catch (e) {
      console.error("Error fetching GitLab events:", e);
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
