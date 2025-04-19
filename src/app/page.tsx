"use client";
import React, { useState, useEffect, useCallback } from "react";
import Heatmap from "@/components/Heatmap";
import { format } from "date-fns";
import { getColor } from "@/stores/utils";
import { GitHubCommit, GitLabCommit } from "@/types/types";
import { useTheme } from "@/components/ThemeProvider";

export default function Home() {
  const { darkMode, mounted, setMounted } = useTheme();

  const [dayCounts, setDayCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [gitHubUsername, setGitHubUsername] = useState("");
  const [gitLabUsername, setGitLabUsername] = useState("");
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [isEmbed, setIsEmbed] = useState(false);
  const [embedCode, setEmbedCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [embedTheme, setEmbedTheme] = useState<"light" | "dark">("light");

  const fetchEvents = useCallback(async () => {
    // Exit if neither username is provided
    if (!gitHubUsername && !gitLabUsername) return;

    setLoading(true);

    // Prepare the aggregate object with one key per day in the current month.
    const eventsAggregate: Record<string, number> = {};
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateKey = format(date, "yyyy-MM-dd");
      eventsAggregate[dateKey] = 0;
    }

    // Fetch GitHub commits for the current month if provided.
    if (gitHubUsername) {
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
        const githubQuery = `author:${gitHubUsername} committer-date:${firstDay}..${lastDay}`;
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

    // Fetch GitLab events (which include commits, comments, etc.) for the current month if provided.
    if (process.env.NEXT_PUBLIC_GITLAB_TOKEN && gitLabUsername) {
      try {
        const gitlabToken = process.env.NEXT_PUBLIC_GITLAB_TOKEN;
        // Get user ID from GitLab
        const glUserRes = await fetch(
          `https://gitlab.com/api/v4/users?username=${gitLabUsername}`,
          { headers: { "Private-Token": gitlabToken } },
        );
        const glUsers = await glUserRes.json();
        if (Array.isArray(glUsers) && glUsers.length > 0) {
          const userId = glUsers[0].id;
          // Fetch up to 100 of the user’s most recent events.
          const glEventsRes = await fetch(
            `https://gitlab.com/api/v4/users/${userId}/events?per_page=100`,
            { headers: { "Private-Token": gitlabToken } },
          );
          const glEvents = await glEventsRes.json();
          (glEvents || []).forEach((event: GitLabCommit) => {
            const eventDate = new Date(event.created_at);
            // Only include events that fall within the current month.
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

    setDayCounts(eventsAggregate);
    setLoading(false);
  }, [gitHubUsername, gitLabUsername]);

  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    setIsEmbed(params.get("embed") === "true");
    const githubParam = params.get("github") || "";
    const gitlabParam = params.get("gitlab") || "";
    if (githubParam) setGitHubUsername(githubParam);
    if (gitlabParam) setGitLabUsername(gitlabParam);
    if (params.get("embed") === "true") {
      fetchEvents();
    }
  }, [fetchEvents, setMounted]);

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
      5,
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
    0,
  );
  const legendCounts = [0, 1, 3, 6, 10];

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateEmbedCode = () => {
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
         style="border:none; overflow:hidden; background:transparent;"
         scrolling="no"
         frameborder="0"
       ></iframe>`,
    );
  };

  // Prevent rendering until the component has mounted to avoid hydration errors.
  if (!mounted) return null;

  if (isEmbed) {
    return (
      <div
        className="p-4"
        style={{
          background: "transparent",
          overflow: "hidden",
          color: "white",
        }}
      >
        <div className="mb-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">{currentMonthYear}</span>
            <span className="text-sm">
              {totalEvents} event{totalEvents !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center mt-2">
            <span className="text-sm mr-2">Less</span>
            {legendCounts.map((val, idx) => (
              <div
                key={idx}
                className="w-4 h-4 mx-1"
                style={{
                  backgroundColor: getColor(val, darkMode),
                  borderRadius: "2px",
                }}
              />
            ))}
            <span className="text-sm ml-2">More</span>
          </div>
        </div>
        <Heatmap dayCounts={dayCounts} darkMode={darkMode} />
      </div>
    );
  }

  return (
    <div className="text-center md:text-left">
      <div className="md:p-2">
        <h1 className="pt-16 md:p-12 text-xl md:text-2xl">Welcome internet explorer</h1>
        <h2 className="mt-4 text-2xl underline md:ml-12">1.0 Generate iframe</h2>
        <div className="md:ml-12 ml-4 mr-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchEvents();
              setAutoSyncEnabled(true);
              updateEmbedCode();
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
                className="p-2 border border-gray-300 rounded w-full md:w-1/3"
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
                className="p-2 border border-gray-300 rounded w-full md:w-1/3"
              />
            </div>

            <div className="flex items-center space-x-6 mt-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="embedTheme"
                  value="light"
                  checked={embedTheme === "light"}
                  onChange={() => setEmbedTheme("light")}
                  className="mr-2"
                />
                Light
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="embedTheme"
                  value="dark"
                  checked={embedTheme === "dark"}
                  onChange={() => setEmbedTheme("dark")}
                  className="mr-2"
                />
                Dark
              </label>
            </div>

            <button
              type="submit"
              className="bg-blue-500 text-white py-2 px-4 rounded cursor-pointer"
              disabled={loading}
            >
              {loading ? "Fetching..." : "Fetch Events"}
            </button>
          </form>
          <a href="lol u thought">
            <p className="underline pt-4">
              2.0 Generate SVG link UNDER CONSTRUCTION
            </p>
          </a>
        </div>
      </div>
      <div className="md:ml-2">
        <div className="md:ml-12 mt-6">
          <h2 className="text-xl">Iframe</h2>
          <div>
            <iframe
              srcDoc={embedCode}
              width="100%"
              height="300"
              style={{
                border: "none",
                overflow: "hidden",
                background: "transparent",
              }}
              scrolling="no"
              title="Embed Heatmap"
            />
          </div>
          <button
            onClick={handleCopy}
            className="mt-6 bg-green-500 text-white py-2 px-4 rounded cursor-pointer"
          >
            Copy iframe
          </button>
          <span
            style={{
              display: "inline-block",
              marginLeft: "10px",
              transition: "opacity 0.3s",
              opacity: copied ? 1 : 0,
            }}
          >
            Copied!
          </span>
        </div>
      </div>
    </div>
  );
}
