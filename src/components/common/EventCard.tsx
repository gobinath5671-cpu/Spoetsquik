"use client";

import { GlassCard } from "./GlassCard";
import { StatusBadge } from "./UI";
import { useUIStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { getSportIcon, formatDate, cn } from "@/lib/utils";
import { Calendar, MapPin, Clock, Bookmark, BookmarkCheck } from "lucide-react";
import { useState } from "react";
import { api, EventItem } from "@/lib/api";

interface EventCardProps {
  event: EventItem;
  onBookmarkToggle?: (saved: boolean) => void;
  saved?: boolean;
}

export function EventCard({ event, onBookmarkToggle, saved: initialSaved }: EventCardProps) {
  const { navigate, pushToast } = useUIStore();
  const authUser = useAuthStore((s) => s.user);
  const [saved, setSaved] = useState(initialSaved ?? false);

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!authUser) {
      pushToast({ type: "info", message: "Please login to bookmark events." });
      return;
    }
    const profileRes = await api<{ savedEvents: string }>("/api/users/profile");
    if (!profileRes.success || !profileRes.data) return;
    let savedArr: string[] = [];
    try {
      savedArr = JSON.parse(profileRes.data.savedEvents || "[]");
    } catch {
      savedArr = [];
    }
    const isSaved = savedArr.includes(event.id);
    const next = isSaved
      ? savedArr.filter((id) => id !== event.id)
      : [...savedArr, event.id];
    await api("/api/users/profile", {
      method: "PUT",
      body: JSON.stringify({ savedEvents: JSON.stringify(next) }),
    });
    setSaved(!isSaved);
    onBookmarkToggle?.(!isSaved);
    pushToast({
      type: "success",
      message: !isSaved ? "Event bookmarked." : "Bookmark removed.",
    });
  };

  const sports = event.sportsAndGames || [];
  const poster = event.eventPoster;

  return (
    <GlassCard
      liquid
      className="p-0 h-full flex flex-col cursor-pointer group transition-transform duration-300 hover:-translate-y-1"
      onClick={() => navigate("user-event-detail", { id: event.id })}
    >
      {/* Poster / placeholder */}
      <div className="relative h-40 overflow-hidden rounded-t-2xl bg-muted">
        {poster ? (
          <img
            src={poster}
            alt={event.eventName}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-grid">
            <span className="text-5xl">{getSportIcon(sports[0] || "")}</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="glass-card !rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-wider">
            {event.collegeName}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <StatusBadge status={event.status} />
        </div>
        {authUser && authUser.role === "student" && (
          <button
            type="button"
            aria-label={saved ? "Remove bookmark" : "Bookmark event"}
            onClick={toggleBookmark}
            className="absolute bottom-3 right-3 w-9 h-9 rounded-full glass-card flex items-center justify-center hover:scale-110 transition-transform"
          >
            {saved ? (
              <BookmarkCheck className="w-4 h-4" strokeWidth={2} />
            ) : (
              <Bookmark className="w-4 h-4" strokeWidth={2} />
            )}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-display text-2xl leading-tight tracking-wide line-clamp-2">
          {event.eventName}
        </h3>

        <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {formatDate(event.eventDate)}
          </span>
          {event.reportingTime && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> {event.reportingTime}
            </span>
          )}
        </div>

        {event.venue && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
        )}

        {/* Sport tags */}
        <div className="flex flex-wrap gap-1.5 mt-1">
          {sports.slice(0, 3).map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border border-border bg-background/40"
            >
              <span>{getSportIcon(s)}</span>
              {s}
            </span>
          ))}
          {sports.length > 3 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full text-muted-foreground">
              +{sports.length - 3} more
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-3">
          <span
            className={cn(
              "text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded",
              event.entryFeeIsFree
                ? "bg-foreground text-background"
                : "border border-border"
            )}
          >
            {event.entryFeeIsFree
              ? "FREE"
              : `₹${event.entryFeePerPlayer || event.entryFeePerTeam}`}
          </span>
          <span className="text-xs font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
            View Details →
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
