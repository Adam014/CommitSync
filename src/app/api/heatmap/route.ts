import { NextResponse } from "next/server";
import { format } from "date-fns";
import { getColor } from "@/utils/utils";
import {
  fetchEvents,
  legendCounts,
  getCurrentMonthYear,
  calculateTotalEvents,
} from "@/utils/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const github = searchParams.get("github") || "";
  const gitlab = searchParams.get("gitlab") || "";
  const mode = searchParams.get("mode") || "light";
  const darkMode = mode === "dark";
  const bgParam = searchParams.get("bg");
  const defaultBg = darkMode ? "#0a0a0a" : "#f4f8d3";
  const bgColor = bgParam || defaultBg;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const dayCounts = await fetchEvents(
    github,
    gitlab,
    currentYear,
    currentMonth,
  );
  const totalEvents = calculateTotalEvents(dayCounts);
  const currentMonthYear = getCurrentMonthYear();

  const topPadding = 20;
  const lineHeight = 16;
  const legendHeight = 40;
  const squareSize = 30;
  const spacing = 2;

  const startWeekday = new Date(currentYear, currentMonth, 1).getDay();
  const totalCells = startWeekday + daysInMonth;
  const weeks = Math.ceil(totalCells / 7);
  const gridWidth = weeks * (squareSize + spacing);
  const gridHeight = 7 * (squareSize + spacing);
  const svgWidth = Math.max(gridWidth, 240);
  const svgHeight = topPadding + lineHeight + legendHeight + gridHeight + 20;

  const topText = `<text x="0" y="${topPadding}" font-size="14" font-family="sans-serif" fill="${darkMode ? "#ededed" : "#171717"}">
    ${currentMonthYear}    ${totalEvents} event${totalEvents !== 1 ? "s" : ""}
  </text>`;

  const legendY = topPadding + lineHeight + 10;
  let legendSquares = "";
  const legendSquareSize = 20;
  let lx = 40;
  legendCounts.forEach((val) => {
    const color = getColor(val, darkMode);
    legendSquares += `<rect x="${lx}" y="${legendY}" width="${legendSquareSize}" height="${legendSquareSize}" fill="${color}" rx="2" ry="2" />\n`;
    lx += legendSquareSize + 4;
  });
  const legendTextColor = darkMode ? "#ededed" : "#171717";
  const legendRow = `
    <text x="0" y="${legendY + 15}" font-size="14" font-family="sans-serif" fill="${legendTextColor}">Less</text>
    ${legendSquares}
    <text x="${lx}" y="${legendY + 15}" font-size="14" font-family="sans-serif" fill="${legendTextColor}">More</text>
  `;

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
      </rect>\n`;
      const textX = x + squareSize / 2;
      const textY = y + squareSize / 2 + 4;
      dayRects += `<text x="${textX}" y="${textY}" font-size="10" font-family="sans-serif" fill="#ffffff" text-anchor="middle" alignment-baseline="middle">
        ${dayCounter}
      </text>\n`;
      dayCounter++;
    } else {
      dayRects += `<rect x="${x}" y="${y}" width="${squareSize}" height="${squareSize}" fill="transparent" />\n`;
    }
  }

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
