"use client";
import React, { useState, useEffect, useCallback } from "react";
import Heatmap from "@/components/Heatmap";
import { format } from "date-fns";
import { getColor } from "@/stores/utils";

export default function Home() {
  const [dayCounts, setDayCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [gitHubUsername, setGitHubUsername] = useState("");
  const [gitLabUsername, setGitLabUsername] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [isEmbed, setIsEmbed] = useState(false);
  const [embedCode, setEmbedCode] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!gitHubUsername && !gitLabUsername) return;
    setLoading(true);
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
    try {
      const firstDay = new Date(currentYear, currentMonth, 1).toISOString();
      const lastDay = new Date(currentYear, currentMonth, daysInMonth, 23, 59, 59).toISOString();
      const githubQuery = `author:${gitHubUsername} committer-date:${firstDay}..${lastDay}`;
      const ghRes = await fetch(
        `https://api.github.com/search/commits?q=${encodeURIComponent(githubQuery)}&per_page=100`,
        {
          headers: {
            Accept: "application/vnd.github.cloak-preview",
            Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_API_KEY}`
          }
        }
      );
      const ghData = await ghRes.json();
      (ghData.items || []).forEach((commit: any) => {
        const commitDate = new Date(commit.commit.author.date);
        const dateKey = format(commitDate, "yyyy-MM-dd");
        if (dateKey in eventsAggregate) {
          eventsAggregate[dateKey] += 1;
        }
      });
    } catch (err) {
      console.error("Error fetching GitHub commits:", err);
    }
    try {
      const gitlabToken = process.env.NEXT_PUBLIC_GITLAB_TOKEN;
      if (gitlabToken && gitLabUsername) {
        const glUserRes = await fetch(
          `https://gitlab.com/api/v4/users?username=${gitLabUsername}`,
          { headers: { "Private-Token": gitlabToken } }
        );
        const glUsers = await glUserRes.json();
        if (Array.isArray(glUsers) && glUsers.length > 0) {
          const userId = glUsers[0].id;
          const glProjectsRes = await fetch(
            `https://gitlab.com/api/v4/users/${userId}/projects?membership=true&per_page=100`,
            { headers: { "Private-Token": gitlabToken } }
          );
          const glProjects = await glProjectsRes.json();
          const since = new Date(currentYear, currentMonth, 1).toISOString();
          const until = new Date(currentYear, currentMonth, daysInMonth, 23, 59, 59).toISOString();
          for (const project of glProjects) {
            try {
              const glCommitsRes = await fetch(
                `https://gitlab.com/api/v4/projects/${project.id}/repository/commits?author=${encodeURIComponent(gitLabUsername)}&since=${since}&until=${until}&per_page=100`,
                { headers: { "Private-Token": gitlabToken } }
              );
              const glCommits = await glCommitsRes.json();
              (glCommits || []).forEach((commit: any) => {
                const commitDate = new Date(commit.created_at);
                const dateKey = format(commitDate, "yyyy-MM-dd");
                if (dateKey in eventsAggregate) {
                  eventsAggregate[dateKey] += 1;
                }
              });
            } catch (err) {
              console.error(`Error fetching GitLab commits for project ${project.id}:`, err);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error fetching GitLab data:", err);
    }
    setDayCounts(eventsAggregate);
    setLoading(false);
  }, [gitHubUsername, gitLabUsername]);

  useEffect(() => {
    setMounted(true);
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setDarkMode(true);
    }
    // Listen for dark/light mode changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const darkModeHandler = (e) => setDarkMode(e.matches);
    mediaQuery.addEventListener("change", darkModeHandler);
    const params = new URLSearchParams(window.location.search);
    setIsEmbed(params.get("embed") === "true");
    const githubParam = params.get("github") || "";
    const gitlabParam = params.get("gitlab") || "";
    if (githubParam) setGitHubUsername(githubParam);
    if (gitlabParam) setGitLabUsername(gitlabParam);
    if (params.get("embed") === "true") {
      fetchEvents();
    }
    return () => mediaQuery.removeEventListener("change", darkModeHandler);
  }, [fetchEvents]);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    }
  }, [darkMode, mounted]);

  useEffect(() => {
    if (!autoSyncEnabled) return;
    const pollingInterval = setInterval(() => { fetchEvents(); }, 60000);
    return () => clearInterval(pollingInterval);
  }, [autoSyncEnabled, fetchEvents]);

  useEffect(() => {
    if (!autoSyncEnabled) return;
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();
    const midnightTimeout = setTimeout(() => { fetchEvents(); }, msUntilMidnight);
    return () => clearTimeout(midnightTimeout);
  }, [autoSyncEnabled, fetchEvents]);

  const currentMonthYear = format(new Date(), "MMMM yyyy");
  const totalEvents = Object.values(dayCounts).reduce((acc, count) => acc + count, 0);
  const legendCounts = [0, 1, 3, 6, 10];

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateEmbedCode = () => {
    const origin = window.location.origin;
    const embedUrl = `${origin}${window.location.pathname}?embed=true&github=${encodeURIComponent(
      gitHubUsername
    )}&gitlab=${encodeURIComponent(gitLabUsername)}`;
    setEmbedCode(
      `<iframe src="${embedUrl}" width="100%" height="300" style="border:none; overflow:hidden; background: transparent;" scrolling="no" frameborder="0"></iframe>`
    );
  };

  if (isEmbed) {
    return (
      <div className="p-4" style={{ background: "transparent", overflow: "hidden" }}>
        <div className="mb-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">{currentMonthYear}</span>
            <span className="text-sm">{totalEvents} event{totalEvents !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center mt-2">
            <span className="text-sm mr-2">Less</span>
            {legendCounts.map((val, idx) => (
              <div key={idx} className="w-4 h-4 mx-1" style={{ backgroundColor: getColor(val, darkMode), borderRadius: "2px" }} />
            ))}
            <span className="text-sm ml-2">More</span>
          </div>
        </div>
        <Heatmap dayCounts={dayCounts} darkMode={darkMode} />
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-foreground)] min-h-screen relative">
      <button onClick={() => setDarkMode(prev => !prev)} className="absolute top-2 left-2 py-2 px-3 rounded cursor-pointer">
        {darkMode ? "☀️" : "🌙"}
      </button>
      <div>
        <h1 className="p-12 text-2xl">Welcome internet explorer</h1>
        <p className="pl-12">
          In a realm where code is alchemy, this project conjures an enigmatic tapestry—merging the secret whispers
          of GitHub and GitLab into one mystical graph. It anonymously unveils the hidden rhythm of your commit magic,
          displaying every creation, deletion, comment, and push across the current month.
        </p>
        <div className="ml-12 mb-6">
          <form onSubmit={(e) => {
              e.preventDefault();
              fetchEvents();
              setAutoSyncEnabled(true);
              updateEmbedCode();
            }} className="space-y-4 mt-8">
            <div>
              <label htmlFor="github" className="block mb-1">GitHub Username</label>
              <input
                type="text"
                id="github"
                value={gitHubUsername}
                onChange={(e) => setGitHubUsername(e.target.value)}
                placeholder="Enter your GitHub username"
                className="p-2 border border-gray-300 rounded w-1/3"
              />
            </div>
            <div>
              <label htmlFor="gitlab" className="block mb-1">GitLab Username</label>
              <input
                type="text"
                id="gitlab"
                value={gitLabUsername}
                onChange={(e) => setGitLabUsername(e.target.value)}
                placeholder="Enter your GitLab username"
                className="p-2 border border-gray-300 rounded w-1/3"
              />
            </div>
            <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded cursor-pointer" disabled={loading}>
              {loading ? "Fetching..." : "Fetch Events"}
            </button>
          </form>
        </div>
      </div>
      <div>
        {/* <div className="mb-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">{currentMonthYear}</span>
            <span className="text-sm">{totalEvents} event{totalEvents !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center mt-2">
            <span className="text-sm mr-2">Less</span>
            {legendCounts.map((val, idx) => (
              <div key={idx} className="w-4 h-4 mx-1" style={{ backgroundColor: getColor(val, darkMode), borderRadius: "2px" }} />
            ))}
            <span className="text-sm ml-2">More</span>
          </div>
        </div>
        <Heatmap dayCounts={dayCounts} darkMode={darkMode} /> */}
        <div className="ml-12">
          <h2 className="text-xl mb-2">Embed This Heatmap</h2>
          <iframe srcDoc={embedCode} width="100%" height="300" style={{ border: "none", overflow: "hidden", background: "transparent" }} scrolling="no" title="Embed Heatmap" />
          <button onClick={handleCopy} className="mt-2 bg-green-500 text-white py-2 px-4 rounded cursor-pointer">
            Copy Embed Code
          </button>
          <span style={{ display: "inline-block", marginLeft: "10px", transition: "opacity 0.3s", opacity: copied ? 1 : 0 }}>
            Copied!
          </span>
        </div>
      </div>
    </div>
  );
}
