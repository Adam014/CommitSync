// utils.ts
import { format } from "date-fns";
import { GitHubCommit, GitLabCommit, GitHubPrItem } from "@/types/types"; // Assuming these types are correctly defined

export const legendCounts = [0, 1, 3, 6, 10];

export function getCurrentMonthYear() {
  return format(new Date(), "MMMM yyyy"); // Added yyyy for completeness and clarity
}

export function calculateTotalEvents(dayCounts: Record<string, number>) {
  return Object.values(dayCounts).reduce((acc, count) => acc + count, 0);
}

// Helper function to fetch all pages from a paginated GitHub API
async function fetchAllGitHubPages<T>(
  url: string,
  headers: HeadersInit,
): Promise<T[]> {
  let allItems: T[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    // Explicitly type 'response' as Response
    const response: Response = await fetch(nextUrl, { headers });
    if (!response.ok) {
      // Log error details for debugging API issues
      console.error(
        `GitHub API error: ${response.status} - ${response.statusText} for ${nextUrl}`,
        await response.text() // Log response body for more details
      );
      break; // Stop on error
    }
    const data: { items?: T[] } | T[] = await response.json(); // Explicitly type data

    // GitHub search APIs return items in `data.items`
    if ("items" in data && Array.isArray(data.items)) {
      allItems = allItems.concat(data.items as T[]);
    } else {
      // For some GitHub APIs, the data might be an array directly
      if (Array.isArray(data)) {
        allItems = allItems.concat(data as T[]);
      }
    }

    // Explicitly type 'linkHeader' as string | null
    const linkHeader: string | null = response.headers.get("Link");
    nextUrl = null; // Reset nextUrl for the next iteration

    if (linkHeader) {
      // Explicitly type 'links' as string[]
      const links: string[] = linkHeader.split(",").map((link: string) => link.trim()); // Type 'link' parameter
      // Explicitly type 'nextLink' as string | undefined
      const nextLink: string | undefined = links.find((link: string) => link.includes('rel="next"')); // Type 'link' parameter
      if (nextLink) {
        // Explicitly type 'match' as RegExpMatchArray | null
        const match: RegExpMatchArray | null = nextLink.match(/<(.*)>; rel="next"/);
        if (match && match[1]) {
          nextUrl = match[1];
        }
      }
    }
  }
  return allItems;
}

export async function fetchEvents(
  githubUsername: string,
  gitlabUsername: string,
  year?: number,
  month?: number,
): Promise<Record<string, number>> {
  const now = new Date();
  const currentYear = year ?? now.getFullYear();
  const currentMonth = month ?? now.getMonth(); // 0-indexed month

  const eventsAggregate: Record<string, number> = {};

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, "0");

  // populate keys YYYY-MM-DD
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
    eventsAggregate[dateKey] = 0;
  }

  // DateTimeFormat for Prague timezone, specifically for YYYY-MM-DD output
  const fmtPrague = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  // Ensure GITHUB_API_KEY is available
  const githubApiKey = process.env.NEXT_PUBLIC_GITHUB_API_KEY;

  if (githubUsername && githubApiKey) {
    try {
      // Define the start and end of the month for the search queries
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0); // Last day of the current month

      const firstDayQuery = format(startOfMonth, 'yyyy-MM-dd'); // e.g., '2025-06-01'
      const lastDayQuery = format(endOfMonth, 'yyyy-MM-dd');   // e.g., '2025-06-30'

      const githubAuthHeaders = {
        Accept: "application/vnd.github.v3+json", // Standard API version
        Authorization: `token ${githubApiKey}`,
      };

      // --- Fetch GitHub Commits ---
      // Using DATE1..DATE2 for an inclusive date range in the search query
      const commitQ = `author:${githubUsername} committer-date:${firstDayQuery}..${lastDayQuery}`;
      const commitUrl = `https://api.github.com/search/commits?q=${encodeURIComponent(commitQ)}&per_page=100`;
      
      // console.log("GitHub Commit URL:", commitUrl); // Debugging: Log the generated URL
      const allCommits = await fetchAllGitHubPages<GitHubCommit>(
        commitUrl,
        githubAuthHeaders,
      );
      // console.log(`Fetched ${allCommits.length} GitHub commits.`); // Debugging: Log number of fetched commits

      allCommits.forEach((c: GitHubCommit) => {
        // Use committer.date for contributions (when it landed in repo)
        // This line now correctly accesses c.commit.committer.date because GitHubCommit type is updated
        const d = new Date(c.commit.committer.date);
        const key = fmtPrague.format(d); // Formats to YYYY-MM-DD in Prague timezone
        // console.log(`Commit processed: ${c.sha.substring(0, 7)} on ${c.commit.committer.date} -> Key: ${key}`); // Detailed debugging

        if (key in eventsAggregate) {
          eventsAggregate[key]++;
        }
      });

      // --- Fetch GitHub Pull Requests ---
      const prQ = `type:pr author:${githubUsername} created:${firstDayQuery}..${lastDayQuery}`;
      const prUrl = `https://api.github.com/search/issues?q=${encodeURIComponent(prQ)}&per_page=100`;

      // console.log("GitHub PR URL:", prUrl); // Debugging: Log the generated URL
      const allPullRequests = await fetchAllGitHubPages<GitHubPrItem>(
        prUrl,
        githubAuthHeaders,
      );
      // console.log(`Fetched ${allPullRequests.length} GitHub pull requests.`); // Debugging: Log number of fetched PRs

      allPullRequests.forEach((pr: GitHubPrItem) => {
        const d = new Date(pr.created_at);
        const key = fmtPrague.format(d);
        // console.log(`PR processed: ${pr.number} created on ${pr.created_at} -> Key: ${key}`); // Detailed debugging

        if (key in eventsAggregate) {
          eventsAggregate[key]++;
        }
      });
    } catch (e) {
      console.error("Error fetching GitHub data:", e);
    }
  }

  // --- GitLab Events (Existing logic, consider adding full pagination if needed) ---
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
        // GitLab's events API is also paginated. To fetch all, you'd need
        // to implement similar pagination logic as `fetchAllGitHubPages`.
        // The `per_page=100` and `after`/`before` parameters help narrow the results,
        // but won't get all if there are more than 100 events in the month.
        const evRes = await fetch(
          `https://gitlab.com/api/v4/users/${userId}/events?per_page=100&after=${currentYear}-${pad(currentMonth + 1)}-01&before=${currentYear}-${pad(currentMonth + 1)}-${pad(daysInMonth)}`,
          { headers: { "Private-Token": token } },
        );
        const events = await evRes.json();
        // console.log(`Fetched ${events.length} GitLab events.`); // Debugging
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