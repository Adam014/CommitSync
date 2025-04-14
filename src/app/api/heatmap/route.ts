import { NextResponse } from "next/server";
import { format } from "date-fns";
import { getColor } from "@/stores/utils"; // <-- Reuse your existing color logic
import { GitHubCommit, GitLabCommit } from "@/types/types";

// Use the same thresholds as in your page.tsx or Heatmap.tsx
const legendCounts = [0, 1, 3, 6, 10];

// Re-implement the logic from fetchEvents in page.tsx
async function fetchEvents(
  githubUsername: string,
  gitlabUsername: string,
  currentYear: number,
  currentMonth: number
): Promise<Record<string, number>> {
  const eventsAggregate: Record<string, number> = {};
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Initialize each day of the month with 0
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = format(
      new Date(currentYear, currentMonth, day),
      "yyyy-MM-dd"
    );
    eventsAggregate[dateKey] = 0;
  }

  // Fetch GitHub commits
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
      const githubQuery = `author:${githubUsername} committer-date:${firstDay}..${lastDay}`;
      const ghRes = await fetch(
        `https://api.github.com/search/commits?q=${encodeURIComponent(
          githubQuery
        )}&per_page=100`,
        {
          headers: {
            Accept: "application/vnd.github.cloak-preview",
            Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_API_KEY}`,
          },
        }
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

  // Fetch GitLab events
  if (process.env.NEXT_PUBLIC_GITLAB_TOKEN && gitlabUsername) {
    try {
      const gitlabToken = process.env.NEXT_PUBLIC_GITLAB_TOKEN;
      const glUserRes = await fetch(
        `https://gitlab.com/api/v4/users?username=${gitlabUsername}`,
        {
          headers: { "Private-Token": gitlabToken },
        }
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

export async function GET(request: Request) {
  // Grab ?github=..., ?gitlab=..., ?mode=light|dark from the query string
  const { searchParams } = new URL(request.url);
  const github = searchParams.get("github") || "";
  const gitlab = searchParams.get("gitlab") || "";
  const mode = searchParams.get("mode") || "light";
  const darkMode = mode === "dark";

  // Gather events for the current month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const dayCounts = await fetchEvents(github, gitlab, currentYear, currentMonth);

  // Summarize total events
  const totalEvents = Object.values(dayCounts).reduce((acc, n) => acc + n, 0);

  // Format the month-year label. (e.g. "April 2025")
  const currentMonthYear = format(now, "MMMM yyyy");

  // We want the same layout: 
  // 1) A top row of text: "April 2025   37 events"
  // 2) A legend row: "Less [ ] [ ] [ ] [ ] [ ] More"
  // 3) The grid of days: squares with day numbers.

  // Dimensions for text + legend
  // We'll place them at the top, then our day-grid below.
  const topPadding = 20;    // Space before top text
  const lineHeight = 16;    // Basic line height for text
  const legendHeight = 40;  // Space for the "Less/More" row
  // Day squares match your Heatmap: 30×30 px + 2 px margin
  const squareSize = 30;
  const spacing = 2;

  // Calculate how many columns (weeks) in the current month
  const startWeekday = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const totalCells = startWeekday + daysInMonth;
  const weeks = Math.ceil(totalCells / 7);

  // The grid's total width/height
  const gridWidth = weeks * (squareSize + spacing);
  const gridHeight = 7 * (squareSize + spacing);

  // We'll define an overall width for the SVG big enough for the grid + legend text, etc.
  // If you want a bit of horizontal margin, add more. 
  const svgWidth = Math.max(gridWidth, 240); // at least 240 wide
  // For overall height: top text + legend row + grid + some bottom margin
  const svgHeight = topPadding + lineHeight + legendHeight + gridHeight + 20;

  // 1) Build the top text: "April 2025   37 events"
  // We'll place it at (0, topPadding).
  const topText = `<text x="0" y="${topPadding}" font-size="14" font-family="sans-serif" fill="${
    darkMode ? "#ededed" : "#171717"
  }">
    ${currentMonthYear}    ${totalEvents} event${totalEvents !== 1 ? "s" : ""}
  </text>`;

  // 2) Build the legend row: "Less [5 squares] More"
  // We'll place it at (0, topPadding + lineHeight + 5).
  // Each legend square 20×20, spaced 2 px, continuing your color logic for 0,1,3,6,10
  const legendY = topPadding + lineHeight + 10; // just some vertical spacing
  let legendSquares = "";
  const legendSquareSize = 20;
  let lx = 40; // after the "Less" label
  legendCounts.forEach((val) => {
    const color = getColor(val, darkMode);
    legendSquares += `<rect x="${lx}" y="${legendY}" width="${legendSquareSize}" height="${legendSquareSize}" fill="${color}" rx="2" ry="2" />
    `;
    lx += legendSquareSize + 4;
  });

  // We'll place "Less" near x=0, "More" near the final rect
  const legendTextColor = darkMode ? "#ededed" : "#171717";
  const legendRow = `
    <text x="0" y="${legendY + 15}" font-size="14" font-family="sans-serif" fill="${legendTextColor}">Less</text>
    ${legendSquares}
    <text x="${lx}" y="${legendY + 15}" font-size="14" font-family="sans-serif" fill="${legendTextColor}">More</text>
  `;

  // 3) Build the day-grid
  // We'll place its top-left corner at y= (legendY + legendSquareSize + ?)
  const gridTopY = legendY + legendSquareSize + 20;
  let dayRects = "";
  let dayCounter = 1;

  for (let cell = 0; cell < weeks * 7; cell++) {
    const col = Math.floor(cell / 7);
    const row = cell % 7;
    const x = col * (squareSize + spacing);
    const y = row * (squareSize + spacing) + gridTopY;

    if (cell >= startWeekday && dayCounter <= daysInMonth) {
      // This is a real day
      const currentDate = new Date(currentYear, currentMonth, dayCounter);
      const dateKey = format(currentDate, "yyyy-MM-dd");
      const count = dayCounts[dateKey] || 0;
      const color = getColor(count, darkMode);
      const title = `Date: ${dateKey} — ${count} event${count !== 1 ? "s" : ""}`;

      // 3a) The rect (with rounded corners)
      dayRects += `<rect x="${x}" y="${y}" width="${squareSize}" height="${squareSize}" fill="${color}" rx="4" ry="4">
        <title>${title}</title>
      </rect>
      `;

      // 3b) The day number text, centered
      const textColor = "#ffffff"; // or pick a logic if you want black text for light squares
      const textX = x + squareSize / 2;
      const textY = y + squareSize / 2 + 4; // +4 to better center with font size
      dayRects += `<text x="${textX}" y="${textY}" font-size="10" font-family="sans-serif" fill="${textColor}"
        text-anchor="middle" alignment-baseline="middle">
        ${dayCounter}
      </text>
      `;
      dayCounter++;
    } else {
      // Empty cell
      dayRects += `<rect x="${x}" y="${y}" width="${squareSize}" height="${squareSize}" fill="transparent" />`;
    }
  }

  // Combine all parts into one SVG
  const svg = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${svgWidth}"
  height="${svgHeight}"
  viewBox="0 0 ${svgWidth} ${svgHeight}"
  style="background: ${darkMode ? "#0a0a0a" : "#f4f8d3"}"
>
  ${topText}
  ${legendRow}
  ${dayRects}
</svg>
`;

  // Return the SVG with correct headers
  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
