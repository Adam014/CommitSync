"use client";
import React from "react";

type FormProps = {
  gitHubUsername: string;
  gitLabUsername: string;
  setGitHubUsername: (value: string) => void;
  setGitLabUsername: (value: string) => void;
  embedTheme: "light" | "dark";
  setEmbedTheme: (value: "light" | "dark") => void;
  loading: boolean;
  bgColor?: string;
  setBgColor?: (value: string) => void;
  onSubmit: () => void;
};

export default function Form({
  gitHubUsername,
  gitLabUsername,
  setGitHubUsername,
  setGitLabUsername,
  embedTheme,
  setEmbedTheme,
  loading,
  bgColor,
  setBgColor,
  onSubmit,
}: FormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
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

      {bgColor !== undefined && setBgColor && (
        <div>
          <label htmlFor="bgColor" className="block mb-1">
            Background Color
          </label>
          <input
            type="color"
            id="bgColor"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="w-12 h-8 p-0 border-none"
          />
        </div>
      )}

      <button
        type="submit"
        className="bg-blue-500 text-white py-2 px-4 rounded cursor-pointer"
        disabled={loading}
      >
        {loading ? "Fetching..." : "Fetch Events"}
      </button>
    </form>
  );
}
