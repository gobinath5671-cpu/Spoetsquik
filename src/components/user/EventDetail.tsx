"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Trophy,
  Award,
  Phone,
  Mail,
  User,
  Bookmark,
  BookmarkCheck,
  Share2,
  Play,
  CheckCircle2,
  Info,
  Shield,
  Palette,
  DollarSign,
  Gamepad2,
} from "lucide-react";
import { api, EventItem } from "@/lib/api";
import { useUIStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { GlassCard } from "@/components/common/GlassCard";
import { StatusBadge } from "@/components/common/UI";
import { EventCardSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import {
  formatDate,
  formatTime,
  formatDateTime,
  getCountdown,
  getSportIcon,
  isTeamSport,
  parseJsonArray,
  cn,
} from "@/lib/utils";

/* Countdown timer block */
function Countdown({ target }: { target: string }) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const c = getCountdown(target);
  if (c.expired) {
    return (
      <div className="glass-card !rounded-2xl px-5 py-3 inline-flex items-center gap-2">
        <Play className="w-4 h-4" />
        <span className="font-display text-2xl tracking-wider">EVENT STARTED</span>
      </div>
    );
  }
  const blocks = [
    { label: "Days", value: c.days },
    { label: "Hours", value: c.hours },
    { label: "Min", value: c.minutes },
    { label: "Sec", value: c.seconds },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {blocks.map((b) => (
        <div
          key={b.label}
          className="glass-card !rounded-xl px-3 sm:px-4 py-2 min-w-[64px] sm:min-w-[80px] text-center"
        >
          <div className="font-mono text-2xl sm:text-3xl font-bold tabular-nums">
            {String(b.value).padStart(2, "0")}
          </div>
          <div className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
            {b.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/* Info row helper */
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
      <div className="w-8 h-8 rounded-lg glass-card flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="text-sm">{value}</div>
      </div>
    </div>
  );
}

function DetailSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-lg glass-card flex items-center justify-center">
          <Icon className="w-4 h-4" strokeWidth={2} />
        </div>
        <h3 className="font-display text-2xl tracking-wide">{title}</h3>
      </div>
      <div className="text-sm">{children}</div>
    </GlassCard>
  );
}

export function EventDetail() {
  const { params, navigate, pushToast } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const eventId = params.id;
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    (async () => {
      setLoading(true);
      const res = await api<EventItem>(`/api/events/${eventId}`);
      if (res.success && res.data) setEvent(res.data);
      else if (res.message) pushToast({ type: "error", message: res.message });
      setLoading(false);
    })();
  }, [eventId, pushToast]);

  /* Check if bookmarked */
  useEffect(() => {
    if (!user || !eventId) return;
    (async () => {
      const res = await api<{ savedEvents: string }>("/api/users/profile");
      if (res.success && res.data) {
        try {
          const arr = JSON.parse(res.data.savedEvents || "[]") as string[];
          setSaved(arr.includes(eventId));
        } catch {
          /* ignore */
        }
      }
    })();
  }, [user, eventId]);

  const deadlinePassed = useMemo(() => {
    if (!event?.registrationDeadline) return false;
    return new Date(event.registrationDeadline) < new Date();
  }, [event]);

  const toggleBookmark = async () => {
    if (!user) {
      pushToast({ type: "info", message: "Please login to bookmark." });
      return;
    }
    if (saving) return;
    setSaving(true);
    const profileRes = await api<{ savedEvents: string }>(
      "/api/users/profile"
    );
    if (!profileRes.success || !profileRes.data) {
      setSaving(false);
      return;
    }
    let arr: string[] = [];
    try {
      arr = JSON.parse(profileRes.data.savedEvents || "[]") as string[];
    } catch {
      arr = [];
    }
    const isSaved = arr.includes(eventId);
    const next = isSaved
      ? arr.filter((id) => id !== eventId)
      : [...arr, eventId];
    await api("/api/users/profile", {
      method: "PUT",
      body: JSON.stringify({ savedEvents: JSON.stringify(next) }),
    });
    setSaved(!isSaved);
    setSaving(false);
    pushToast({
      type: "success",
      message: isSaved ? "Bookmark removed." : "Event bookmarked.",
    });
  };

  const share = async () => {
    const url = window.location.href;
    const text = event?.eventName
      ? `Check out ${event.eventName} at ${event.collegeName} on SportsFest!`
      : "Check out this event on SportsFest!";
    try {
      if (navigator.share) {
        await navigator.share({ title: "SportsFest Event", text, url });
      } else {
        await navigator.clipboard.writeText(url);
        pushToast({ type: "success", message: "Link copied to clipboard." });
      }
    } catch {
      /* user cancelled or unsupported */
    }
  };

  if (loading) {
    return (
      <main className="pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-24">
        <div className="mb-6">
          <div className="skeleton h-6 w-32 rounded mb-4" />
          <div className="skeleton h-72 w-full rounded-2xl mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <EventCardSkeleton />
            <EventCardSkeleton />
            <EventCardSkeleton />
          </div>
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="pb-32 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto pt-24">
        <GlassCard className="p-10 text-center">
          <Info className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <h2 className="font-display text-3xl tracking-wide">
            Event not found
          </h2>
          <p className="text-sm text-muted-foreground font-accent italic mt-1">
            It may have been removed or never existed.
          </p>
          <Button
            onClick={() => navigate("user-events")}
            className="mt-5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Button>
        </GlassCard>
      </main>
    );
  }

  const sports = parseJsonArray(event.sportsAndGames as unknown as string);
  const categories = parseJsonArray(event.categories as unknown as string);

  return (
    <main className="pb-32">
      {/* Hero */}
      <section className="relative w-full h-[60vh] min-h-[440px] overflow-hidden">
        {event.eventPoster ? (
          <img
            src={event.eventPoster}
            alt={event.eventName}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-grid">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[18rem] opacity-30">
                {getSportIcon(sports[0] || "")}
              </span>
            </div>
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, var(--background) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.6) 100%)",
          }}
        />

        {/* Top bar */}
        <div className="absolute top-24 left-0 right-0 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("user-events")}
            className="glass-card !rounded-full px-3 py-2 text-xs inline-flex items-center gap-1.5 hover:bg-accent/50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Events
          </button>
          <div className="flex items-center gap-2">
            <StatusBadge status={event.status} />
            <button
              type="button"
              aria-label={saved ? "Remove bookmark" : "Save event"}
              onClick={toggleBookmark}
              disabled={saving}
              className="glass-card !rounded-full w-10 h-10 flex items-center justify-center hover:bg-accent/50 transition-colors disabled:opacity-50"
            >
              {saved ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              aria-label="Share event"
              onClick={share}
              className="glass-card !rounded-full w-10 h-10 flex items-center justify-center hover:bg-accent/50 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <span className="glass-card !rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-wider">
                {event.collegeName}
              </span>
              <span className="glass-card !rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-wider">
                {event.targetAudience}
              </span>
              {event.tournamentFormat && (
                <span className="glass-card !rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-wider">
                  {event.tournamentFormat}
                </span>
              )}
            </div>
            <h1 className="font-display text-5xl sm:text-7xl md:text-8xl tracking-wide leading-[0.9] mb-2">
              {event.eventName}
            </h1>
            <p className="font-mono text-xs sm:text-sm text-muted-foreground">
              {formatDateTime(event.eventDate)}
              {event.venue && ` · ${event.venue}`}
            </p>
          </div>
        </div>
      </section>

      {/* Countdown + Apply */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto -mt-6 relative z-10">
        <GlassCard liquid glow className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center gap-5 lg:justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Event starts in
            </div>
            <Countdown target={event.eventDate} />
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            {deadlinePassed ? (
              <div className="bg-muted text-muted-foreground rounded-md px-6 py-3 text-sm font-medium text-center">
                Registration Closed
              </div>
            ) : (
              <Button
                size="lg"
                onClick={() => navigate("user-apply", { id: event.id })}
                className="h-12 px-8 text-base"
              >
                <Play className="w-4 h-4" />
                Apply Now
              </Button>
            )}
            {event.registrationLink && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => window.open(event.registrationLink, "_blank")}
                className="h-12 px-6"
              >
                External Link
              </Button>
            )}
          </div>
        </GlassCard>
      </section>

      {/* Body grid */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Basic Info */}
          <DetailSection icon={Info} title="Basic Information">
            <InfoRow
              icon={Calendar}
              label="Event Date"
              value={formatDate(event.eventDate)}
            />
            <InfoRow
              icon={Clock}
              label="Reporting Time"
              value={event.reportingTime || "—"}
            />
            <InfoRow
              icon={MapPin}
              label="Venue"
              value={event.venue || "—"}
            />
            <InfoRow
              icon={Users}
              label="Chief Guest"
              value={event.chiefGuest || "—"}
            />
            <InfoRow
              icon={User}
              label="Target Audience"
              value={event.targetAudience || "—"}
            />
            <InfoRow
              icon={Gamepad2}
              label="Tournament Format"
              value={event.tournamentFormat || "—"}
            />
            {event.registrationDeadline && (
              <InfoRow
                icon={Clock}
                label="Registration Deadline"
                value={formatDateTime(event.registrationDeadline)}
              />
            )}
          </DetailSection>

          {/* Sports & Format */}
          <DetailSection icon={Gamepad2} title="Sports & Format">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {sports.map((s) => (
                <div
                  key={s}
                  className="glass-card !rounded-xl p-3 flex items-center gap-3"
                >
                  <span className="text-2xl">{getSportIcon(s)}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{s}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      {isTeamSport(s) ? "Team Sport" : "Individual"}
                    </div>
                  </div>
                </div>
              ))}
              {sports.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No specific sports listed.
                </p>
              )}
            </div>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <span
                    key={c}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-border"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
            {event.eligibility && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  Eligibility
                </div>
                <div className="text-sm">
                  <ReactMarkdown>{event.eligibility}</ReactMarkdown>
                </div>
              </div>
            )}
          </DetailSection>

          {/* Prizes */}
          <DetailSection icon={Trophy} title="Prizes & Rewards">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="glass-card !rounded-xl p-3 text-center">
                <Award className="w-4 h-4 mx-auto mb-1 opacity-70" />
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Cash Prize
                </div>
                <div className="text-sm font-medium mt-0.5">
                  {event.prizesCashPrizes || "—"}
                </div>
              </div>
              <div className="glass-card !rounded-xl p-3 text-center">
                <Trophy className="w-4 h-4 mx-auto mb-1 opacity-70" />
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Medals
                </div>
                <div className="text-sm font-medium mt-0.5">
                  {event.prizesMedals ? "Yes" : "No"}
                </div>
              </div>
              <div className="glass-card !rounded-xl p-3 text-center">
                <Trophy className="w-4 h-4 mx-auto mb-1 opacity-70" />
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Championship
                </div>
                <div className="text-sm font-medium mt-0.5">
                  {event.prizesChampionship ? "Yes" : "No"}
                </div>
              </div>
            </div>
            {event.prizesDetails && (
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  Details
                </div>
                <div className="text-sm prose-sm">
                  <ReactMarkdown>{event.prizesDetails}</ReactMarkdown>
                </div>
              </div>
            )}
          </DetailSection>

          {/* Rules & Dress Code */}
          <DetailSection icon={Shield} title="Rules & Dress Code">
            {event.generalRules && (
              <div className="mb-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  General Rules
                </div>
                <div className="prose-sm">
                  <ReactMarkdown>{event.generalRules}</ReactMarkdown>
                </div>
              </div>
            )}
            {event.dresscode && (
              <div className="pt-4 border-t border-border">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Palette className="w-3 h-3" />
                  Dress Code
                </div>
                <div className="text-sm">
                  <ReactMarkdown>{event.dresscode}</ReactMarkdown>
                </div>
              </div>
            )}
            {!event.generalRules && !event.dresscode && (
              <p className="text-muted-foreground text-sm">
                No specific rules published.
              </p>
            )}
          </DetailSection>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-5">
          {/* Entry Fee */}
          <DetailSection icon={DollarSign} title="Entry Fee">
            {event.entryFeeIsFree ? (
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-display text-2xl tracking-wide">
                  FREE ENTRY
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {event.entryFeePerTeam > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">Per Team</span>
                    <span className="font-mono text-lg font-bold">
                      ₹{event.entryFeePerTeam}
                    </span>
                  </div>
                )}
                {event.entryFeePerPlayer > 0 && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-muted-foreground">
                      Per Player
                    </span>
                    <span className="font-mono text-lg font-bold">
                      ₹{event.entryFeePerPlayer}
                    </span>
                  </div>
                )}
                {event.entryFeePerTeam === 0 &&
                  event.entryFeePerPlayer === 0 && (
                    <p className="text-muted-foreground text-sm">
                      Contact organizer for fee details.
                    </p>
                  )}
              </div>
            )}
          </DetailSection>

          {/* Contact */}
          <DetailSection icon={Phone} title="Contact">
            <InfoRow
              icon={User}
              label="Physical Director"
              value={
                <div>
                  <div>{event.contactDirectorName || "—"}</div>
                  {event.contactDirectorPhone && (
                    <div className="font-mono text-xs text-muted-foreground">
                      {event.contactDirectorPhone}
                    </div>
                  )}
                </div>
              }
            />
            <InfoRow
              icon={User}
              label="Sports Captain"
              value={
                <div>
                  <div>{event.contactCaptainName || "—"}</div>
                  {event.contactCaptainPhone && (
                    <div className="font-mono text-xs text-muted-foreground">
                      {event.contactCaptainPhone}
                    </div>
                  )}
                </div>
              }
            />
            <InfoRow
              icon={Mail}
              label="Email"
              value={
                event.contactEmail ? (
                  <a
                    href={`mailto:${event.contactEmail}`}
                    className="font-mono text-xs hover:underline"
                  >
                    {event.contactEmail}
                  </a>
                ) : (
                  "—"
                )
              }
            />
          </DetailSection>

          {/* Registration stats */}
          <DetailSection icon={Users} title="Registrations">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Registered so far
              </span>
              <span className="font-display text-3xl tracking-wide">
                {event.registrationCount ?? 0}
              </span>
            </div>
          </DetailSection>
        </aside>
      </section>
    </main>
  );
}

export default EventDetail;
