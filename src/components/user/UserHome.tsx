"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Search, Calendar, Sparkles, ChevronRight, X } from "lucide-react";
import { api, EventItem } from "@/lib/api";
import { useUIStore } from "@/store/ui-store";
import { GlassCard } from "@/components/common/GlassCard";
import { EventCard } from "@/components/common/EventCard";
import { EventCardSkeleton } from "@/components/common/Skeletons";
import { getSportIcon, formatDate, cn } from "@/lib/utils";

/* ───────────────────────────────────────────────
   Floating Search Bar with autocomplete
   ─────────────────────────────────────────────── */
export function FloatingSearch() {
  const { navigate, setSearchQuery, searchQuery } = useUIStore();
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<EventItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      debounceRef.current = setTimeout(() => {
        setSuggestions([]);
        setOpen(false);
        setLoading(false);
      }, 0);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const res = await api<EventItem[]>(
        `/api/events?search=${encodeURIComponent(q)}&limit=5`
      );
      if (res.success && res.data) {
        setSuggestions(res.data);
        setOpen(true);
      }
      setLoading(false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const submit = (query: string) => {
    setSearchQuery(query);
    navigate("user-events");
  };

  return (
    <div ref={wrapRef} className="relative w-full max-w-2xl mx-auto">
      <div className="glass-card-liquid glass-card flex items-center gap-2 px-4 py-3 rounded-full">
        <Search className="w-5 h-5 shrink-0 opacity-70" strokeWidth={2} />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q && suggestions.length && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit(q);
          }}
          placeholder="Search events, colleges, sports…"
          className="flex-1 bg-transparent outline-none text-sm md:text-base placeholder:text-muted-foreground"
          aria-label="Search events"
        />
        {q && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQ("");
              setSuggestions([]);
            }}
            className="opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => submit(q)}
          className="bg-foreground text-background rounded-full px-4 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity"
        >
          Search
        </button>
      </div>

      {open && (suggestions.length > 0 || loading) && (
        <div className="absolute top-full mt-2 left-0 right-0 glass-card rounded-2xl overflow-hidden z-30">
          <div className="px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border">
            {loading ? "Searching…" : "Suggestions"}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {suggestions.map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => navigate("user-event-detail", { id: ev.id })}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors text-left"
              >
                <span className="text-xl">
                  {getSportIcon(ev.sportsAndGames?.[0] || "")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {ev.eventName}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground truncate">
                    {ev.collegeName} · {formatDate(ev.eventDate)}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>
            ))}
            {suggestions.length === 0 && !loading && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No matching events.
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => submit(q)}
            className="w-full px-4 py-3 text-xs font-medium border-t border-border hover:bg-accent/50 transition-colors flex items-center justify-center gap-1"
          >
            See all results <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────
   UserHome page
   ─────────────────────────────────────────────── */
export function UserHome() {
  const { navigate } = useUIStore();
  const [latest, setLatest] = useState<EventItem[]>([]);
  const [upcoming, setUpcoming] = useState<EventItem[]>([]);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await api<EventItem[]>(
        "/api/events?sortBy=createdAt&order=desc&limit=6"
      );
      if (res.success && res.data) setLatest(res.data);
      setLoadingLatest(false);
    })();

    (async () => {
      const now = new Date();
      const inAWeek = new Date();
      inAWeek.setDate(now.getDate() + 7);
      const res = await api<EventItem[]>(
        `/api/events?fromDate=${now.toISOString()}&toDate=${inAWeek.toISOString()}&sortBy=eventDate&order=asc&limit=12`
      );
      if (res.success && res.data) setUpcoming(res.data);
      setLoadingUpcoming(false);
    })();
  }, []);

  return (
    <main className="pb-32">
      {/* ── Hero ── */}
      <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden px-4 pt-24 pb-12">
        {/* Background grid + watermark */}
        <div className="absolute inset-0 bg-grid opacity-30" aria-hidden />
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
          aria-hidden
        >
          <span className="font-display text-[28vw] leading-none tracking-tight text-foreground/[0.03] whitespace-nowrap">
            SPORTSFEST
          </span>
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 0%, var(--background) 80%)",
          }}
          aria-hidden
        />

        <div className="relative z-10 w-full max-w-5xl flex flex-col items-center text-center gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 glass-card !rounded-full px-4 py-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]">
              Inter-College Sports Portal
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.9] tracking-wide"
          >
            PLAY. <span className="text-stroke">COMPETE.</span> WIN.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="font-accent italic text-xl sm:text-2xl md:text-3xl text-muted-foreground max-w-2xl"
          >
            Stay updated on every inter-college sports event near you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="w-full mt-4"
          >
            <FloatingSearch />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-3 mt-2"
          >
            <button
              type="button"
              onClick={() => navigate("user-events")}
              className="bg-foreground text-background rounded-full px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Browse All Events
            </button>
            <button
              type="button"
              onClick={() => navigate("user-my-registrations")}
              className="glass-card !rounded-full px-6 py-3 text-sm font-medium hover:bg-accent/50 transition-colors"
            >
              My Registrations
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Latest Events ── */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-8">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">
              Just Added
            </p>
            <h2 className="font-display text-4xl sm:text-5xl tracking-wide">
              Latest Events
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate("user-events")}
            className="text-xs font-mono uppercase tracking-wider inline-flex items-center gap-1 hover:gap-2 transition-all"
          >
            View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {loadingLatest ? (
          <div className="flex gap-5 overflow-x-auto no-scrollbar pb-4 -mx-1 px-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="min-w-[280px] sm:min-w-[320px] max-w-[320px]"
              >
                <EventCardSkeleton />
              </div>
            ))}
          </div>
        ) : latest.length === 0 ? (
          <GlassCard className="p-10 text-center text-muted-foreground">
            No events yet.
          </GlassCard>
        ) : (
          <div className="flex gap-5 overflow-x-auto no-scrollbar pb-4 -mx-1 px-1 snap-x">
            {latest.map((ev) => (
              <div
                key={ev.id}
                className="min-w-[280px] sm:min-w-[320px] max-w-[320px] snap-start"
              >
                <EventCard event={ev} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Upcoming This Week ── */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-16">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">
              Next 7 Days
            </p>
            <h2 className="font-display text-4xl sm:text-5xl tracking-wide">
              Upcoming This Week
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate("user-events")}
            className="text-xs font-mono uppercase tracking-wider inline-flex items-center gap-1 hover:gap-2 transition-all"
          >
            View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {loadingUpcoming ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <GlassCard className="p-10 text-center text-muted-foreground font-accent italic text-lg">
            Nothing on the calendar this week. Check back soon.
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcoming.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default UserHome;
