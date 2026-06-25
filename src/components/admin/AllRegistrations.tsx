"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  ArrowLeftCircle,
  Trophy,
  User,
  Phone,
  HeartPulse,
  CreditCard,
  QrCode,
  Users as UsersIcon,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useUIStore } from "@/store/ui-store";
import { api, EventItem, RegistrationItem } from "@/lib/api";
import {
  cn,
  downloadTextFile,
  formatDate,
  formatDateTime,
  getSportIcon,
} from "@/lib/utils";

const PAGE_SIZE = 10;
const STATUS_FILTERS = ["all", "pending", "approved", "rejected"] as const;

export function AllRegistrations() {
  const { view, params, navigate, pushToast } = useUIStore();
  const isPerEvent = view === "admin-event-registrations" && !!params.id;
  const eventId = params.id;

  const [loading, setLoading] = useState(true);
  const [regs, setRegs] = useState<RegistrationItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [event, setEvent] = useState<EventItem | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [detailReg, setDetailReg] = useState<RegistrationItem | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch list of events for the filter dropdown (only on master view)
  useEffect(() => {
    if (isPerEvent) return;
    (async () => {
      const res = await api<EventItem[]>("/api/events?sortBy=createdAt&order=desc");
      if (res.success && res.data) setEvents(res.data);
    })();
  }, [isPerEvent]);

  // Fetch event details (per-event view)
  useEffect(() => {
    if (!isPerEvent || !eventId) return;
    (async () => {
      const res = await api<EventItem>(`/api/events/${eventId}`);
      if (res.success && res.data) setEvent(res.data);
    })();
  }, [isPerEvent, eventId]);

  const fetchRegistrations = async () => {
    setLoading(true);
    let path: string;
    if (isPerEvent && eventId) {
      path = `/api/registrations/${eventId}`;
    } else {
      const p = new URLSearchParams();
      if (statusFilter !== "all") p.set("status", statusFilter);
      if (eventFilter !== "all") p.set("eventId", eventFilter);
      if (search.trim()) p.set("search", search.trim());
      path = `/api/registrations${p.toString() ? `?${p.toString()}` : ""}`;
    }
    const res = await api<RegistrationItem[]>(path);
    if (res.success && res.data) {
      setRegs(res.data);
    } else {
      pushToast({
        type: "error",
        message: res.message || "Failed to load registrations.",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      (async () => {
        let path: string;
        if (isPerEvent && eventId) {
          path = `/api/registrations/${eventId}`;
        } else {
          const p = new URLSearchParams();
          if (statusFilter !== "all") p.set("status", statusFilter);
          if (eventFilter !== "all") p.set("eventId", eventFilter);
          if (search.trim()) p.set("search", search.trim());
          path = `/api/registrations${
            p.toString() ? `?${p.toString()}` : ""
          }`;
        }
        setLoading(true);
        const res = await api<RegistrationItem[]>(path);
        if (cancelled) return;
        if (res.success && res.data) {
          setRegs(res.data);
        } else {
          pushToast({
            type: "error",
            message: res.message || "Failed to load registrations.",
          });
        }
        setLoading(false);
      })();
    }, search ? 350 : 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [
    isPerEvent,
    eventId,
    statusFilter,
    eventFilter,
    search,
    pushToast,
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search, statusFilter, eventFilter, isPerEvent, eventId]);

  // Client-side filtering for per-event view (since the per-event API returns all)
  const filtered = useMemo(() => {
    let list = regs;
    if (isPerEvent) {
      if (statusFilter !== "all") {
        list = list.filter((r) => r.status === statusFilter);
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(
          (r) =>
            r.fullName.toLowerCase().includes(q) ||
            r.rollNumber.toLowerCase().includes(q) ||
            r.registrationCode.toLowerCase().includes(q)
        );
      }
    }
    return list;
  }, [regs, isPerEvent, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const updateStatus = async (
    reg: RegistrationItem,
    status: "approved" | "rejected" | "pending"
  ) => {
    setActionLoading(reg.id);
    const res = await api(`/api/registrations/${reg.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (res.success) {
      pushToast({
        type: status === "approved" ? "success" : status === "rejected" ? "error" : "info",
        message: `Registration ${status}.`,
      });
      setRegs((arr) =>
        arr.map((r) => (r.id === reg.id ? { ...r, status } : r))
      );
      if (detailReg?.id === reg.id) {
        setDetailReg({ ...detailReg, status });
      }
    } else {
      pushToast({ type: "error", message: res.message || "Update failed." });
    }
    setActionLoading(null);
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      pushToast({ type: "info", message: "No registrations to export." });
      return;
    }
    const headerLines: string[] = [];
    headerLines.push("SPORTSFEST — REGISTRATIONS EXPORT");
    if (event) {
      headerLines.push(
        `Event: ${event.eventName} | ${event.collegeName} | ${formatDate(
          event.eventDate
        )}`
      );
    } else if (eventFilter !== "all") {
      const ev = events.find((e) => e.id === eventFilter);
      if (ev) {
        headerLines.push(
          `Event: ${ev.eventName} | ${ev.collegeName} | ${formatDate(
            ev.eventDate
          )}`
        );
      }
    } else {
      headerLines.push("Event: All Events");
    }
    headerLines.push(`Generated: ${formatDateTime(new Date())}`);
    headerLines.push(
      "═══════════════════════════════════════"
    );

    const bodyLines: string[] = [];
    filtered.forEach((r, idx) => {
      bodyLines.push(`#${idx + 1}`);
      bodyLines.push(`Name: ${r.fullName}`);
      bodyLines.push(`Roll No: ${r.rollNumber}`);
      bodyLines.push(
        `Dept/Year/Sec: ${r.department} ${r.year} ${r.section}`.trim()
      );
      bodyLines.push(`College: ${r.collegeName}`);
      bodyLines.push(
        `Sport: ${r.selectedSport} — ${r.eventCategory}`.replace(/—\s*$/, "")
      );
      if (r.isTeamGame) {
        bodyLines.push(
          `Team: ${r.teamName || "—"} | Captain: ${r.captainName || "—"}`
        );
        if (r.members?.length) {
          bodyLines.push(`Members: ${r.members.join(", ")}`);
        }
      }
      bodyLines.push(`Contact: ${r.contactNumber} | ${r.emailId}`);
      bodyLines.push(
        `Emergency: ${r.emergencyName || "—"} — ${r.emergencyPhone || "—"}${
          r.emergencyRelation ? ` (${r.emergencyRelation})` : ""
        }`
      );
      bodyLines.push(`Blood Group: ${r.bloodGroup || "—"}`);
      bodyLines.push(
        `Payment: ${
          r.isPaid
            ? r.paymentTxnId
              ? `Txn ${r.paymentTxnId}`
              : "PAID"
            : "FREE"
        }`
      );
      bodyLines.push(`Status: ${r.status.toUpperCase()}`);
      bodyLines.push(`Registration Code: ${r.registrationCode}`);
      bodyLines.push(
        "───────────────────────────────────────"
      );
    });

    const content = [...headerLines, ...bodyLines].join("\n");
    const filename = `sportsfest-registrations-${
      event ? event.id.slice(0, 8) : "all"
    }-${new Date().toISOString().slice(0, 10)}.txt`;
    downloadTextFile(filename, content);
    pushToast({
      type: "success",
      message: `Exported ${filtered.length} registrations.`,
    });
  };

  return (
    <div className="min-h-screen pb-32 px-4 sm:px-6 lg:px-8 pt-8 max-w-7xl mx-auto">
      <PageHeader
        title={isPerEvent ? "EVENT REGISTRATIONS" : "ALL REGISTRATIONS"}
        subtitle={
          isPerEvent
            ? event
              ? `${event.eventName} · ${event.collegeName}`
              : "Loading event..."
            : "Review and manage every student registration"
        }
        icon={ClipboardList}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExport}
              className="gap-2"
              disabled={filtered.length === 0}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export TXT</span>
            </Button>
            {isPerEvent ? (
              <Button
                variant="ghost"
                onClick={() => navigate("admin-registrations")}
                className="gap-2"
              >
                <ArrowLeftCircle className="w-4 h-4" />
                <span className="hidden sm:inline">All Registrations</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={() => navigate("admin-dashboard")}
                className="gap-2"
              >
                <ArrowLeftCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            )}
          </div>
        }
      />

      {/* Per-event header banner */}
      {isPerEvent && event && (
        <GlassCard className="p-4 mb-5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 rounded-lg glass-card flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-xl tracking-wide truncate">
                {event.eventName}
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {event.collegeName} · {formatDate(event.eventDate)} ·{" "}
                {event.venue || "Venue TBD"}
              </div>
            </div>
            <Badge variant="outline" className="font-mono">
              {filtered.length} regs
            </Badge>
          </div>
        </GlassCard>
      )}

      {/* Filters */}
      <GlassCard className="p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, roll no, or registration code..."
              className="pl-9"
            />
          </div>

          {!isPerEvent && (
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events.map((ev) => (
                  <SelectItem key={ev.id} value={ev.id}>
                    {ev.eventName.length > 30
                      ? ev.eventName.slice(0, 30) + "…"
                      : ev.eventName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status:
          </span>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider border transition-all",
                statusFilter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-foreground/30 text-muted-foreground"
              )}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Table (desktop) / Cards (mobile) */}
      {loading ? (
        <GlassCard className="p-4">
          <TableSkeleton rows={6} cols={6} />
        </GlassCard>
      ) : paged.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No registrations found"
          description="Try adjusting your filters or wait for students to register."
        />
      ) : (
        <>
          {/* Desktop table */}
          <GlassCard className="p-0 overflow-hidden hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Student</TableHead>
                  <TableHead>Sport</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="pl-4 max-w-[220px]">
                      <div className="font-medium truncate">{r.fullName}</div>
                      <div className="text-xs text-muted-foreground font-mono truncate">
                        {r.rollNumber}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="text-sm">
                        {getSportIcon(r.selectedSport)} {r.selectedSport}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="text-xs truncate">
                        {r.event?.eventName || "—"}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {r.event?.collegeName}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {formatDate(r.appliedAt)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        {r.status !== "approved" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateStatus(r, "approved")}
                            disabled={actionLoading === r.id}
                            title="Approve"
                            className="h-8 w-8 hover:text-foreground"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        {r.status !== "rejected" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateStatus(r, "rejected")}
                            disabled={actionLoading === r.id}
                            title="Reject"
                            className="h-8 w-8 hover:text-destructive"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDetailReg(r)}
                          title="View Details"
                          className="h-8 w-8"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </GlassCard>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {paged.map((r) => (
              <GlassCard key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{r.fullName}</div>
                    <div className="text-xs text-muted-foreground font-mono truncate">
                      {r.rollNumber}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <div className="text-sm mb-1">
                  {getSportIcon(r.selectedSport)} {r.selectedSport}
                </div>
                <div className="text-xs text-muted-foreground mb-1 truncate">
                  {r.event?.eventName || "—"}
                </div>
                <div className="text-xs font-mono text-muted-foreground mb-3">
                  {formatDate(r.appliedAt)}
                </div>
                <div className="flex items-center gap-2">
                  {r.status !== "approved" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatus(r, "approved")}
                      disabled={actionLoading === r.id}
                      className="gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </Button>
                  )}
                  {r.status !== "rejected" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatus(r, "rejected")}
                      disabled={actionLoading === r.id}
                      className="gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDetailReg(r)}
                    className="gap-1 ml-auto"
                  >
                    <Eye className="w-3.5 h-3.5" /> Details
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
                {Array.from({ length: totalPages }).slice(0, 7).map((_, i) => (
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

      {/* Detail Dialog */}
      <Dialog
        open={!!detailReg}
        onOpenChange={(o) => !o && setDetailReg(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="p-6 pb-3">
            <DialogTitle className="font-decorative text-2xl tracking-wide">
              Registration Details
            </DialogTitle>
            <DialogDescription>
              Full profile for {detailReg?.fullName} —{" "}
              {detailReg?.registrationCode}
            </DialogDescription>
          </DialogHeader>
          {detailReg && (
            <ScrollArea className="max-h-[calc(90vh-110px)] px-6 pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* QR Code */}
                <div className="sm:col-span-1">
                  <GlassCard className="p-4 flex flex-col items-center gap-2">
                    <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <QrCode className="w-3 h-3" /> QR Code
                    </div>
                    {detailReg.qrCodeData ? (
                      <img
                        src={detailReg.qrCodeData}
                        alt="Registration QR"
                        className="w-40 h-40 object-contain rounded-lg bg-white p-2"
                      />
                    ) : (
                      <div className="w-40 h-40 rounded-lg glass-card flex items-center justify-center">
                        <QrCode className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}
                    <div className="font-mono text-xs text-center">
                      {detailReg.registrationCode}
                    </div>
                    <StatusBadge status={detailReg.status} />
                  </GlassCard>
                </div>

                {/* Details */}
                <div className="sm:col-span-2 space-y-4">
                  <DetailSection
                    icon={User}
                    title="Student"
                    rows={[
                      ["Name", detailReg.fullName],
                      ["Roll No", detailReg.rollNumber],
                      [
                        "Dept / Year / Sec",
                        `${detailReg.department} ${detailReg.year} ${detailReg.section}`.trim(),
                      ],
                      ["College", detailReg.collegeName],
                    ]}
                  />
                  <DetailSection
                    icon={Trophy}
                    title="Sport & Event"
                    rows={[
                      ["Sport", `${getSportIcon(detailReg.selectedSport)} ${detailReg.selectedSport}`],
                      ["Category", detailReg.eventCategory || "—"],
                      ["Event", detailReg.event?.eventName || "—"],
                      ["Team Game", detailReg.isTeamGame ? "Yes" : "No"],
                    ]}
                  />
                  {detailReg.isTeamGame && (
                    <DetailSection
                      icon={UsersIcon}
                      title="Team"
                      rows={[
                        ["Team Name", detailReg.teamName || "—"],
                        ["Captain", detailReg.captainName || "—"],
                        [
                          "Members",
                          detailReg.members?.length
                            ? detailReg.members.join(", ")
                            : "—",
                        ],
                      ]}
                    />
                  )}
                  <DetailSection
                    icon={Phone}
                    title="Contact"
                    rows={[
                      ["Phone", detailReg.contactNumber || "—"],
                      ["Email", detailReg.emailId || "—"],
                    ]}
                  />
                  <DetailSection
                    icon={HeartPulse}
                    title="Emergency & Medical"
                    rows={[
                      [
                        "Emergency Contact",
                        `${detailReg.emergencyName || "—"} — ${
                          detailReg.emergencyPhone || "—"
                        }${detailReg.emergencyRelation ? ` (${detailReg.emergencyRelation})` : ""}`,
                      ],
                      ["Blood Group", detailReg.bloodGroup || "—"],
                      [
                        "Fitness Confirmed",
                        detailReg.fitnessConfirmed ? "Yes" : "No",
                      ],
                    ]}
                  />
                  <DetailSection
                    icon={CreditCard}
                    title="Payment"
                    rows={[
                      [
                        "Payment Status",
                        detailReg.isPaid ? "PAID" : "FREE / Unpaid",
                      ],
                      ["Transaction ID", detailReg.paymentTxnId || "—"],
                    ]}
                  />
                  <DetailSection
                    icon={Calendar}
                    title="Meta"
                    rows={[
                      ["Applied At", formatDateTime(detailReg.appliedAt)],
                      ["Registration Code", detailReg.registrationCode],
                    ]}
                  />
                </div>
              </div>

              <Separator className="my-5" />

              <div className="flex items-center justify-end gap-2 flex-wrap">
                {detailReg.status !== "approved" && (
                  <Button
                    onClick={() => updateStatus(detailReg, "approved")}
                    disabled={actionLoading === detailReg.id}
                    className="gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </Button>
                )}
                {detailReg.status !== "rejected" && (
                  <Button
                    variant="outline"
                    onClick={() => updateStatus(detailReg, "rejected")}
                    disabled={actionLoading === detailReg.id}
                    className="gap-2 hover:text-destructive"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </Button>
                )}
                {detailReg.status !== "pending" && (
                  <Button
                    variant="ghost"
                    onClick={() => updateStatus(detailReg, "pending")}
                    disabled={actionLoading === detailReg.id}
                    className="gap-2"
                  >
                    Reset to Pending
                  </Button>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailSection({
  icon: Icon,
  title,
  rows,
}: {
  icon: React.ElementType;
  title: string;
  rows: [string, string][];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="glass-card p-3 space-y-1.5">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="flex items-start gap-3 text-sm"
          >
            <span className="text-muted-foreground text-xs font-mono w-32 shrink-0 pt-0.5">
              {k}
            </span>
            <span className="font-medium break-words min-w-0 flex-1">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
