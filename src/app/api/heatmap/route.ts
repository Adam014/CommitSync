// app/api/heatmap/route.ts
import { NextResponse } from "next/server";
import { format } from "date-fns";
import { getColor } from "@/stores/utils";
import { GitHubCommit, GitLabCommit } from "@/types/types";

// A helper function to aggregate daily events.
// This reuses the same logic as your client-side fetchEvents.
async function fetchEvents(
  githubUsername: string,
  gitlabUsername: string,
  currentYear: number,
  currentMonth: number,
): Promise<Record<string, number>> {
  const eventsAggregate: Record<string, number> = {};
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Initialize the aggregate for each day in the month.
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dateKey = format(date, "yyyy-MM-dd");
    eventsAggregate[dateKey] = 0;
  }

  // Fetch GitHub commits if a username is provided.
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
      const githubQuery = `author:${githubUsername} committer-date:${firstDay}..${lastDay}`;
      const ghRes = await fetch(
        `https://api.github.com/search/commits?q=${encodeURIComponent(githubQuery)}&per_page=100`,
        {
          headers: {
            Accept: "application/vnd.github.cloak-preview",
            Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_API_KEY}`,
          },
        },
      );
      const ghData = await ghRes.json();
      (ghData.items || []).forEach((commit: GitHubCommit) => {
        const commitDate = new Date(commit.commit.author.date);
        const dateKey = format(commitDate, "yyyy-MM-dd");
        if (dateKey in eventsAggregate) {
          eventsAggregate[dateKey] += 1;
        }
      });
    } catch (err) {
      console.error("Error fetching GitHub commits:", err);
    }
  }

  // Fetch GitLab events if a token and username are provided.
  if (process.env.NEXT_PUBLIC_GITLAB_TOKEN && gitlabUsername) {
    try {
      const gitlabToken = process.env.NEXT_PUBLIC_GITLAB_TOKEN;
      const glUserRes = await fetch(
        `https://gitlab.com/api/v4/users?username=${githubUsername ? "" : gitlabUsername}`,
        { headers: { "Private-Token": gitlabToken } },
      );
      const glUsers = await glUserRes.json();
      if (Array.isArray(glUsers) && glUsers.length > 0) {
        const userId = glUsers[0].id;
        const glEventsRes = await fetch(
          `https://gitlab.com/api/v4/users/${userId}/events?per_page=100`,
          { headers: { "Private-Token": gitlabToken } },
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

export async function GET(request: Request) {
  // Read query parameters: "github", "gitlab", and "mode" (light/dark).
  const { searchParams } = new URL(request.url);
  const github = searchParams.get("github") || "";
  const gitlab = searchParams.get("gitlab") || "";
  const mode = searchParams.get("mode") || "light";
  const darkMode = mode === "dark";

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Get aggregated event counts.
  const eventsAggregate = await fetchEvents(
    github,
    gitlab,
    currentYear,
    currentMonth,
  );

  // Determine the weekday offset for the first day of the month.
  const startWeekday = new Date(currentYear, currentMonth, 1).getDay();

  // Define square size and spacing (these can be tuned to match your client-side Heatmap).
  const squareSize = 30;
  const spacing = 2;
  const totalCells = startWeekday + daysInMonth;
  const weeks = Math.ceil(totalCells / 7);
  const width = weeks * (squareSize + spacing);
  const height = 7 * (squareSize + spacing);

  // Generate SVG rectangles for each day.
  let rects = "";
  let dayCounter = 1;
  for (let cell = 0; cell < weeks * 7; cell++) {
    const col = Math.floor(cell / 7);
    const row = cell % 7;
    const x = col * (squareSize + spacing);
    const y = row * (squareSize + spacing);
    if (cell >= startWeekday && dayCounter <= daysInMonth) {
      const currentDate = new Date(currentYear, currentMonth, dayCounter);
      const dateKey = format(currentDate, "yyyy-MM-dd");
      const count = eventsAggregate[dateKey] || 0;
      const color = getColor(count, darkMode);
      const title = `${dateKey}: ${count} event${count !== 1 ? "s" : ""}`;
      rects += `<rect x="${x}" y="${y}" width="${squareSize}" height="${squareSize}" fill="${color}">
        <title>${title}</title>
      </rect>`;
      dayCounter++;
    } else {
      // Render an empty cell (transparent) for spacing.
      rects += `<rect x="${x}" y="${y}" width="${squareSize}" height="${squareSize}" fill="transparent" />`;
    }
  }

  // Construct the SVG markup.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    ${rects}
  </svg>`;

  // Return the SVG with appropriate headers.
  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
