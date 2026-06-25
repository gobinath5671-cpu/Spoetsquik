"use client";

import { useUIStore } from "@/store/ui-store";
import { Sun, Moon } from "lucide-react";
import { useEffect } from "react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useUIStore();

  // Sync DOM on mount
  useEffect(() => {
    const stored = localStorage.getItem("sportsfest-theme") as "dark" | "light" | null;
    const initial = stored || "dark";
    useUIStore.getState().setTheme(initial);
  }, []);

  return (
    <button
      type="button"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="theme-toggle"
      onClick={toggleTheme}
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5" strokeWidth={2} />
      ) : (
        <Moon className="w-5 h-5" strokeWidth={2} />
      )}
    </button>
  );
}
