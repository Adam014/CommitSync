"use client";
import { useEffect, ReactNode } from "react";
import { useStore } from "@/stores/store";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { darkMode, setDarkMode, isEmbed, setIsEmbed, mounted, setMounted } =
    useStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const embedParam = params.get("embed") === "true";

    if (embedParam) {
      setIsEmbed(true);
      setDarkMode(params.get("theme") === "dark");
      setMounted(true);
      return; // skip system‑pref entirely
    }

    // non‑embed: watch system preference
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setDarkMode(mq.matches);
    const handler = (e: MediaQueryListEvent) => setDarkMode(e.matches);
    mq.addEventListener("change", handler);
    setMounted(true);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute(
        "data-theme",
        darkMode ? "dark" : "light",
      );
    }
  }, [darkMode, mounted]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-foreground)] min-h-screen relative">
      {/* → hide the toggle inside the iframe */}
      {!isEmbed && (
        <button
          onClick={toggleDarkMode}
          className="absolute top-2 left-2 py-2 px-3 rounded cursor-pointer"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      )}
      {children}
    </div>
  );
}
