import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ── SportsFest helpers ── */

const SPORT_ICONS: Record<string, string> = {
  Basketball: "🏀",
  Football: "⚽",
  Soccer: "⚽",
  Volleyball: "🏐",
  "Track & Field": "🏃",
  Baseball: "⚾",
  Swimming: "🏊",
  Badminton: "🏸",
  Tennis: "🎾",
  Cricket: "🏏",
  Table_Tennis: "🏓",
  "Table Tennis": "🏓",
  Chess: "♟️",
  Kabaddi: "🤼",
  Hockey: "🏑",
  Boxing: "🥊",
  Wrestling: "🤼",
  Weightlifting: "🏋️",
  Cycling: "🚴",
  Archery: "🏹",
  Shooting: "🎯",
  Golf: "⛳",
  Rugby: "🏉",
  Handball: "🤾",
  Carrom: "🟫",
};

export function getSportIcon(sport: string): string {
  return SPORT_ICONS[sport] || "🏆";
}

export const DEFAULT_SPORTS = [
  "Basketball",
  "Football",
  "Volleyball",
  "Track & Field",
  "Cricket",
  "Badminton",
  "Tennis",
  "Swimming",
  "Baseball",
  "Kabaddi",
];

/* Sport → category intelligence (spec §9.13) */
export const SPORT_CATEGORIES: Record<string, string[]> = {
  Badminton: ["Singles", "Doubles", "Mixed Doubles"],
  Football: ["Team (11-a-side)", "Team (7-a-side)"],
  Soccer: ["Team (11-a-side)", "Team (7-a-side)"],
  "Track & Field": [
    "100m",
    "200m",
    "400m",
    "800m",
    "1500m",
    "4x100m Relay",
    "Long Jump",
    "High Jump",
    "Shot Put",
    "Javelin Throw",
  ],
  Cricket: ["Team (11-a-side)", "Team (8-a-side)", "Tennis Ball"],
  Basketball: ["5v5", "3v3"],
  Volleyball: ["Team (6-a-side)", "Beach"],
  Tennis: ["Singles", "Doubles", "Mixed Doubles"],
  Swimming: ["50m Freestyle", "100m Freestyle", "200m Freestyle", "Relay"],
  Baseball: ["Team (9-a-side)"],
  Kabaddi: ["Team (7-a-side)"],
  Table_Tennis: ["Singles", "Doubles", "Team"],
  "Table Tennis": ["Singles", "Doubles", "Team"],
  Chess: ["Singles", "Team"],
  Hockey: ["Team (11-a-side)"],
};

export const TEAM_SPORTS = [
  "Football",
  "Soccer",
  "Basketball",
  "Volleyball",
  "Cricket",
  "Kabaddi",
  "Hockey",
  "Baseball",
  "Handball",
  "Rugby",
];

export function isTeamSport(sport: string): boolean {
  return TEAM_SPORTS.includes(sport);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} · ${formatTime(date)}`;
}

/* Generate registration code: SF-2025-00123 */
export function generateRegistrationCode(count: number): string {
  const year = new Date().getFullYear();
  return `SF-${year}-${String(count).padStart(5, "0")}`;
}

/* Countdown helper */
export function getCountdown(target: Date | string) {
  const d = typeof target === "string" ? new Date(target) : target;
  const now = Date.now();
  const diff = d.getTime() - now;
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, expired: false };
}

export function parseJsonArray(str: string): string[] {
  if (!str) return [];
  try {
    const v = JSON.parse(str);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function safeJsonStringifyArray(arr: string[]): string {
  return JSON.stringify(arr || []);
}

export function initials(name: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

/* File → base64 (client-side) */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* Download text file client-side */
export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
