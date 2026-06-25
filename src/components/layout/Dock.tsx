"use client";

import { useUIStore, ViewName } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";
import {
  Home,
  CalendarDays,
  Ticket,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  PlusCircle,
  ListChecks,
  ClipboardList,
  Trophy,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface DockItem {
  icon: React.ElementType;
  label: string;
  view?: ViewName;
  action?: () => void;
}

export function Dock() {
  const { view, navigate } = useUIStore();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  if (!user) return null;

  const isAdmin = user.role === "admin";

  const items: DockItem[] = isAdmin
    ? [
        { icon: LayoutDashboard, label: "Dashboard", view: "admin-dashboard" },
        { icon: PlusCircle, label: "Add Event", view: "admin-add-event" },
        { icon: ListChecks, label: "All Events", view: "admin-events" },
        { icon: ClipboardList, label: "Registrations", view: "admin-registrations" },
        {
          icon: LogOut,
          label: "Logout",
          action: () => {
            fetch("/api/auth/logout", { method: "POST" }).finally(() => {
              logout();
              navigate("login");
              router.refresh();
            });
          },
        },
      ]
    : [
        { icon: Home, label: "Home", view: "user-home" },
        { icon: CalendarDays, label: "Events", view: "user-events" },
        { icon: Ticket, label: "My Registrations", view: "user-my-registrations" },
        { icon: UserIcon, label: "Profile", view: "user-profile" },
        {
          icon: LogOut,
          label: "Logout",
          action: () => {
            fetch("/api/auth/logout", { method: "POST" }).finally(() => {
              logout();
              navigate("login");
              router.refresh();
            });
          },
        },
      ];

  return (
    <nav className="dock" aria-label="Primary navigation">
      {/* Brand marker */}
      <div className="flex items-center justify-center w-9 h-9 mr-1 rounded-lg" aria-hidden>
        <Trophy className="w-4 h-4" strokeWidth={2.5} />
      </div>
      <div className="w-px h-7 self-center bg-border mx-0.5" aria-hidden />
      {items.map((item, idx) => {
        const Icon = item.icon;
        const active = item.view && view === item.view;
        return (
          <button
            key={idx}
            type="button"
            aria-label={item.label}
            className={cn("dock-icon", active && "active")}
            onClick={() => {
              if (item.action) item.action();
              else if (item.view) navigate(item.view);
            }}
          >
            <Icon className="w-5 h-5" strokeWidth={2} />
            <span className="dock-label">{item.label}</span>
            <span className="dock-dot" />
          </button>
        );
      })}
    </nav>
  );
}
