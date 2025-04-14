"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  format,
  startOfMonth,
  getDaysInMonth,
} from "date-fns";
import {
  CommitEvent,
  GitHubCommit,
  GitHubEvent,
  GitLabEvent,
} from "@/types/types";

interface HeatmapProps {
  dayCounts: Record<string, number>;
  darkMode: boolean;
}

const Heatmap: React.FC<HeatmapProps> = ({ dayCounts, darkMode }) => {
  const today = new Date();
  const startMonth = startOfMonth(today);
  const daysInMonth = getDaysInMonth(today);
  const startWeekday = startMonth.getDay();

  // Calculate how many cells and weeks are needed.
  const totalCells = startWeekday + daysInMonth;
  const weeks = Math.ceil(totalCells / 7);

  let dayCounter = 1;
  const grid: JSX.Element[] = [];

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
          />
        );
      } else {
        const currentDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          dayCounter
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
          </div>
        );
        dayCounter++;
      }
    }
    grid.push(
      <div key={week} style={{ display: "flex" }}>
        {weekCells}
      </div>
    );
  }
  return <div>{grid}</div>;
};

function getColor(count: number, darkMode: boolean): string {
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

export default function Home() {
  const [dayCounts, setDayCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [gitHubUsername, setGitHubUsername] = useState("");
  const [gitLabUsername, setGitLabUsername] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Auto-sync is enabled only after the user manually submits.
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!gitHubUsername && !gitLabUsername) return;
  
    setLoading(true);
    const eventsAggregate: Record<string, number> = {};
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
  
    try {
      const ghRes = await fetch(
        `https://api.github.com/users/${gitHubUsername}/events/public?t=${Date.now()}`
      );
      const ghEvents = await ghRes.json();
      ghEvents.forEach((event: any) => {
        const eventDate = new Date(event.created_at);
        if (
          eventDate.getMonth() === currentMonth &&
          eventDate.getFullYear() === currentYear
        ) {
          const dateKey = format(eventDate, "yyyy-MM-dd");
          if (event.type === "PushEvent" && event.payload?.commits) {
            eventsAggregate[dateKey] =
              (eventsAggregate[dateKey] || 0) + event.payload.commits.length;
          } else {
            eventsAggregate[dateKey] = (eventsAggregate[dateKey] || 0) + 1;
          }
        }
      });
    } catch (err) {
      console.error("Error fetching GitHub events:", err);
    }

    try {
      const gitlabToken = process.env.NEXT_PUBLIC_GITLAB_TOKEN;
      if (gitlabToken && gitLabUsername) {
        const glUserRes = await fetch(
          `https://gitlab.com/api/v4/users?username=${gitLabUsername}`,
          {
            headers: { "Private-Token": gitlabToken },
          }
        );
        const glUsers = await glUserRes.json();
        if (Array.isArray(glUsers) && glUsers.length > 0) {
          const userId = glUsers[0].id;
          const glEventsRes = await fetch(
            `https://gitlab.com/api/v4/users/${userId}/events`,
            {
              headers: { "Private-Token": gitlabToken },
            }
          );
          const glEvents = await glEventsRes.json();
          glEvents.forEach((event: any) => {
            const eventDate = new Date(event.created_at);
            if (
              eventDate.getMonth() === currentMonth &&
              eventDate.getFullYear() === currentYear
            ) {
              const dateKey = format(eventDate, "yyyy-MM-dd");
              eventsAggregate[dateKey] = (eventsAggregate[dateKey] || 0) + 1;
            }
          });
        }
      }
    } catch (err) {
      console.error("Error fetching GitLab events:", err);
    }
  
    setDayCounts(eventsAggregate);
    setLoading(false);
  }, [gitHubUsername, gitLabUsername]);

  useEffect(() => {
    setMounted(true);
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute(
        "data-theme",
        darkMode ? "dark" : "light"
      );
    }
  }, [darkMode, mounted]);

  useEffect(() => {
    if (!autoSyncEnabled) return;
    const pollingInterval = setInterval(() => {
      fetchEvents();
    }, 60000);
    return () => clearInterval(pollingInterval);
  }, [autoSyncEnabled, fetchEvents]);

  useEffect(() => {
    if (!autoSyncEnabled) return;
    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      5
    );
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();
    const midnightTimeout = setTimeout(() => {
      fetchEvents();
    }, msUntilMidnight);
    return () => clearTimeout(midnightTimeout);
  }, [autoSyncEnabled, fetchEvents]);

  const currentMonthYear = format(new Date(), "MMMM yyyy");
  const totalEvents = Object.values(dayCounts).reduce(
    (acc, count) => acc + count,
    0
  );
  const legendCounts = [0, 1, 3, 6, 10]; // Representative counts for legend thresholds.

  if (!mounted) return null;

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-foreground)] min-h-screen relative">
      <button
        onClick={() => setDarkMode((prev) => !prev)}
        className="absolute top-2 left-2 py-2 px-3 rounded cursor-pointer"
      >
        {darkMode ? "☀️" : "🌙"}
      </button>
      <div className="p-8">
        <h1 className="p-12 text-2xl">Welcome internet explorer</h1>
        <p className="pl-12">
          In a realm where code is alchemy, this project conjures an enigmatic
          tapestry-<br />
          merging the secret whispers of GitHub and GitLab into one mystical
          graph.<br />
          It anonymously unveils the hidden rhythm of your commit magic, a silent
          incantation echoing through the digital ether.
        </p>
        <div className="ml-12 mb-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchEvents(); // Fetch instantly on submit.
              setAutoSyncEnabled(true); // Enable auto-sync after manual fetch.
            }}
            className="space-y-4 mt-8"
          >
            <div>
              <label htmlFor="github" className="block mb-1">
                GitHub Username
              </label>
              <input
                type="text"
                id="github"
                value={gitHubUsername}
                onChange={(e) => setGitHubUsername(e.target.value)}
                placeholder="Enter your GitHub username"
                className="p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label htmlFor="gitlab" className="block mb-1">
                GitLab Username
              </label>
              <input
                type="text"
                id="gitlab"
                value={gitLabUsername}
                onChange={(e) => setGitLabUsername(e.target.value)}
                placeholder="Enter your GitLab username"
                className="p-2 border border-gray-300 rounded"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white py-2 px-4 rounded"
              disabled={loading}
            >
              {loading ? "Fetching..." : "Fetch Events"}
            </button>
          </form>
        </div>
        {/* Overview Section */}
        <div className="ml-12 mb-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">{currentMonthYear}</span>
            <span className="text-sm">{totalEvents} event{totalEvents !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center mt-2">
            <span className="text-sm mr-2">Less</span>
            {legendCounts.map((val, idx) => (
              <div
                key={idx}
                className="w-4 h-4 mx-1"
                style={{ backgroundColor: getColor(val, darkMode), borderRadius: "2px" }}
              />
            ))}
            <span className="text-sm ml-2">More</span>
          </div>
        </div>
        {/* Heatmap */}
        <div className="ml-12">
          <Heatmap dayCounts={dayCounts} darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
}
