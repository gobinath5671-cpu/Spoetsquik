"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Trophy,
  PlusCircle,
  Search,
  Pencil,
  Trash2,
  Copy,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  ArrowUpDown,
  RefreshCw,
  ArrowLeftCircle,
} from "lucide-react";
import { GlassCard } from "@/components/common/GlassCard";
import { PageHeader, StatusBadge, EmptyState } from "@/components/common/UI";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUIStore } from "@/store/ui-store";
import { api, EventItem } from "@/lib/api";
import { cn, formatDate, getSportIcon } from "@/lib/utils";

const PAGE_SIZE = 10;

const STATUS_CYCLE: Record<string, string> = {
  upcoming: "ongoing",
  ongoing: "completed",
  completed: "upcoming",
};

export function AllEvents() {
  const { navigate, pushToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"eventDate" | "createdAt">("eventDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search.trim()) params.set("search", search.trim());
    params.set("sortBy", sortBy);
    params.set("order", sortOrder);
    const res = await api<EventItem[]>(`/api/events?${params.toString()}`);
    if (res.success && res.data) {
      setEvents(res.data);
    } else {
      pushToast({
        type: "error",
        message: res.message || "Failed to load events.",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      (async () => {
        const params = new URLSearchParams();
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (search.trim()) params.set("search", search.trim());
        params.set("sortBy", sortBy);
        params.set("order", sortOrder);
        setLoading(true);
        const res = await api<EventItem[]>(
          `/api/events?${params.toString()}`
        );
        if (cancelled) return;
        if (res.success && res.data) {
          setEvents(res.data);
        } else {
          pushToast({
            type: "error",
            message: res.message || "Failed to load events.",
          });
        }
        setLoading(false);
      })();
    }, search ? 350 : 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [statusFilter, sortBy, sortOrder, search, pushToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search, statusFilter]);

  const filtered = useMemo(() => {
    // Status filter is done on backend, but ensure client-side consistency
    return events;
  }, [events]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const toggleStatus = async (ev: EventItem) => {
    const next = STATUS_CYCLE[ev.status] || "upcoming";
    setActionLoading(ev.id);
    const res = await api(`/api/events/${ev.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    if (res.success) {
      pushToast({ type: "success", message: `Status → ${next}` });
      setEvents((arr) =>
        arr.map((e) => (e.id === ev.id ? { ...e, status: next } : e))
      );
    } else {
      pushToast({ type: "error", message: res.message || "Update failed." });
    }
    setActionLoading(null);
  };

  const duplicateEvent = async (ev: EventItem) => {
    setActionLoading(ev.id);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const payload = {
      ...ev,
      eventName: `${ev.eventName} (Copy)`,
      eventDate: futureDate.toISOString(),
      status: "upcoming",
    };
    delete (payload as Partial<EventItem>).id;
    delete (payload as Partial<EventItem>).createdAt;
    delete (payload as Partial<EventItem>).registrationCount;
    const res = await api<EventItem>("/api/events", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setActionLoading(null);
    if (res.success) {
      pushToast({
        type: "success",
        message: "Event duplicated successfully.",
      });
      fetchEvents();
    } else {
      pushToast({ type: "error", message: res.message || "Duplicate failed." });
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setActionLoading(deleteId);
    const res = await api(`/api/events/${deleteId}`, { method: "DELETE" });
    setActionLoading(null);
    if (res.success) {
      pushToast({ type: "success", message: "Event deleted." });
      setEvents((arr) => arr.filter((e) => e.id !== deleteId));
    } else {
      pushToast({ type: "error", message: res.message || "Delete failed." });
    }
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen pb-32 px-4 sm:px-6 lg:px-8 pt-8 max-w-7xl mx-auto">
      <PageHeader
        title="ALL EVENTS"
        subtitle="Manage every SportsFest event in one place"
        icon={Trophy}
        action={
          <Button onClick={() => navigate("admin-add-event")} className="gap-2">
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Add Event</span>
          </Button>
        }
      />

      {/* Filters */}
      <GlassCard className="p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by college or event name..."
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(v) => {
                const [field, order] = v.split("-");
                setSortBy(field as "eventDate" | "createdAt");
                setSortOrder(order as "asc" | "desc");
              }}
            >
              <SelectTrigger className="w-[170px] gap-1">
                <ArrowUpDown className="w-3 h-3" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eventDate-desc">Newest date</SelectItem>
                <SelectItem value="eventDate-asc">Oldest date</SelectItem>
                <SelectItem value="createdAt-desc">Recently added</SelectItem>
                <SelectItem value="createdAt-asc">First added</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchEvents}
              aria-label="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Table (desktop) / Card list (mobile) */}
      {loading ? (
        <GlassCard className="p-4">
          <TableSkeleton rows={6} cols={6} />
        </GlassCard>
      ) : paged.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No events found"
          description="Try adjusting your filters or create a new event."
          action={
            <Button
              onClick={() => navigate("admin-add-event")}
              className="gap-2"
            >
              <PlusCircle className="w-4 h-4" /> Add Event
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <GlassCard className="p-0 overflow-hidden hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">College / Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Sports</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Regs</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((ev) => (
                  <TableRow
                    key={ev.id}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate("admin-edit-event", { id: ev.id })
                    }
                  >
                    <TableCell className="pl-4 max-w-[280px]">
                      <div className="font-medium truncate">
                        {ev.eventName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {ev.collegeName}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {formatDate(ev.eventDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(ev.sportsAndGames || []).slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="text-base"
                            title={s}
                          >
                            {getSportIcon(s)}
                          </span>
                        ))}
                        {(ev.sportsAndGames || []).length > 3 && (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            +{(ev.sportsAndGames || []).length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStatus(ev);
                        }}
                        disabled={actionLoading === ev.id}
                        title="Click to cycle status"
                        className="cursor-pointer disabled:opacity-50"
                      >
                        <StatusBadge status={ev.status} />
                      </button>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-1 text-xs font-mono">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        {ev.registrationCount ?? 0}
                      </div>
                    </TableCell>
                    <TableCell
                      className="pr-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            navigate("admin-event-registrations", {
                              id: ev.id,
                            })
                          }
                          title="View registrations"
                          className="h-8 w-8"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            navigate("admin-edit-event", { id: ev.id })
                          }
                          title="Edit"
                          className="h-8 w-8"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => duplicateEvent(ev)}
                          disabled={actionLoading === ev.id}
                          title="Duplicate"
                          className="h-8 w-8"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(ev.id)}
                          title="Delete"
                          className="h-8 w-8 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </GlassCard>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {paged.map((ev) => (
              <GlassCard key={ev.id} className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{ev.eventName}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {ev.collegeName}
                    </div>
                  </div>
                  <StatusBadge status={ev.status} />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(ev.eventDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {ev.registrationCount ?? 0}
                  </span>
                </div>
                {(ev.sportsAndGames || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(ev.sportsAndGames || []).slice(0, 6).map((s) => (
                      <span key={s} className="text-lg">
                        {getSportIcon(s)}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate("admin-edit-event", { id: ev.id })
                    }
                    className="gap-1"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate("admin-event-registrations", { id: ev.id })
                    }
                    className="gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => duplicateEvent(ev)}
                    disabled={actionLoading === ev.id}
                    className="gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStatus(ev)}
                    disabled={actionLoading === ev.id}
                    className="gap-1 ml-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Status
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(ev.id)}
                    className="gap-1 text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Pagination */}
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between mt-5 flex-wrap gap-3">
              <span className="text-xs font-mono text-muted-foreground">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i}
                    variant={safePage === i + 1 ? "default" : "outline"}
                    size="icon"
                    onClick={() => setPage(i + 1)}
                    className={cn(
                      "h-8 w-8 text-xs font-mono",
                      safePage === i + 1 && "font-bold"
                    )}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="h-8 w-8"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the event and all its registrations.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {actionLoading === deleteId ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer back to dashboard */}
      <div className="mt-8 flex justify-center">
        <Button
          variant="ghost"
          onClick={() => navigate("admin-dashboard")}
          className="gap-2 text-xs font-mono uppercase tracking-wider"
        >
          <ArrowLeftCircle className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
