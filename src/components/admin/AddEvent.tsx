"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PlusCircle,
  ArrowLeft,
  ArrowRight,
  Save,
  Upload,
  X,
  Image as ImageIcon,
  Check,
  Trophy,
  MapPin,
  Users as UsersIcon,
  IndianRupee,
  CalendarClock,
  Sparkles,
} from "lucide-react";
import { GlassCard } from "@/components/common/GlassCard";
import { PageHeader } from "@/components/common/UI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useUIStore } from "@/store/ui-store";
import { api, EventItem } from "@/lib/api";
import {
  cn,
  DEFAULT_SPORTS,
  fileToDataUrl,
  getSportIcon,
} from "@/lib/utils";

const STEP_LABELS = [
  "Basic Info",
  "Venue & People",
  "Sports & Format",
  "Fees & Prizes",
];

interface EventFormState {
  collegeName: string;
  eventName: string;
  eventDate: string;
  reportingTime: string;
  targetAudience: string;
  eventPoster: string;

  venue: string;
  chiefGuest: string;
  categories: string[];
  contactDirectorName: string;
  contactDirectorPhone: string;
  contactCaptainName: string;
  contactCaptainPhone: string;
  contactEmail: string;

  sportsAndGames: string[];
  customSportInput: string;
  tournamentFormat: string;
  eligibility: string;

  entryFeeIsFree: boolean;
  entryFeePerTeam: number;
  entryFeePerPlayer: number;
  prizesCashPrizes: string;
  prizesMedals: boolean;
  prizesChampionship: boolean;
  prizesDetails: string;
  generalRules: string;
  dresscode: string;
  registrationDeadlineDate: string;
  registrationDeadlineTime: string;
  registrationLink: string;
  status: string;
}

const DEFAULT_FORM: EventFormState = {
  collegeName: "",
  eventName: "",
  eventDate: "",
  reportingTime: "09:00",
  targetAudience: "College",
  eventPoster: "",

  venue: "",
  chiefGuest: "",
  categories: ["Men", "Women"],
  contactDirectorName: "",
  contactDirectorPhone: "",
  contactCaptainName: "",
  contactCaptainPhone: "",
  contactEmail: "",

  sportsAndGames: [],
  customSportInput: "",
  tournamentFormat: "Knockout",
  eligibility: "",

  entryFeeIsFree: true,
  entryFeePerTeam: 0,
  entryFeePerPlayer: 0,
  prizesCashPrizes: "",
  prizesMedals: true,
  prizesChampionship: true,
  prizesDetails: "",
  generalRules: "",
  dresscode: "",
  registrationDeadlineDate: "",
  registrationDeadlineTime: "17:00",
  registrationLink: "",
  status: "upcoming",
};

function FieldLabel({
  children,
  required,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between">
      <Label className="text-xs font-mono uppercase tracking-wider">
        {children}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {hint && (
        <span className="text-[10px] text-muted-foreground font-accent italic">
          {hint}
        </span>
      )}
    </div>
  );
}

function StepIcon({ step, current }: { step: number; current: number }) {
  const icons = [
    <Trophy key="1" className="w-3.5 h-3.5" />,
    <MapPin key="2" className="w-3.5 h-3.5" />,
    <UsersIcon key="3" className="w-3.5 h-3.5" />,
    <IndianRupee key="4" className="w-3.5 h-3.5" />,
  ];
  const isDone = step < current;
  const isCurrent = step === current;
  return (
    <div
      className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center border transition-all",
        isDone && "bg-primary text-primary-foreground border-primary",
        isCurrent &&
          "bg-primary text-primary-foreground border-primary animate-pulse-glow",
        !isDone && !isCurrent && "border-border text-muted-foreground bg-transparent"
      )}
    >
      {isDone ? <Check className="w-3.5 h-3.5" /> : icons[step]}
    </div>
  );
}

export function AddEvent() {
  const { view, params, navigate, pushToast } = useUIStore();
  const isEditMode = view === "admin-edit-event" && !!params.id;
  const eventId = params.id;

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<EventFormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [posterUploading, setPosterUploading] = useState(false);

  useEffect(() => {
    if (!isEditMode || !eventId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await api<EventItem>(`/api/events/${eventId}`);
      if (cancelled) return;
      if (res.success && res.data) {
        const ev = res.data;
        const deadline = ev.registrationDeadline
          ? new Date(ev.registrationDeadline)
          : null;
        setForm({
          collegeName: ev.collegeName || "",
          eventName: ev.eventName || "",
          eventDate: ev.eventDate
            ? new Date(ev.eventDate).toISOString().slice(0, 10)
            : "",
          reportingTime: ev.reportingTime || "09:00",
          targetAudience: ev.targetAudience || "College",
          eventPoster: ev.eventPoster || "",
          venue: ev.venue || "",
          chiefGuest: ev.chiefGuest || "",
          categories: ev.categories?.length ? ev.categories : ["Men", "Women"],
          contactDirectorName: ev.contactDirectorName || "",
          contactDirectorPhone: ev.contactDirectorPhone || "",
          contactCaptainName: ev.contactCaptainName || "",
          contactCaptainPhone: ev.contactCaptainPhone || "",
          contactEmail: ev.contactEmail || "",
          sportsAndGames: ev.sportsAndGames || [],
          customSportInput: "",
          tournamentFormat: ev.tournamentFormat || "Knockout",
          eligibility: ev.eligibility || "",
          entryFeeIsFree: ev.entryFeeIsFree,
          entryFeePerTeam: ev.entryFeePerTeam || 0,
          entryFeePerPlayer: ev.entryFeePerPlayer || 0,
          prizesCashPrizes: ev.prizesCashPrizes || "",
          prizesMedals: ev.prizesMedals,
          prizesChampionship: ev.prizesChampionship,
          prizesDetails: ev.prizesDetails || "",
          generalRules: ev.generalRules || "",
          dresscode: ev.dresscode || "",
          registrationDeadlineDate: deadline
            ? deadline.toISOString().slice(0, 10)
            : "",
          registrationDeadlineTime: deadline
            ? deadline.toTimeString().slice(0, 5)
            : "17:00",
          registrationLink: ev.registrationLink || "",
          status: ev.status || "upcoming",
        });
      } else {
        pushToast({
          type: "error",
          message: res.message || "Failed to load event.",
        });
        navigate("admin-events");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isEditMode, eventId, navigate, pushToast]);

  const set = <K extends keyof EventFormState>(
    key: K,
    value: EventFormState[K]
  ) => setForm((f) => ({ ...f, [key]: value }));

  const toggleArrayValue = (key: "categories" | "sportsAndGames", v: string) => {
    setForm((f) => {
      const arr = f[key];
      return {
        ...f,
        [key]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v],
      };
    });
  };

  const addCustomSport = () => {
    const v = form.customSportInput.trim();
    if (!v) return;
    if (form.sportsAndGames.includes(v)) {
      pushToast({ type: "info", message: "Sport already added." });
      return;
    }
    setForm((f) => ({
      ...f,
      sportsAndGames: [...f.sportsAndGames, v],
      customSportInput: "",
    }));
  };

  // Per-step validation
  const stepValid = useMemo(() => {
    if (step === 0) {
      return (
        form.collegeName.trim() !== "" &&
        form.eventName.trim() !== "" &&
        form.eventDate !== "" &&
        form.reportingTime !== ""
      );
    }
    if (step === 1) {
      return form.venue.trim() !== "";
    }
    if (step === 2) {
      return form.sportsAndGames.length > 0 && form.tournamentFormat !== "";
    }
    return true;
  }, [step, form]);

  const handlePosterUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      pushToast({
        type: "error",
        message: "Image too large. Max 2MB.",
      });
      return;
    }
    setPosterUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      set("eventPoster", dataUrl);
    } catch {
      pushToast({ type: "error", message: "Failed to read image." });
    } finally {
      setPosterUploading(false);
    }
  };

  const buildPayload = (statusOverride?: string) => {
    const deadline =
      form.registrationDeadlineDate && form.registrationDeadlineTime
        ? new Date(
            `${form.registrationDeadlineDate}T${form.registrationDeadlineTime}`
          ).toISOString()
        : form.registrationDeadlineDate
        ? new Date(`${form.registrationDeadlineDate}T17:00`).toISOString()
        : null;
    const eventDate = form.eventDate
      ? new Date(`${form.eventDate}T${form.reportingTime || "09:00"}`).toISOString()
      : new Date().toISOString();
    return {
      collegeName: form.collegeName,
      eventName: form.eventName,
      eventDate,
      reportingTime: form.reportingTime,
      venue: form.venue,
      chiefGuest: form.chiefGuest,
      categories: form.categories,
      sportsAndGames: form.sportsAndGames,
      tournamentFormat: form.tournamentFormat,
      eligibility: form.eligibility,
      prizesCashPrizes: form.prizesCashPrizes,
      prizesMedals: form.prizesMedals,
      prizesChampionship: form.prizesChampionship,
      prizesDetails: form.prizesDetails,
      entryFeePerTeam: Number(form.entryFeePerTeam) || 0,
      entryFeePerPlayer: Number(form.entryFeePerPlayer) || 0,
      entryFeeIsFree: form.entryFeeIsFree,
      generalRules: form.generalRules,
      dresscode: form.dresscode,
      registrationDeadline: deadline,
      registrationLink: form.registrationLink,
      contactDirectorName: form.contactDirectorName,
      contactDirectorPhone: form.contactDirectorPhone,
      contactCaptainName: form.contactCaptainName,
      contactCaptainPhone: form.contactCaptainPhone,
      contactEmail: form.contactEmail,
      eventPoster: form.eventPoster,
      status: statusOverride || form.status || "upcoming",
      targetAudience: form.targetAudience,
    };
  };

  const submit = async (asDraft = false) => {
    if (!stepValid && !asDraft) {
      pushToast({
        type: "error",
        message: "Please complete required fields before submitting.",
      });
      return;
    }
    setSubmitting(true);
    const status = asDraft ? "upcoming" : form.status || "upcoming";
    const payload = buildPayload(status);
    try {
      if (isEditMode && eventId) {
        const res = await api(`/api/events/${eventId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        if (res.success) {
          pushToast({ type: "success", message: "Event updated." });
          navigate("admin-events");
        } else {
          pushToast({
            type: "error",
            message: res.message || "Update failed.",
          });
        }
      } else {
        const res = await api<EventItem>("/api/events", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (res.success) {
          pushToast({
            type: "success",
            message: asDraft ? "Draft saved." : "Event published.",
          });
          navigate("admin-events");
        } else {
          pushToast({
            type: "error",
            message: res.message || "Failed to create event.",
          });
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const progressPct = ((step + 1) / 4) * 100;

  if (loading) {
    return (
      <div className="min-h-screen pb-32 px-4 sm:px-6 lg:px-8 pt-8 max-w-5xl mx-auto">
        <div className="space-y-4">
          <div className="skeleton h-12 w-1/3 rounded" />
          <div className="skeleton h-2 w-full rounded-full" />
          <div className="glass-card p-8 mt-4">
            <div className="skeleton h-6 w-1/4 mb-4 rounded" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-10 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 px-4 sm:px-6 lg:px-8 pt-8 max-w-5xl mx-auto">
      <PageHeader
        title={isEditMode ? "EDIT EVENT" : "CREATE EVENT"}
        subtitle={
          isEditMode
            ? "Update the details of this event"
            : "Build a new inter-college sports event in 4 steps"
        }
        icon={PlusCircle}
        action={
          <Button
            variant="ghost"
            onClick={() => navigate("admin-events")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Events</span>
          </Button>
        }
      />

      {/* Progress bar + step indicator */}
      <GlassCard className="p-4 sm:p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-muted-foreground">
              STEP {step + 1} / 4
            </span>
            <span className="font-decorative text-xl tracking-wide">
              {STEP_LABELS[step]}
            </span>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {Math.round(progressPct)}%
          </span>
        </div>
        <Progress value={progressPct} className="h-1.5 mb-4" />
        <div className="flex items-center justify-between">
          {STEP_LABELS.map((label, i) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 flex-1"
            >
              <StepIcon step={i} current={step} />
              <span
                className={cn(
                  "text-[10px] font-mono uppercase tracking-wider text-center hidden sm:block",
                  i === step ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Step content */}
      <GlassCard className="p-5 sm:p-7 mb-6">
        {step === 0 && (
          <div className="space-y-5 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <FieldLabel required>College Name</FieldLabel>
                <Input
                  value={form.collegeName}
                  onChange={(e) => set("collegeName", e.target.value)}
                  placeholder="e.g. Anna University"
                />
              </div>
              <div>
                <FieldLabel required>Event Name</FieldLabel>
                <Input
                  value={form.eventName}
                  onChange={(e) => set("eventName", e.target.value)}
                  placeholder="e.g. Inter-Collegiate Athletics Meet"
                />
              </div>
              <div>
                <FieldLabel required>Event Date</FieldLabel>
                <Input
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => set("eventDate", e.target.value)}
                />
              </div>
              <div>
                <FieldLabel required>Reporting Time</FieldLabel>
                <Input
                  type="time"
                  value={form.reportingTime}
                  onChange={(e) => set("reportingTime", e.target.value)}
                />
              </div>
            </div>

            <div>
              <FieldLabel>Target Audience</FieldLabel>
              <RadioGroup
                value={form.targetAudience}
                onValueChange={(v) => set("targetAudience", v)}
                className="grid grid-cols-3 gap-2"
              >
                {["College", "School", "Both"].map((opt) => (
                  <Label
                    key={opt}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-md border cursor-pointer transition-all justify-center",
                      form.targetAudience === opt
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-foreground/30"
                    )}
                  >
                    <RadioGroupItem value={opt} />
                    <span className="text-sm">{opt}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            <div>
              <FieldLabel hint="Max 2MB">Event Poster</FieldLabel>
              <div className="flex items-start gap-4 flex-wrap">
                {form.eventPoster ? (
                  <div className="relative w-28 h-36 rounded-lg overflow-hidden border border-border">
                    <img
                      src={form.eventPoster}
                      alt="Event poster preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => set("eventPoster", "")}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background"
                      aria-label="Remove poster"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-28 h-36 rounded-lg border border-dashed border-border flex items-center justify-center">
                    <ImageIcon className="w-7 h-7 text-muted-foreground" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePosterUpload}
                    disabled={posterUploading}
                  />
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border hover:border-foreground/30 transition-colors text-sm">
                    <Upload className="w-4 h-4" />
                    {posterUploading
                      ? "Uploading..."
                      : form.eventPoster
                      ? "Replace Poster"
                      : "Upload Poster"}
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <FieldLabel required>Venue</FieldLabel>
                <Input
                  value={form.venue}
                  onChange={(e) => set("venue", e.target.value)}
                  placeholder="e.g. Main Ground / Indoor Stadium"
                />
              </div>
              <div>
                <FieldLabel hint="Optional">Chief Guest / Inaugurator</FieldLabel>
                <Input
                  value={form.chiefGuest}
                  onChange={(e) => set("chiefGuest", e.target.value)}
                  placeholder="e.g. Dr. Rajesh Kumar, Vice Chancellor"
                />
              </div>
            </div>

            <div>
              <FieldLabel>Categories</FieldLabel>
              <div className="flex flex-wrap gap-3">
                {["Men", "Women", "Both"].map((cat) => {
                  const checked = form.categories.includes(cat);
                  return (
                    <Label
                      key={cat}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-md border cursor-pointer transition-all",
                        checked
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-foreground/30"
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleArrayValue("categories", cat)}
                      />
                      <span className="text-sm">{cat}</span>
                    </Label>
                  );
                })}
              </div>
            </div>

            <Separator />
            <h3 className="font-decorative text-lg">Contact Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <FieldLabel>Physical Director Name</FieldLabel>
                <Input
                  value={form.contactDirectorName}
                  onChange={(e) => set("contactDirectorName", e.target.value)}
                  placeholder="Director name"
                />
              </div>
              <div>
                <FieldLabel>Director Phone</FieldLabel>
                <Input
                  value={form.contactDirectorPhone}
                  onChange={(e) => set("contactDirectorPhone", e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <FieldLabel>Student Sports Captain Name</FieldLabel>
                <Input
                  value={form.contactCaptainName}
                  onChange={(e) => set("contactCaptainName", e.target.value)}
                  placeholder="Captain name"
                />
              </div>
              <div>
                <FieldLabel>Captain Phone</FieldLabel>
                <Input
                  value={form.contactCaptainPhone}
                  onChange={(e) => set("contactCaptainPhone", e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Contact Email</FieldLabel>
                <Input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => set("contactEmail", e.target.value)}
                  placeholder="sports@college.edu"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <FieldLabel required>Which Games Available?</FieldLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {DEFAULT_SPORTS.map((sport) => {
                  const checked = form.sportsAndGames.includes(sport);
                  return (
                    <button
                      key={sport}
                      type="button"
                      onClick={() => toggleArrayValue("sportsAndGames", sport)}
                      className={cn(
                        "flex flex-col items-center gap-1 px-2 py-3 rounded-lg border transition-all",
                        checked
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-foreground/30"
                      )}
                    >
                      <span className="text-2xl">{getSportIcon(sport)}</span>
                      <span className="text-[11px] font-mono uppercase tracking-wide text-center">
                        {sport}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom sports */}
            <div>
              <FieldLabel hint="Press Add to include">+ Add Custom Sport</FieldLabel>
              <div className="flex gap-2">
                <Input
                  value={form.customSportInput}
                  onChange={(e) => set("customSportInput", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomSport();
                    }
                  }}
                  placeholder="e.g. Chess, Carrom, Squash..."
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCustomSport}
                  className="gap-1 shrink-0"
                >
                  <PlusCircle className="w-4 h-4" /> Add
                </Button>
              </div>
              {form.sportsAndGames.filter(
                (s) => !DEFAULT_SPORTS.includes(s)
              ).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.sportsAndGames
                    .filter((s) => !DEFAULT_SPORTS.includes(s))
                    .map((s) => (
                      <Badge
                        key={s}
                        variant="secondary"
                        className="gap-1 pr-1.5"
                      >
                        {getSportIcon(s)} {s}
                        <button
                          type="button"
                          onClick={() =>
                            toggleArrayValue("sportsAndGames", s)
                          }
                          className="ml-1 hover:text-destructive"
                          aria-label={`Remove ${s}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                </div>
              )}
            </div>

            <Separator />

            <div>
              <FieldLabel required>Tournament Format</FieldLabel>
              <RadioGroup
                value={form.tournamentFormat}
                onValueChange={(v) => set("tournamentFormat", v)}
                className="grid grid-cols-2 sm:grid-cols-4 gap-2"
              >
                {["Knockout", "League", "Athletics", "Mixed"].map((opt) => (
                  <Label
                    key={opt}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-md border cursor-pointer transition-all justify-center",
                      form.tournamentFormat === opt
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-foreground/30"
                    )}
                  >
                    <RadioGroupItem value={opt} />
                    <span className="text-sm">{opt}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            <div>
              <FieldLabel hint="Optional">Eligibility / Target Audience</FieldLabel>
              <Textarea
                value={form.eligibility}
                onChange={(e) => set("eligibility", e.target.value)}
                placeholder="e.g. Open to all UG & PG students born after 2004. Max 2 entries per college per event."
                rows={3}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            {/* Entry fee */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <FieldLabel>Entry Fee</FieldLabel>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    {form.entryFeeIsFree ? "FREE" : "PAID"}
                  </span>
                  <Switch
                    checked={!form.entryFeeIsFree}
                    onCheckedChange={(v) => set("entryFeeIsFree", !v)}
                  />
                </div>
              </div>
              {!form.entryFeeIsFree && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div>
                    <FieldLabel>Per Team (₹)</FieldLabel>
                    <Input
                      type="number"
                      min={0}
                      value={form.entryFeePerTeam}
                      onChange={(e) =>
                        set("entryFeePerTeam", Number(e.target.value))
                      }
                      placeholder="500"
                    />
                  </div>
                  <div>
                    <FieldLabel>Per Player (₹)</FieldLabel>
                    <Input
                      type="number"
                      min={0}
                      value={form.entryFeePerPlayer}
                      onChange={(e) =>
                        set("entryFeePerPlayer", Number(e.target.value))
                      }
                      placeholder="50"
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Prizes */}
            <div>
              <h3 className="font-decorative text-lg mb-3">Prizes</h3>
              <div className="space-y-4">
                <div>
                  <FieldLabel hint="Optional">Cash Prizes</FieldLabel>
                  <Input
                    value={form.prizesCashPrizes}
                    onChange={(e) => set("prizesCashPrizes", e.target.value)}
                    placeholder="e.g. Winner ₹10,000 · Runner-up ₹5,000"
                  />
                </div>
                <div className="flex flex-wrap gap-6">
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <Switch
                      checked={form.prizesMedals}
                      onCheckedChange={(v) => set("prizesMedals", v)}
                    />
                    <span className="text-sm">Medals</span>
                  </Label>
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <Switch
                      checked={form.prizesChampionship}
                      onCheckedChange={(v) => set("prizesChampionship", v)}
                    />
                    <span className="text-sm">Overall Championship Trophy</span>
                  </Label>
                </div>
                <div>
                  <FieldLabel hint="Optional">Prize Details</FieldLabel>
                  <Textarea
                    value={form.prizesDetails}
                    onChange={(e) => set("prizesDetails", e.target.value)}
                    placeholder="Describe individual event prizes, certificates, etc."
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Rules + Dress code */}
            <div className="space-y-4">
              <div>
                <FieldLabel hint="Markdown supported">General Rules</FieldLabel>
                <Textarea
                  value={form.generalRules}
                  onChange={(e) => set("generalRules", e.target.value)}
                  placeholder="## Tournament Rules&#10;- Each team must report 30 min before match&#10;- IDs mandatory..."
                  rows={4}
                />
              </div>
              <div>
                <FieldLabel hint="Optional">Kit / Dress Code</FieldLabel>
                <Input
                  value={form.dresscode}
                  onChange={(e) => set("dresscode", e.target.value)}
                  placeholder="e.g. College jersey + white shorts"
                />
              </div>
            </div>

            <Separator />

            {/* Deadline + link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel hint="Optional">Registration Deadline — Date</FieldLabel>
                <Input
                  type="date"
                  value={form.registrationDeadlineDate}
                  onChange={(e) =>
                    set("registrationDeadlineDate", e.target.value)
                  }
                />
              </div>
              <div>
                <FieldLabel hint="Optional">Registration Deadline — Time</FieldLabel>
                <Input
                  type="time"
                  value={form.registrationDeadlineTime}
                  onChange={(e) =>
                    set("registrationDeadlineTime", e.target.value)
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel hint="Optional">External Registration Link</FieldLabel>
                <Input
                  type="url"
                  value={form.registrationLink}
                  onChange={(e) => set("registrationLink", e.target.value)}
                  placeholder="https://forms.gle/..."
                />
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Navigation footer */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || submitting}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          {step < 3 && (
            <Button
              onClick={() => setStep((s) => Math.min(3, s + 1))}
              disabled={!stepValid}
              className="gap-2"
            >
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {step === 3 && !isEditMode && (
            <Button
              variant="ghost"
              onClick={() => submit(true)}
              disabled={submitting}
              className="gap-2"
            >
              <Save className="w-4 h-4" /> Save as Draft
            </Button>
          )}
          {step === 3 && (
            <Button
              onClick={() => submit(false)}
              disabled={submitting || !stepValid}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {submitting
                ? "Saving..."
                : isEditMode
                ? "Update Event"
                : "Publish Event"}
            </Button>
          )}
          {step < 3 && (
            <div className="text-xs text-muted-foreground font-mono self-center ml-2 hidden sm:flex items-center gap-1">
              <CalendarClock className="w-3 h-3" />
              {stepValid
                ? "Step complete — continue"
                : "Fill required fields to continue"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
