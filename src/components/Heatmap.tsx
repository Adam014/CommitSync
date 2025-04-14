import { HeatmapProps } from "../types/types";
import { getColor } from "@/stores/utils";
import { format, startOfMonth, getDaysInMonth } from "date-fns";
import React from "react";

const Heatmap: React.FC<HeatmapProps> = ({ dayCounts, darkMode }) => {
  const today = new Date();
  const startMonth = startOfMonth(today);
  const daysInMonth = getDaysInMonth(today);
  const startWeekday = startMonth.getDay();

  const totalCells = startWeekday + daysInMonth;
  const weeks = Math.ceil(totalCells / 7);
  let dayCounter = 1;
  const grid: React.ReactElement[] = [];

  for (let week = 0; week < weeks; week++) {
    const weekCells = [];
    for (let day = 0; day < 7; day++) {
      const cellIndex = week * 7 + day;
      if (cellIndex < startWeekday || dayCounter > daysInMonth) {
        weekCells.push(
          <div
            key={`empty-${cellIndex}`}
            style={{
              width: "30px",
              height: "30px",
              margin: "2px",
              backgroundColor: "transparent",
            }}
          />,
        );
      } else {
        const currentDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          dayCounter,
        );
        const dateKey = format(currentDate, "yyyy-MM-dd");
        const count = dayCounts[dateKey] || 0;
        weekCells.push(
          <div
            key={dateKey}
            title={`Date: ${dateKey} — ${count} event${count !== 1 ? "s" : ""}`}
            style={{
              width: "30px",
              height: "30px",
              margin: "2px",
              backgroundColor: getColor(count, darkMode),
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "10px",
              borderRadius: "4px",
              transition: "background-color 0.3s ease",
              cursor: "default",
            }}
          >
            {dayCounter}
          </div>,
        );
        dayCounter++;
      }
    }
    grid.push(
      <div key={week} style={{ display: "flex" }}>
        {weekCells}
      </div>,
    );
  }
  return <div>{grid}</div>;
};

export default Heatmap;
