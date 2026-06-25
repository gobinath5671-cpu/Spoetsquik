"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Calendar,
  RotateCcw,
} from "lucide-react";
import { api, EventItem } from "@/lib/api";
import { useUIStore } from "@/store/ui-store";
import { GlassCard } from "@/components/common/GlassCard";
import { EventCard } from "@/components/common/EventCard";
import { EventListSkeleton } from "@/components/common/Skeletons";
import { EmptyState } from "@/components/common/UI";
import {
  DEFAULT_SPORTS,
  getSportIcon,
  cn,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Filters {
  status: string;
  targetAudience: string;
  sports: string[];
  format: string;
  fromDate: string;
  toDate: string;
  college: string;
  isFree: string;
  sortBy: string;
  order: string;
}

const DEFAULT_FILTERS: Filters = {
  status: "",
  targetAudience: "",
  sports: [],
  format: "",
  fromDate: "",
  toDate: "",
  college: "",
  isFree: "",
  sortBy: "createdAt",
  order: "desc",
};

function buildQuery(filters: Filters, search: string): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.targetAudience)
    params.set("targetAudience", filters.targetAudience);
  if (filters.sports.length === 1) params.set("sport", filters.sports[0]);
  if (filters.format) params.set("format", filters.format);
  if (filters.fromDate) params.set("fromDate", filters.fromDate);
  if (filters.toDate) params.set("toDate", filters.toDate);
  if (filters.college) params.set("college", filters.college);
  if (filters.isFree) params.set("isFree", filters.isFree);
  if (search) params.set("search", search);
  params.set("sortBy", filters.sortBy);
  params.set("order", filters.order);
  return params.toString();
}

/* ───────────────────────────────────────────────
   Search with autocomplete
   ─────────────────────────────────────────────── */
function EventSearch() {
  const { searchQuery, setSearchQuery } = useUIStore();
  const [q, setQ] = useState(searchQuery);
  const [suggestions, setSuggestions] = useState<EventItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQ(searchQuery);
  }, [searchQuery]);

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

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="glass-card flex items-center gap-2 px-4 py-3 rounded-full">
        <Search className="w-4 h-4 shrink-0 opacity-70" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q && suggestions.length && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setSearchQuery(q);
              setOpen(false);
            }
          }}
          placeholder="Search by event, college…"
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          aria-label="Search events"
        />
        {q && (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => {
              setQ("");
              setSearchQuery("");
            }}
            className="opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
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
                onClick={() => {
                  setQ(ev.eventName);
                  setSearchQuery(ev.eventName);
                  setOpen(false);
                }}
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
                    {ev.collegeName}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────
   Filter panel content (shared between desktop sidebar + mobile sheet)
   ─────────────────────────────────────────────── */
function FilterPanel({
  filters,
  setFilters,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
}) {
  const toggleSport = (sport: string) => {
    const next = filters.sports.includes(sport)
      ? filters.sports.filter((s) => s !== sport)
      : [...filters.sports, sport];
    setFilters({ ...filters, sports: next });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Status */}
      <FilterGroup title="Status">
        <PillRow
          options={["", "upcoming", "ongoing", "completed"]}
          value={filters.status}
          labels={["All", "Upcoming", "Ongoing", "Completed"]}
          onChange={(v) => setFilters({ ...filters, status: v })}
        />
      </FilterGroup>

      {/* Target Audience */}
      <FilterGroup title="Target Audience">
        <PillRow
          options={["", "College", "School"]}
          value={filters.targetAudience}
          labels={["All", "College", "School"]}
          onChange={(v) => setFilters({ ...filters, targetAudience: v })}
        />
      </FilterGroup>

      {/* Sports */}
      <FilterGroup title="Sports">
        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
          {DEFAULT_SPORTS.map((sport) => (
            <label
              key={sport}
              className="flex items-center gap-2.5 cursor-pointer text-sm hover:text-foreground text-muted-foreground"
            >
              <Checkbox
                checked={filters.sports.includes(sport)}
                onCheckedChange={() => toggleSport(sport)}
              />
              <span className="inline-flex items-center gap-1.5">
                <span>{getSportIcon(sport)}</span>
                {sport}
              </span>
            </label>
          ))}
        </div>
      </FilterGroup>

      {/* Tournament Format */}
      <FilterGroup title="Tournament Format">
        <PillRow
          options={["", "Knockout", "League", "Athletics"]}
          value={filters.format}
          labels={["All", "Knockout", "League", "Athletics"]}
          onChange={(v) => setFilters({ ...filters, format: v })}
        />
      </FilterGroup>

      {/* Date Range */}
      <FilterGroup title="Date Range">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] font-mono uppercase text-muted-foreground mb-1">
              From
            </Label>
            <Input
              type="date"
              value={filters.fromDate}
              onChange={(e) =>
                setFilters({ ...filters, fromDate: e.target.value })
              }
              className="text-xs"
            />
          </div>
          <div>
            <Label className="text-[10px] font-mono uppercase text-muted-foreground mb-1">
              To
            </Label>
            <Input
              type="date"
              value={filters.toDate}
              onChange={(e) =>
                setFilters({ ...filters, toDate: e.target.value })
              }
              className="text-xs"
            />
          </div>
        </div>
      </FilterGroup>

      {/* College */}
      <FilterGroup title="College">
        <Input
          value={filters.college}
          onChange={(e) =>
            setFilters({ ...filters, college: e.target.value })
          }
          placeholder="College name…"
          className="text-sm"
        />
      </FilterGroup>

      {/* Entry Fee */}
      <FilterGroup title="Entry Fee">
        <PillRow
          options={["", "free", "paid"]}
          value={filters.isFree}
          labels={["All", "Free", "Paid"]}
          onChange={(v) => setFilters({ ...filters, isFree: v })}
        />
      </FilterGroup>
    </div>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2.5">
        {title}
      </div>
      {children}
    </div>
  );
}

function PillRow({
  options,
  value,
  labels,
  onChange,
}: {
  options: string[];
  value: string;
  labels: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt, i) => (
        <button
          key={opt || "all"}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium border transition-all",
            value === opt
              ? "bg-foreground text-background border-foreground"
              : "border-border hover:bg-accent/50"
          )}
        >
          {labels[i]}
        </button>
      ))}
    </div>
  );
}

/* Active filter chips */
function ActiveChips({
  filters,
  onClear,
  onRemove,
}: {
  filters: Filters;
  onClear: () => void;
  onRemove: (key: keyof Filters, value?: string) => void;
}) {
  const chips: { key: keyof Filters; label: string; value?: string }[] = [];
  if (filters.status)
    chips.push({ key: "status", label: `Status: ${filters.status}` });
  if (filters.targetAudience)
    chips.push({
      key: "targetAudience",
      label: `Audience: ${filters.targetAudience}`,
    });
  filters.sports.forEach((s) =>
    chips.push({ key: "sports", label: s, value: s })
  );
  if (filters.format)
    chips.push({ key: "format", label: `Format: ${filters.format}` });
  if (filters.fromDate)
    chips.push({ key: "fromDate", label: `From: ${filters.fromDate}` });
  if (filters.toDate)
    chips.push({ key: "toDate", label: `To: ${filters.toDate}` });
  if (filters.college)
    chips.push({ key: "college", label: `College: ${filters.college}` });
  if (filters.isFree)
    chips.push({
      key: "isFree",
      label: filters.isFree === "free" ? "Free" : "Paid",
    });

  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {chips.map((c) => (
        <button
          key={`${c.key}-${c.value ?? c.label}`}
          type="button"
          onClick={() => onRemove(c.key, c.value)}
          className="inline-flex items-center gap-1 glass-card !rounded-full pl-3 pr-1.5 py-1 text-xs hover:bg-accent/50 transition-colors"
        >
          {c.label}
          <X className="w-3 h-3" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1"
      >
        <RotateCcw className="w-3 h-3" />
        Clear All
      </button>
    </div>
  );
}

/* ───────────────────────────────────────────────
   UserEvents page
   ─────────────────────────────────────────────── */
export function UserEvents() {
  const { searchQuery, pushToast } = useUIStore();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const query = useMemo(
    () => buildQuery(filters, searchQuery),
    [filters, searchQuery]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await api<EventItem[]>(`/api/events?${query}`);
      if (cancelled) return;
      if (res.success && res.data) {
        setEvents(res.data);
      } else {
        setEvents([]);
        if (res.message && !res.success) {
          pushToast({ type: "error", message: res.message });
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [query, pushToast]);

  const removeFilter = (key: keyof Filters, value?: string) => {
    if (key === "sports" && value) {
      setFilters({
        ...filters,
        sports: filters.sports.filter((s) => s !== value),
      });
    } else {
      setFilters({ ...filters, [key]: "" });
    }
  };

  const clearAll = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <main className="pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-24">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">
            Browse
          </p>
          <h1 className="font-display text-5xl sm:text-6xl tracking-wide leading-none">
            All Events
          </h1>
          <p className="font-accent italic text-lg text-muted-foreground mt-1">
            Filter, search and discover events to register for.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            SORT BY
          </span>
          <Select
            value={`${filters.sortBy}-${filters.order}`}
            onValueChange={(v) => {
              const [sortBy, order] = v.split("-");
              setFilters({ ...filters, sortBy, order });
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">Newest First</SelectItem>
              <SelectItem value="createdAt-asc">Oldest First</SelectItem>
              <SelectItem value="eventDate-asc">Date Ascending</SelectItem>
              <SelectItem value="eventDate-desc">Date Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 max-w-2xl">
        <EventSearch />
      </div>

      {/* Mobile filter toggle + sort */}
      <div className="flex md:hidden items-center gap-2 mb-4">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {filters.sports.length +
                (filters.status ? 1 : 0) +
                (filters.format ? 1 : 0) +
                (filters.targetAudience ? 1 : 0) +
                (filters.isFree ? 1 : 0) +
                (filters.college ? 1 : 0) +
                (filters.fromDate ? 1 : 0) +
                (filters.toDate ? 1 : 0) >
                0 && (
                <span className="ml-1 w-4 h-4 rounded-full bg-foreground text-background text-[10px] flex items-center justify-center">
                  {filters.sports.length +
                    (filters.status ? 1 : 0) +
                    (filters.format ? 1 : 0) +
                    (filters.targetAudience ? 1 : 0) +
                    (filters.isFree ? 1 : 0) +
                    (filters.college ? 1 : 0) +
                    (filters.fromDate ? 1 : 0) +
                    (filters.toDate ? 1 : 0)}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[90%] sm:w-[400px] overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle className="font-display text-3xl tracking-wide">
                Filters
              </SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FilterPanel filters={filters} setFilters={setFilters} />
              <Button
                onClick={() => setSheetOpen(false)}
                className="w-full mt-6"
              >
                Show Results
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <Select
          value={`${filters.sortBy}-${filters.order}`}
          onValueChange={(v) => {
            const [sortBy, order] = v.split("-");
            setFilters({ ...filters, sortBy, order });
          }}
        >
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt-desc">Newest First</SelectItem>
            <SelectItem value="createdAt-asc">Oldest First</SelectItem>
            <SelectItem value="eventDate-asc">Date Ascending</SelectItem>
            <SelectItem value="eventDate-desc">Date Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] lg:grid-cols-[280px_1fr] gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden md:block sticky top-24 self-start">
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-2xl tracking-wide">Filters</h3>
              <button
                type="button"
                onClick={clearAll}
                className="text-[10px] font-mono uppercase text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Clear
              </button>
            </div>
            <FilterPanel filters={filters} setFilters={setFilters} />
          </GlassCard>
        </aside>

        {/* Results */}
        <div>
          <ActiveChips
            filters={filters}
            onClear={clearAll}
            onRemove={removeFilter}
          />

          <div className="flex items-center justify-between mb-4 text-xs font-mono text-muted-foreground">
            <span>
              {loading ? "Loading…" : `${events.length} EVENT${
                events.length === 1 ? "" : "S"
              } FOUND`}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {loading ? (
            <EventListSkeleton count={6} />
          ) : events.length === 0 ? (
            <EmptyState
              icon={ChevronDown}
              title="No events found"
              description="Try adjusting your filters or search query to discover more events."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default UserEvents;
