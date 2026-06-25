"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  TrendingUp,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Hourglass,
  Trophy,
  Users,
  ArrowUpRight,
  ListChecks,
} from "lucide-react";
import { GlassCard } from "@/components/common/GlassCard";
import { PageHeader, StatusBadge, EmptyState } from "@/components/common/UI";
import { StatsSkeleton, TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUIStore } from "@/store/ui-store";
import { api, EventItem, RegistrationItem } from "@/lib/api";
import { formatDate, formatDateTime, getSportIcon } from "@/lib/utils";

interface StatsData {
  events: { total: number; upcoming: number; ongoing: number; completed: number };
  registrations: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  users: { total: number };
  recentEvents: EventItem[];
  recentRegistrations: RegistrationItem[];
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <GlassCard
      liquid
      glow={accent}
      className="p-5 flex flex-col gap-2 transition-transform duration-300 hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <div className="font-display text-5xl leading-none tracking-wide">
        {value}
      </div>
    </GlassCard>
  );
}

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4">
      <h2 className="font-decorative text-2xl sm:text-3xl tracking-wide">
        {title}
      </h2>
      {action}
    </div>
  );
}

export function AdminDashboard() {
  const { navigate, pushToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await api<StatsData>("/api/stats");
      if (cancelled) return;
      if (res.success && res.data) {
        setStats(res.data);
      } else {
        pushToast({
          type: "error",
          message: res.message || "Failed to load dashboard stats.",
        });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [pushToast]);

  return (
    <div className="min-h-screen pb-32 px-4 sm:px-6 lg:px-8 pt-8 max-w-7xl mx-auto">
      <PageHeader
        title="ADMIN DASHBOARD"
        subtitle="Command center for SportsFest operations"
        icon={LayoutDashboard}
        action={
          <div className="flex gap-2">
            <Button
              onClick={() => navigate("admin-add-event")}
              className="gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Add Event</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("admin-registrations")}
              className="gap-2"
            >
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Registrations</span>
            </Button>
          </div>
        }
      />

      {/* Events stats row */}
      <section className="mb-8">
        <SectionHeader title="Events Overview" />
        {loading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              label="Total Events"
              value={stats?.events.total ?? 0}
              icon={Trophy}
              accent
            />
            <StatCard
              label="Upcoming"
              value={stats?.events.upcoming ?? 0}
              icon={CalendarDays}
            />
            <StatCard
              label="Ongoing"
              value={stats?.events.ongoing ?? 0}
              icon={Hourglass}
            />
            <StatCard
              label="Completed"
              value={stats?.events.completed ?? 0}
              icon={CheckCircle2}
            />
          </div>
        )}
      </section>

      {/* Registrations stats row */}
      <section className="mb-10">
        <SectionHeader title="Registrations Overview" />
        {loading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              label="Total Registrations"
              value={stats?.registrations.total ?? 0}
              icon={Users}
              accent
            />
            <StatCard
              label="Pending"
              value={stats?.registrations.pending ?? 0}
              icon={Hourglass}
            />
            <StatCard
              label="Approved"
              value={stats?.registrations.approved ?? 0}
              icon={CheckCircle2}
            />
            <StatCard
              label="Rejected"
              value={stats?.registrations.rejected ?? 0}
              icon={XCircle}
            />
          </div>
        )}
      </section>

      {/* Quick stats banner */}
      {!loading && stats && (
        <GlassCard className="p-4 mb-10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-mono">
              {stats.users.total} registered students ·{" "}
              {stats.registrations.total} total registrations ·{" "}
              {stats.events.total} live events
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("admin-events")}
            className="gap-1 font-mono text-xs"
          >
            MANAGE EVENTS
            <ArrowUpRight className="w-3 h-3" />
          </Button>
        </GlassCard>
      )}

      {/* Recent events + registrations side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events */}
        <section>
          <SectionHeader
            title="Recent Events"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("admin-events")}
                className="gap-1 text-xs font-mono"
              >
                VIEW ALL
                <ArrowUpRight className="w-3 h-3" />
              </Button>
            }
          />
          <GlassCard className="p-0 overflow-hidden">
            {loading ? (
              <div className="p-4">
                <TableSkeleton rows={5} cols={3} />
              </div>
            ) : stats?.recentEvents?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">College / Event</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="pr-4">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentEvents.slice(0, 5).map((ev) => (
                    <TableRow
                      key={ev.id}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate("admin-edit-event", { id: ev.id })
                      }
                    >
                      <TableCell className="pl-4 max-w-[260px]">
                        <div className="font-medium truncate">
                          {ev.eventName}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {ev.collegeName}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {formatDate(ev.eventDate)}
                      </TableCell>
                      <TableCell className="pr-4">
                        <StatusBadge status={ev.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={Trophy}
                  title="No events yet"
                  description="Create your first event to get started."
                  action={
                    <Button
                      size="sm"
                      onClick={() => navigate("admin-add-event")}
                      className="gap-2"
                    >
                      <PlusCircle className="w-4 h-4" /> Add Event
                    </Button>
                  }
                />
              </div>
            )}
          </GlassCard>
        </section>

        {/* Recent Registrations */}
        <section>
          <SectionHeader
            title="Recent Registrations"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("admin-registrations")}
                className="gap-1 text-xs font-mono"
              >
                VIEW ALL
                <ArrowUpRight className="w-3 h-3" />
              </Button>
            }
          />
          <GlassCard className="p-0 overflow-hidden">
            {loading ? (
              <div className="p-4">
                <TableSkeleton rows={5} cols={4} />
              </div>
            ) : stats?.recentRegistrations?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Student</TableHead>
                    <TableHead>Sport</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead className="pr-4">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentRegistrations.slice(0, 5).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="pl-4 max-w-[200px]">
                        <div className="font-medium truncate">
                          {r.fullName}
                        </div>
                        <div className="text-xs text-muted-foreground truncate font-mono">
                          {r.rollNumber}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="text-sm">
                          {getSportIcon(r.selectedSport)} {r.selectedSport}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {formatDateTime(r.appliedAt)}
                      </TableCell>
                      <TableCell className="pr-4">
                        <StatusBadge status={r.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={ListChecks}
                  title="No registrations yet"
                  description="Students will appear here once they register."
                />
              </div>
            )}
          </GlassCard>
        </section>
      </div>

      {/* Quick actions footer */}
      <section className="mt-10">
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GlassCard
            liquid
            className="p-5 cursor-pointer hover:-translate-y-0.5 transition-transform"
            onClick={() => navigate("admin-add-event")}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg glass-card flex items-center justify-center">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display text-lg tracking-wide">
                  ADD EVENT
                </div>
                <div className="text-xs text-muted-foreground font-accent italic">
                  Create a new sports event
                </div>
              </div>
            </div>
          </GlassCard>
          <GlassCard
            liquid
            className="p-5 cursor-pointer hover:-translate-y-0.5 transition-transform"
            onClick={() => navigate("admin-events")}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg glass-card flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display text-lg tracking-wide">
                  MANAGE EVENTS
                </div>
                <div className="text-xs text-muted-foreground font-accent italic">
                  Edit, delete, toggle status
                </div>
              </div>
            </div>
          </GlassCard>
          <GlassCard
            liquid
            className="p-5 cursor-pointer hover:-translate-y-0.5 transition-transform"
            onClick={() => navigate("admin-registrations")}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg glass-card flex items-center justify-center">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display text-lg tracking-wide">
                  REGISTRATIONS
                </div>
                <div className="text-xs text-muted-foreground font-accent italic">
                  Approve, reject & export
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
