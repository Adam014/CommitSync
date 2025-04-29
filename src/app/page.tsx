"use client";
import React, { useEffect, useCallback } from "react";
import Heatmap from "@/components/Heatmap";
import Link from "next/link";
import { useStore } from "@/stores/store";
import {
  fetchEvents,
  handleCopy,
  updateEmbedCode,
  legendCounts,
  getCurrentMonthYear,
  calculateTotalEvents,
  getColor,
} from "@/utils/utils";
import Form from "@/components/Form";

export default function Home() {
  const {
    autoSyncEnabled,
    setAutoSyncEnabled,
    embedTheme,
    setEmbedTheme,
    setEmbedCode,
    copied,
    setCopied,
    embedCode,
    darkMode,
    mounted,
    setMounted,
    gitHubUsername,
    setGitHubUsername,
    gitLabUsername,
    setGitLabUsername,
    dayCounts,
    setDayCounts,
    loading,
    setLoading,
    isEmbed,
    setIsEmbed,
  } = useStore();

  const fetchEventsCallback = useCallback(async () => {
    setLoading(true);
    const data = await fetchEvents(gitHubUsername, gitLabUsername);
    setDayCounts(data);
    setLoading(false);
  }, [gitHubUsername, gitLabUsername, setDayCounts, setLoading]);

  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    setIsEmbed(params.get("embed") === "true");
    const githubParam = params.get("github") || "";
    const gitlabParam = params.get("gitlab") || "";
    if (githubParam) setGitHubUsername(githubParam);
    if (gitlabParam) setGitLabUsername(gitlabParam);
    if (params.get("embed") === "true") {
      fetchEventsCallback();
    }
  }, [
    fetchEventsCallback,
    setMounted,
    setIsEmbed,
    setGitHubUsername,
    setGitLabUsername,
  ]);

  useEffect(() => {
    if (!autoSyncEnabled) return;
    const pollingInterval = setInterval(() => {
      fetchEventsCallback();
    }, 60000);
    return () => clearInterval(pollingInterval);
  }, [autoSyncEnabled, fetchEventsCallback]);

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
      fetchEventsCallback();
    }, msUntilMidnight);
    return () => clearTimeout(midnightTimeout);
  }, [autoSyncEnabled, fetchEventsCallback]);

  const currentMonthYear = getCurrentMonthYear();
  const totalEvents = calculateTotalEvents(dayCounts);

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
        <h1 className="pt-16 md:p-12 text-xl md:text-2xl">
          Welcome internet explorer
        </h1>
        <h2 className="mt-4 text-2xl underline md:ml-12">
          1.0 Generate iframe
        </h2>
        <div className="md:ml-12 ml-4 mr-4">
          <Form
            gitHubUsername={gitHubUsername}
            gitLabUsername={gitLabUsername}
            setGitHubUsername={setGitHubUsername}
            setGitLabUsername={setGitLabUsername}
            embedTheme={embedTheme}
            setEmbedTheme={setEmbedTheme}
            loading={loading}
            onSubmit={() => {
              fetchEventsCallback();
              setAutoSyncEnabled(true);
              updateEmbedCode(
                setEmbedCode,
                embedTheme,
                gitHubUsername,
                gitLabUsername,
              );
            }}
          />
          <Link href={"/svg"}>
            <p className="underline pt-4">2.0 Generate SVG</p>
          </Link>
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
            onClick={() => handleCopy(embedCode, setCopied)}
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
