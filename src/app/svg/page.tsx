"use client";

import Link from "next/link";
import { useStore } from "@/stores/store";

export default function SVG() {
  const {
    gitHubUsername,
    gitLabUsername,
    embedTheme,
    setGitHubUsername,
    setGitLabUsername,
    setEmbedTheme,
    bgColor,
    setBgColor,
  } = useStore();

  return (
    <div className="text-center md:text-left">
      <div className="md:p-2">
        <h1 className="pt-16 md:p-12 text-xl md:text-2xl">
          Welcome internet explorer
        </h1>
        <h2 className="mt-4 text-2xl underline md:ml-12">2.0 Generate SVG</h2>
        <div className="md:ml-12 ml-4 mr-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const params = new URLSearchParams({
                github: gitHubUsername,
                gitlab: gitLabUsername,
                mode: embedTheme,
                bg: bgColor,
              });
              window.open(`/api/heatmap?${params.toString()}`, "_blank");
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

            <button
              type="submit"
              className="bg-blue-500 text-white py-2 px-4 rounded cursor-pointer"
            >
              {"Create SVG"}
            </button>
          </form>
          <Link href={"/"}>
            <p className="underline pt-4">1.0 Generate iframe</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
