"use client";

import React, { useState, useEffect } from "react";
import {
  CommitEvent,
  GitHubCommit,
  GitHubEvent,
  GitLabEvent,
} from "@/types/types";

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [gitHubUsername, setGitHubUsername] = useState("");
  const [gitLabUsername, setGitLabUsername] = useState("");
  const [loading, setLoading] = useState(false);

  // Set mounted and theme based on browser preference.
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
        darkMode ? "dark" : "light",
      );
    }
  }, [darkMode, mounted]);

  // Handler to fetch events for the current month.
  async function handleFetchCommits(
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    e.preventDefault();
    setLoading(true);
    const allEvents: CommitEvent[] = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Fetch from GitHub public events
    try {
      const ghRes = await fetch(
        `https://api.github.com/users/${gitHubUsername}/events/public`,
      );
      const ghEvents: GitHubEvent[] = await ghRes.json();

      // Process each event if it occurs in the current month.
      ghEvents.forEach((event: GitHubEvent) => {
        const eventDate = new Date(event.created_at);
        if (
          eventDate.getMonth() === currentMonth &&
          eventDate.getFullYear() === currentYear
        ) {
          // If it's a PushEvent, include details for each commit.
          if (event.type === "PushEvent" && event.payload.commits) {
            event.payload.commits.forEach((commit: GitHubCommit) => {
              allEvents.push({
                platform: "GitHub",
                type: event.type,
                message: commit.message,
                sha: commit.sha,
                repo: event.repo?.name || "Unknown repo",
                date: eventDate,
              });
            });
          } else {
            // For other events, record a general summary.
            allEvents.push({
              platform: "GitHub",
              type: event.type,
              message:
                event.payload.action ||
                event.payload.description ||
                "No message",
              repo: event.repo?.name || "Unknown repo",
              date: eventDate,
            });
          }
        }
      });
    } catch (err) {
      console.error("Error fetching GitHub events:", err);
    }

    // Fetch from GitLab with token from env variables.
    try {
      const gitlabToken = process.env.NEXT_PUBLIC_GITLAB_TOKEN;
      // Get GitLab user ID from the username.
      const glUserRes = await fetch(
        `https://gitlab.com/api/v4/users?username=${gitLabUsername}`,
        {
          headers: {
            "Private-Token": gitlabToken || "",
          },
        },
      );
      const glUsers = await glUserRes.json();
      if (glUsers.length > 0) {
        const userId = glUsers[0].id;
        // Fetch events for that user.
        const glEventsRes = await fetch(
          `https://gitlab.com/api/v4/users/${userId}/events`,
          {
            headers: {
              "Private-Token": gitlabToken || "",
            },
          },
        );
        const glEvents: GitLabEvent[] = await glEventsRes.json();
        glEvents.forEach((event: GitLabEvent) => {
          const eventDate = new Date(event.created_at);
          if (
            eventDate.getMonth() === currentMonth &&
            eventDate.getFullYear() === currentYear
          ) {
            // For GitLab events, use action_name or title for a summary.
            allEvents.push({
              platform: "GitLab",
              type: event.action_name || "Event",
              message: event.title || "No message",
              repo: event.project_id
                ? `Project ${event.project_id}`
                : "Unknown",
              date: eventDate,
            });
          }
        });
      }
    } catch (err) {
      console.error("Error fetching GitLab events:", err);
    }

    // Log the monthly events to the console for confirmation.
    console.log("Monthly events for the current month:", allEvents);
    setLoading(false);
  }

  if (!mounted) return null;

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-foreground)] min-h-screen relative">
      <button
        onClick={() => setDarkMode((prev) => !prev)}
        className={`absolute top-[10px] left-[10px] py-2 px-3 rounded cursor-pointer ${
          darkMode ? "bg-[#ccc] text-[#333]" : "bg-[#333] text-[#fff]"
        }`}
      >
        {darkMode ? "☀️" : "🌙"}
      </button>
      <div className="p-8">
        <h1 className="p-12 text-2xl">Welcome internet explorer</h1>
        <p className="pl-12">
          In a realm where code is alchemy, this project conjures an enigmatic
          tapestry-
          <br />
          merging the secret whispers of GitHub and GitLab into one mystical
          graph.
          <br />
          It anonymously unveils the hidden rhythm of your commit magic, a
          silent incantation echoing through the digital ether.
        </p>
        <form onSubmit={handleFetchCommits} className="space-y-4 mb-6 ml-12">
          <div>
            <label htmlFor="github" className="block mb-1 mt-4">
              GitHub Username
            </label>
            <input
              type="text"
              id="github"
              value={gitHubUsername}
              onChange={(e) => setGitHubUsername(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter your GitHub username"
            />
          </div>
          <div>
            <label htmlFor="gitlab" className="block mb-1 mt-4">
              GitLab Username
            </label>
            <input
              type="text"
              id="gitlab"
              value={gitLabUsername}
              onChange={(e) => setGitLabUsername(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter your GitLab username"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white py-2 px-4 rounded cursor-pointer"
          >
            {loading ? "Fetching..." : "Fetch Monthly Events"}
          </button>
        </form>
      </div>
    </div>
  );
}
