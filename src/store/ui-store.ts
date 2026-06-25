"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "dark" | "light";

/* View identifiers — state-based routing within the single `/` route */
export type ViewName =
  | "login"
  | "register"
  | "user-home"
  | "user-events"
  | "user-event-detail"
  | "user-apply"
  | "user-my-registrations"
  | "user-profile"
  | "admin-dashboard"
  | "admin-add-event"
  | "admin-edit-event"
  | "admin-events"
  | "admin-registrations"
  | "admin-event-registrations";

interface UIState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;

  view: ViewName;
  params: Record<string, string>;
  navigate: (view: ViewName, params?: Record<string, string>) => void;

  /* Search query for events page */
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  /* Mobile filter sheet toggle */
  filtersOpen: boolean;
  setFiltersOpen: (v: boolean) => void;

  /* Toast queue (custom) */
  toasts: ToastItem[];
  pushToast: (t: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
}

export interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        set({ theme: next });
        if (typeof document !== "undefined") {
          if (next === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
          localStorage.setItem("sportsfest-theme", next);
        }
      },
      setTheme: (t) => {
        set({ theme: t });
        if (typeof document !== "undefined") {
          if (t === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
          localStorage.setItem("sportsfest-theme", t);
        }
      },

      view: "login",
      params: {},
      navigate: (view, params = {}) => {
        set({ view, params });
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      },

      searchQuery: "",
      setSearchQuery: (q) => set({ searchQuery: q }),

      filtersOpen: false,
      setFiltersOpen: (v) => set({ filtersOpen: v }),

      toasts: [],
      pushToast: (t) => {
        const id = Math.random().toString(36).slice(2);
        set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
        setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
        }, 3500);
      },
      dismissToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
    }),
    {
      name: "sportsfest-ui",
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
