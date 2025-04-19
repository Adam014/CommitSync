import { NextResponse } from "next/server";
import { format } from "date-fns";
import { getColor } from "@/stores/utils"; // Reuse your existing getColor logic
import { GitHubCommit, GitLabCommit } from "@/types/types";

// Legend thresholds used for the legend squares (customize if needed)
const legendCounts = [0, 1, 3, 6, 10];

// Helper function to aggregate events for the current month, reusing your client logic.
async function fetchEvents(
  githubUsername: string,
  gitlabUsername: string,
  currentYear: number,
  currentMonth: number,
): Promise<Record<string, number>> {
  const eventsAggregate: Record<string, number> = {};
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Initialize count for every day in the month.
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = format(
      new Date(currentYear, currentMonth, day),
      "yyyy-MM-dd",
    );
    eventsAggregate[dateKey] = 0;
  }

  // Fetch GitHub commits if provided.
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

  // Fetch GitLab events if provided.
  if (process.env.NEXT_PUBLIC_GITLAB_TOKEN && gitlabUsername) {
    try {
      const gitlabToken = process.env.NEXT_PUBLIC_GITLAB_TOKEN;
      const glUserRes = await fetch(
        `https://gitlab.com/api/v4/users?username=${gitlabUsername}`,
        {
          headers: { "Private-Token": gitlabToken },
        },
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
  // Parse query parameters: github, gitlab, mode, and bg (background color)
  const { searchParams } = new URL(request.url);
  const github = searchParams.get("github") || "";
  const gitlab = searchParams.get("gitlab") || "";
  const mode = searchParams.get("mode") || "light";
  const darkMode = mode === "dark";

  // New "bg" parameter allows custom background color; use default if not provided.
  const bgParam = searchParams.get("bg");
  const defaultBg = darkMode ? "#0a0a0a" : "#f4f8d3";
  const bgColor = bgParam || defaultBg;

  // Get current month info
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Aggregate events using our helper function.
  const dayCounts = await fetchEvents(
    github,
    gitlab,
    currentYear,
    currentMonth,
  );
  const totalEvents = Object.values(dayCounts).reduce((acc, n) => acc + n, 0);
  const currentMonthYear = format(now, "MMMM yyyy");

  // Dimensions & layout settings:
  const topPadding = 20; // Space for header text
  const lineHeight = 16;
  const legendHeight = 40;
  const squareSize = 30;
  const spacing = 2;

  // Calculate grid layout based on the first weekday of the month.
  const startWeekday = new Date(currentYear, currentMonth, 1).getDay();
  const totalCells = startWeekday + daysInMonth;
  const weeks = Math.ceil(totalCells / 7);
  const gridWidth = weeks * (squareSize + spacing);
  const gridHeight = 7 * (squareSize + spacing);

  // Set overall SVG dimensions.
  const svgWidth = Math.max(gridWidth, 240);
  const svgHeight = topPadding + lineHeight + legendHeight + gridHeight + 20;

  // 1) Top header text e.g. "April 2025   37 events"
  const topText = `<text x="0" y="${topPadding}" font-size="14" font-family="sans-serif" fill="${
    darkMode ? "#ededed" : "#171717"
  }">
    ${currentMonthYear}    ${totalEvents} event${totalEvents !== 1 ? "s" : ""}
  </text>`;

  // 2) Legend row: "Less [squares] More"
  const legendY = topPadding + lineHeight + 10;
  let legendSquares = "";
  const legendSquareSize = 20;
  let lx = 40; // Starting X position for the legend squares.
  legendCounts.forEach((val) => {
    const color = getColor(val, darkMode);
    legendSquares += `<rect x="${lx}" y="${legendY}" width="${legendSquareSize}" height="${legendSquareSize}" fill="${color}" rx="2" ry="2" />
    `;
    lx += legendSquareSize + 4;
  });
  const legendTextColor = darkMode ? "#ededed" : "#171717";
  const legendRow = `
    <text x="0" y="${legendY + 15}" font-size="14" font-family="sans-serif" fill="${legendTextColor}">Less</text>
    ${legendSquares}
    <text x="${lx}" y="${legendY + 15}" font-size="14" font-family="sans-serif" fill="${legendTextColor}">More</text>
  `;

  // 3) Day grid: Build cells with day numbers.
  const gridTopY = legendY + legendSquareSize + 20;
  let dayRects = "";
  let dayCounter = 1;
  for (let cell = 0; cell < weeks * 7; cell++) {
    const col = Math.floor(cell / 7);
    const row = cell % 7;
    const x = col * (squareSize + spacing);
    const y = row * (squareSize + spacing) + gridTopY;
    if (cell >= startWeekday && dayCounter <= daysInMonth) {
      const currentDate = new Date(currentYear, currentMonth, dayCounter);
      const dateKey = format(currentDate, "yyyy-MM-dd");
      const count = dayCounts[dateKey] || 0;
      const color = getColor(count, darkMode);
      const title = `Date: ${dateKey} — ${count} event${count !== 1 ? "s" : ""}`;
      dayRects += `<rect x="${x}" y="${y}" width="${squareSize}" height="${squareSize}" fill="${color}" rx="4" ry="4">
        <title>${title}</title>
      </rect>
      `;
      // Center day number within the square.
      const textX = x + squareSize / 2;
      const textY = y + squareSize / 2 + 4;
      // For better contrast, using white text; adjust as needed.
      dayRects += `<text x="${textX}" y="${textY}" font-size="10" font-family="sans-serif" fill="#ffffff" text-anchor="middle" alignment-baseline="middle">
        ${dayCounter}
      </text>
      `;
      dayCounter++;
    } else {
      dayRects += `<rect x="${x}" y="${y}" width="${squareSize}" height="${squareSize}" fill="transparent" />`;
    }
  }

  // Combine all parts into the full SVG.
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" style="background: ${bgColor}">
  ${topText}
  ${legendRow}
  ${dayRects}
</svg>
`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
