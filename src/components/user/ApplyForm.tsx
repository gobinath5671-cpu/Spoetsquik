"use client";

import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import {
  ArrowLeft,
  Upload,
  Plus,
  X,
  CheckCircle2,
  Heart,
  ShieldCheck,
  Download,
  FileText,
  Ticket,
  Loader2,
  Info,
  User,
  IdCard,
  Phone,
  AlertTriangle,
} from "lucide-react";
import { api, EventItem, RegistrationItem } from "@/lib/api";
import { useUIStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
import {
  SPORT_CATEGORIES,
  isTeamSport,
  getSportIcon,
  fileToDataUrl,
  downloadTextFile,
  formatDate,
  formatDateTime,
  parseJsonArray,
  cn,
} from "@/lib/utils";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const RELATIONS = ["Parent", "Guardian", "Sibling", "Other"];
const MAX_FILE_MB = 5;

interface FormState {
  fullName: string;
  rollNumber: string;
  department: string;
  year: string;
  section: string;
  collegeName: string;
  selectedSport: string;
  eventCategory: string;
  isTeamGame: boolean;
  teamName: string;
  captainName: string;
  members: string[];
  idCardUrl: string;
  contactNumber: string;
  emailId: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
  fitnessConfirmed: boolean;
  bloodGroup: string;
  paymentTxnId: string;
  paymentReceiptUrl: string;
}

/* ───────────────────────────────────────────────
   PDF / Text slip generators (exported for MyRegistrations)
   ─────────────────────────────────────────────── */
export function generateSlipPDF(reg: RegistrationItem) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;

  /* Header band */
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("SPORTSFEST", margin, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Inter-College Sports Events Portal", margin, 21);
  doc.setFontSize(9);
  doc.text("REGISTRATION SLIP", pageW - margin, 14, { align: "right" });
  doc.text(formatDate(reg.appliedAt), pageW - margin, 21, { align: "right" });

  /* Reset */
  doc.setTextColor(0, 0, 0);
  let y = 42;

  /* Registration code — prominent */
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("REGISTRATION CODE", margin, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(reg.registrationCode, margin, y + 9);
  y += 18;

  /* Divider */
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  /* Two-column helper */
  const col1 = margin;
  const col2 = pageW / 2 + 2;
  const rowH = 8;
  const field = (label: string, value: string, x: number, yy: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    doc.text(label.toUpperCase(), x, yy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(value || "—", x, yy + 5);
  };

  /* Student section */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("STUDENT DETAILS", margin, y);
  y += 6;
  field("Full Name", reg.fullName, col1, y);
  field("Roll Number", reg.rollNumber, col2, y);
  y += rowH + 2;
  field("Department", reg.department, col1, y);
  field("Year / Section", `${reg.year} / ${reg.section}`, col2, y);
  y += rowH + 2;
  field("College", reg.collegeName, col1, y);
  field("Blood Group", reg.bloodGroup, col2, y);
  y += rowH + 4;

  /* Contact */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("CONTACT", margin, y);
  y += 6;
  field("Phone", reg.contactNumber, col1, y);
  field("Email", reg.emailId, col2, y);
  y += rowH + 2;
  field("Emergency Contact", reg.emergencyName, col1, y);
  field("Emergency Phone", reg.emergencyPhone, col2, y);
  y += rowH + 4;

  /* Event section */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("EVENT DETAILS", margin, y);
  y += 6;
  const ev = reg.event;
  field("Event", ev?.eventName || "—", col1, y);
  field("College", ev?.collegeName || reg.collegeName, col2, y);
  y += rowH + 2;
  field(
    "Date",
    ev ? formatDate(ev.eventDate) : "—",
    col1,
    y
  );
  field("Venue", ev?.venue || "—", col2, y);
  y += rowH + 2;
  field("Selected Sport", reg.selectedSport, col1, y);
  field("Category", reg.eventCategory, col2, y);
  y += rowH + 2;
  if (reg.isTeamGame) {
    field("Team Name", reg.teamName, col1, y);
    field("Captain", reg.captainName, col2, y);
    y += rowH + 2;
    if (reg.members.length > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(110, 110, 110);
      doc.text("TEAM MEMBERS", col1, y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const membersText = reg.members
        .map((m, i) => `${i + 1}. ${m}`)
        .join("   ");
      const splitMembers = doc.splitTextToSize(membersText, pageW - margin * 2);
      doc.text(splitMembers, col1, y + 5);
      y += 5 + splitMembers.length * 5;
    }
  }
  y += 6;

  /* QR Code */
  if (reg.qrCodeData) {
    const qrSize = 42;
    const qrX = pageW - margin - qrSize;
    doc.setFillColor(245, 245, 245);
    doc.rect(qrX - 2, y - 2, qrSize + 4, qrSize + 4, "F");
    try {
      doc.addImage(reg.qrCodeData, "PNG", qrX, y, qrSize, qrSize);
    } catch {
      /* ignore */
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(110, 110, 110);
    doc.text("Scan at venue", qrX + qrSize / 2, y + qrSize + 5, {
      align: "center",
    });

    /* Status box on left */
    doc.setFillColor(0, 0, 0);
    doc.rect(margin, y, 80, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("STATUS", margin + 5, y + 8);
    doc.setFontSize(14);
    doc.text(reg.status.toUpperCase(), margin + 5, y + 17);
    y += 30;
  }

  /* Footer */
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(margin, pageH - 22, pageW - margin, pageH - 22);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(
    "This slip must be presented at the venue along with a valid college ID card.",
    pageW / 2,
    pageH - 14,
    { align: "center" }
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "SportsFest © " + new Date().getFullYear(),
    pageW / 2,
    pageH - 9,
    { align: "center" }
  );

  doc.save(`SF-${reg.registrationCode}.pdf`);
}

export function generateSlipText(reg: RegistrationItem): string {
  const lines: string[] = [];
  lines.push("===========================================");
  lines.push("         SPORTSFEST — REGISTRATION SLIP    ");
  lines.push("         Inter-College Sports Portal       ");
  lines.push("===========================================");
  lines.push("");
  lines.push(`REGISTRATION CODE : ${reg.registrationCode}`);
  lines.push(`APPLIED AT        : ${formatDateTime(reg.appliedAt)}`);
  lines.push(`STATUS            : ${reg.status.toUpperCase()}`);
  lines.push("");
  lines.push("── STUDENT DETAILS ──");
  lines.push(`Full Name         : ${reg.fullName}`);
  lines.push(`Roll Number       : ${reg.rollNumber}`);
  lines.push(`Department        : ${reg.department}`);
  lines.push(`Year / Section    : ${reg.year} / ${reg.section}`);
  lines.push(`College           : ${reg.collegeName}`);
  lines.push(`Blood Group       : ${reg.bloodGroup}`);
  lines.push("");
  lines.push("── CONTACT ──");
  lines.push(`Phone             : ${reg.contactNumber}`);
  lines.push(`Email             : ${reg.emailId}`);
  lines.push(`Emergency Contact : ${reg.emergencyName} (${reg.emergencyRelation})`);
  lines.push(`Emergency Phone   : ${reg.emergencyPhone}`);
  lines.push("");
  lines.push("── EVENT DETAILS ──");
  if (reg.event) {
    lines.push(`Event             : ${reg.event.eventName}`);
    lines.push(`Organising College: ${reg.event.collegeName}`);
    lines.push(`Date              : ${formatDate(reg.event.eventDate)}`);
    lines.push(`Venue             : ${reg.event.venue || "—"}`);
  }
  lines.push(`Selected Sport    : ${reg.selectedSport}`);
  lines.push(`Category          : ${reg.eventCategory}`);
  if (reg.isTeamGame) {
    lines.push(`Team Name         : ${reg.teamName}`);
    lines.push(`Captain           : ${reg.captainName}`);
    if (reg.members.length) {
      lines.push("Team Members      :");
      reg.members.forEach((m, i) => lines.push(`  ${i + 1}. ${m}`));
    }
  }
  lines.push("");
  lines.push("── MEDICAL ──");
  lines.push(
    `Fitness Declared  : ${reg.fitnessConfirmed ? "YES" : "NO"}`
  );
  lines.push("");
  lines.push("── PAYMENT ──");
  lines.push(`Paid              : ${reg.isPaid ? "YES" : "NO"}`);
  if (reg.paymentTxnId) lines.push(`Transaction ID    : ${reg.paymentTxnId}`);
  lines.push("");
  lines.push("===========================================");
  lines.push(" This slip must be presented at the venue ");
  lines.push(" along with a valid college ID card.       ");
  lines.push("===========================================");
  return lines.join("\n");
}

/* ───────────────────────────────────────────────
   Section wrapper
   ─────────────────────────────────────────────── */
function FormSection({
  index,
  title,
  description,
  icon: Icon,
  children,
}: {
  index: number;
  title: string;
  description?: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center font-mono font-bold text-sm">
          {String(index).padStart(2, "0")}
        </div>
        <div className="flex-1">
          <h3 className="font-display text-2xl tracking-wide flex items-center gap-2">
            <Icon className="w-4 h-4" />
            {title}
          </h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      {children}
    </GlassCard>
  );
}

/* ───────────────────────────────────────────────
   Confirmation dialog
   ─────────────────────────────────────────────── */
function ConfirmationDialog({
  open,
  onOpenChange,
  registration,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  registration: RegistrationItem | null;
}) {
  const { navigate } = useUIStore();
  if (!registration) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-14 h-14 rounded-2xl bg-foreground text-background flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <DialogTitle className="font-display text-3xl tracking-wide text-center">
            Registration Confirmed
          </DialogTitle>
          <DialogDescription className="text-center">
            Your registration has been submitted. Save your slip for the venue.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Registration Code
            </div>
            <div className="font-mono text-2xl font-bold tracking-wider mt-1">
              {registration.registrationCode}
            </div>
          </div>

          {registration.qrCodeData && (
            <div className="p-3 bg-white rounded-xl">
              <img
                src={registration.qrCodeData}
                alt="QR Code"
                className="w-40 h-40"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 w-full">
            <Button
              onClick={() => generateSlipPDF(registration)}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              PDF Slip
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                downloadTextFile(
                  `SF-${registration.registrationCode}.txt`,
                  generateSlipText(registration)
                )
              }
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Text File
            </Button>
          </div>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              navigate("user-my-registrations");
            }}
          >
            View My Registrations
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────────────────────────────
   ApplyForm page
   ─────────────────────────────────────────────── */
export function ApplyForm() {
  const { params, navigate, pushToast } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const eventId = params.id;
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loadingEv, setLoadingEv] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<RegistrationItem | null>(
    null
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [form, setForm] = useState<FormState>({
    fullName: "",
    rollNumber: "",
    department: "",
    year: "",
    section: "",
    collegeName: "",
    selectedSport: "",
    eventCategory: "",
    isTeamGame: false,
    teamName: "",
    captainName: "",
    members: [],
    idCardUrl: "",
    contactNumber: "",
    emailId: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelation: "",
    fitnessConfirmed: false,
    bloodGroup: "",
    paymentTxnId: "",
    paymentReceiptUrl: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  /* Load event + prefill user data */
  useEffect(() => {
    if (!eventId) return;
    (async () => {
      const res = await api<EventItem>(`/api/events/${eventId}`);
      if (res.success && res.data) {
        setEvent(res.data);
        const sportsArr = parseJsonArray(
          res.data.sportsAndGames as unknown as string
        );
        const firstSport = sportsArr[0] || "";
        setForm((f) => ({
          ...f,
          selectedSport: firstSport,
          isTeamGame: firstSport ? isTeamSport(firstSport) : false,
        }));
      } else if (res.message) {
        pushToast({ type: "error", message: res.message });
      }
      setLoadingEv(false);
    })();
  }, [eventId, pushToast]);

  useEffect(() => {
    if (!user) return;
    // Prefill form from authenticated user profile (deferred to avoid sync setState in effect)
    Promise.resolve().then(() => {
      setForm((f) => ({
        ...f,
        fullName: f.fullName || user.fullName || "",
        rollNumber: f.rollNumber || user.rollNumber || "",
        department: f.department || user.department || "",
        year: f.year || user.year || "",
        section: f.section || user.section || "",
        collegeName: f.collegeName || user.collegeName || "",
        contactNumber: f.contactNumber || user.phone || "",
        emailId: f.emailId || user.email || "",
      }));
    });
  }, [user]);

  const sports = useMemo(
    () => (event ? parseJsonArray(event.sportsAndGames as unknown as string) : []),
    [event]
  );

  const categories = useMemo(() => {
    if (!form.selectedSport) return [];
    return SPORT_CATEGORIES[form.selectedSport] || [];
  }, [form.selectedSport]);

  const deadlinePassed = useMemo(() => {
    if (!event?.registrationDeadline) return false;
    return new Date(event.registrationDeadline) < new Date();
  }, [event]);

  /* Helpers */
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) {
      setErrors((e) => {
        const next = { ...e };
        delete next[key];
        return next;
      });
    }
  };

  const handleFile = async (
    file: File | undefined,
    key: "idCardUrl" | "paymentReceiptUrl"
  ) => {
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      pushToast({
        type: "error",
        message: `File too large. Max ${MAX_FILE_MB}MB.`,
      });
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      set(key, dataUrl);
    } catch {
      pushToast({ type: "error", message: "Could not read file." });
    }
  };

  const addMember = () => set("members", [...form.members, ""]);
  const removeMember = (i: number) =>
    set(
      "members",
      form.members.filter((_, idx) => idx !== i)
    );
  const updateMember = (i: number, v: string) =>
    set(
      "members",
      form.members.map((m, idx) => (idx === i ? v : m))
    );

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Required";
    if (!form.rollNumber.trim()) e.rollNumber = "Required";
    if (!form.department.trim()) e.department = "Required";
    if (!form.year.trim()) e.year = "Required";
    if (!form.section.trim()) e.section = "Required";
    if (!form.collegeName.trim()) e.collegeName = "Required";
    if (!form.selectedSport) e.selectedSport = "Select a sport";
    if (!form.eventCategory) e.eventCategory = "Select a category";
    if (form.isTeamGame) {
      if (!form.teamName.trim()) e.teamName = "Required";
      if (!form.captainName.trim()) e.captainName = "Required";
    }
    if (!form.idCardUrl) e.idCardUrl = "Upload your college ID";
    if (!form.contactNumber.trim()) e.contactNumber = "Required";
    if (!form.emailId.trim()) e.emailId = "Required";
    if (!form.emergencyName.trim()) e.emergencyName = "Required";
    if (!form.emergencyPhone.trim()) e.emergencyPhone = "Required";
    if (!form.emergencyRelation) e.emergencyRelation = "Select relation";
    if (!form.fitnessConfirmed) e.fitnessConfirmed = "Must confirm";
    if (!form.bloodGroup) e.bloodGroup = "Select blood group";
    if (event && !event.entryFeeIsFree) {
      if (!form.paymentTxnId.trim()) e.paymentTxnId = "Required";
      if (!form.paymentReceiptUrl) e.paymentReceiptUrl = "Upload receipt";
    }
    setErrors(e);
    if (Object.keys(e).length > 0) {
      pushToast({
        type: "error",
        message: "Please complete all required fields.",
      });
    }
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!event || !eventId) return;
    if (deadlinePassed) {
      pushToast({
        type: "error",
        message: "Registration deadline has passed.",
      });
      return;
    }
    if (!validate()) return;
    setSubmitting(true);
    const res = await api<RegistrationItem>(
      `/api/registrations/${eventId}`,
      {
        method: "POST",
        body: JSON.stringify(form),
      }
    );
    setSubmitting(false);
    if (res.success && res.data) {
      setConfirmation(res.data);
      setConfirmOpen(true);
      pushToast({
        type: "success",
        message: "Registration submitted successfully!",
      });
    } else {
      pushToast({
        type: "error",
        message: res.message || "Could not submit registration.",
      });
    }
  };

  if (loadingEv) {
    return (
      <main className="pb-32 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto pt-24">
        <div className="skeleton h-8 w-32 rounded mb-4" />
        <div className="skeleton h-12 w-3/4 rounded mb-3" />
        <div className="skeleton h-32 w-full rounded-2xl mb-4" />
        <div className="skeleton h-32 w-full rounded-2xl" />
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

  if (deadlinePassed) {
    return (
      <main className="pb-32 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto pt-24">
        <GlassCard className="p-10 text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-70" />
          <h2 className="font-display text-3xl tracking-wide">
            Registration Closed
          </h2>
          <p className="text-sm text-muted-foreground font-accent italic mt-1">
            The deadline for this event has passed.
          </p>
          <Button
            onClick={() => navigate("user-event-detail", { id: event.id })}
            className="mt-5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Event
          </Button>
        </GlassCard>
      </main>
    );
  }

  const fieldCls = (k: string) =>
    cn(errors[k] && "border-destructive ring-destructive/30");

  return (
    <main className="pb-32 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto pt-24">
      {/* Header */}
      <button
        type="button"
        onClick={() => navigate("user-event-detail", { id: event.id })}
        className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Event
      </button>

      <div className="mb-6">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">
          Registration
        </p>
        <h1 className="font-display text-4xl sm:text-5xl tracking-wide leading-none">
          Apply for {event.eventName}
        </h1>
        <p className="font-mono text-xs text-muted-foreground mt-2">
          {event.collegeName} · {formatDate(event.eventDate)}
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {/* 1. Full Name & Roll Number */}
        <FormSection
          index={1}
          title="Full Name & Roll Number"
          icon={User}
          description="Identify yourself as a registered student."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5">Full Name *</Label>
              <Input
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                className={fieldCls("fullName")}
                placeholder="e.g. Rahul Sharma"
              />
              {errors.fullName && (
                <p className="text-xs text-destructive mt-1">
                  {errors.fullName}
                </p>
              )}
            </div>
            <div>
              <Label className="mb-1.5">Roll Number *</Label>
              <Input
                value={form.rollNumber}
                onChange={(e) => set("rollNumber", e.target.value)}
                className={fieldCls("rollNumber")}
                placeholder="e.g. 21CS045"
              />
              {errors.rollNumber && (
                <p className="text-xs text-destructive mt-1">
                  {errors.rollNumber}
                </p>
              )}
            </div>
          </div>
        </FormSection>

        {/* 2. Department, Year & Section */}
        <FormSection
          index={2}
          title="Department, Year & Section"
          icon={IdCard}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="mb-1.5">Department *</Label>
              <Input
                value={form.department}
                onChange={(e) => set("department", e.target.value)}
                className={fieldCls("department")}
                placeholder="e.g. CSE"
              />
              {errors.department && (
                <p className="text-xs text-destructive mt-1">
                  {errors.department}
                </p>
              )}
            </div>
            <div>
              <Label className="mb-1.5">Year *</Label>
              <Select
                value={form.year}
                onValueChange={(v) => set("year", v)}
              >
                <SelectTrigger className={cn("w-full", fieldCls("year"))}>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {["1st", "2nd", "3rd", "4th"].map((y) => (
                    <SelectItem key={y} value={y}>
                      {y} Year
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.year && (
                <p className="text-xs text-destructive mt-1">{errors.year}</p>
              )}
            </div>
            <div>
              <Label className="mb-1.5">Section *</Label>
              <Input
                value={form.section}
                onChange={(e) => set("section", e.target.value)}
                className={fieldCls("section")}
                placeholder="e.g. A"
              />
              {errors.section && (
                <p className="text-xs text-destructive mt-1">
                  {errors.section}
                </p>
              )}
            </div>
          </div>
        </FormSection>

        {/* 3. College Name */}
        <FormSection index={3} title="College Name" icon={User}>
          <div>
            <Label className="mb-1.5">College / Institution *</Label>
            <Input
              value={form.collegeName}
              onChange={(e) => set("collegeName", e.target.value)}
              className={fieldCls("collegeName")}
              placeholder="e.g. Anna University"
            />
            {errors.collegeName && (
              <p className="text-xs text-destructive mt-1">
                {errors.collegeName}
              </p>
            )}
          </div>
        </FormSection>

        {/* 4. Selected Sport & Event Category */}
        <FormSection
          index={4}
          title="Selected Sport & Category"
          icon={Ticket}
          description="Choose what you'll be competing in."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5">Sport *</Label>
              <Select
                value={form.selectedSport}
                onValueChange={(v) => {
                  set("selectedSport", v);
                  set("eventCategory", "");
                  set("isTeamGame", isTeamSport(v));
                }}
              >
                <SelectTrigger className={cn("w-full", fieldCls("selectedSport"))}>
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent>
                  {sports.map((s) => (
                    <SelectItem key={s} value={s}>
                      {getSportIcon(s)} {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.selectedSport && (
                <p className="text-xs text-destructive mt-1">
                  {errors.selectedSport}
                </p>
              )}
            </div>
            <div>
              <Label className="mb-1.5">Event Category *</Label>
              <Select
                value={form.eventCategory}
                onValueChange={(v) => set("eventCategory", v)}
                disabled={!form.selectedSport}
              >
                <SelectTrigger className={cn("w-full", fieldCls("eventCategory"))}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                  {categories.length === 0 && (
                    <SelectItem value="_none" disabled>
                      No categories for this sport
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.eventCategory && (
                <p className="text-xs text-destructive mt-1">
                  {errors.eventCategory}
                </p>
              )}
            </div>
          </div>
        </FormSection>

        {/* 5. Team Details (conditional) */}
        {form.isTeamGame && (
          <FormSection
            index={5}
            title="Team Details"
            icon={User}
            description="Required because this is a team sport."
          >
            <div className="flex items-center justify-between py-2 mb-3">
              <Label htmlFor="team-toggle">Is this a team game?</Label>
              <Switch
                id="team-toggle"
                checked={form.isTeamGame}
                onCheckedChange={(v) => set("isTeamGame", v)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5">Team Name *</Label>
                <Input
                  value={form.teamName}
                  onChange={(e) => set("teamName", e.target.value)}
                  className={fieldCls("teamName")}
                  placeholder="e.g. Thunder Strikers"
                />
                {errors.teamName && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.teamName}
                  </p>
                )}
              </div>
              <div>
                <Label className="mb-1.5">Captain Name *</Label>
                <Input
                  value={form.captainName}
                  onChange={(e) => set("captainName", e.target.value)}
                  className={fieldCls("captainName")}
                  placeholder="Team captain"
                />
                {errors.captainName && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.captainName}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <Label>Team Members</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addMember}
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Member
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                {form.members.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground w-6">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <Input
                      value={m}
                      onChange={(e) => updateMember(i, e.target.value)}
                      placeholder={`Member ${i + 1} name`}
                      className="text-sm"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeMember(i)}
                      className="shrink-0"
                      aria-label="Remove member"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
                {form.members.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">
                    Click "Add Member" to add team members (excluding captain).
                  </p>
                )}
              </div>
            </div>
          </FormSection>
        )}

        {/* 6. College ID Card */}
        <FormSection
          index={form.isTeamGame ? 6 : 5}
          title="Valid College ID Card"
          icon={IdCard}
          description="Upload a clear image of your college ID. Max 5MB."
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleFile(e.target.files?.[0], "idCardUrl")
                }
              />
              <span className="inline-flex items-center gap-2 glass-card !rounded-lg px-4 py-2.5 text-sm hover:bg-accent/50 transition-colors">
                <Upload className="w-4 h-4" />
                {form.idCardUrl ? "Change file" : "Upload ID Card"}
              </span>
            </label>
            {form.idCardUrl && (
              <div className="flex items-center gap-2">
                <img
                  src={form.idCardUrl}
                  alt="ID card preview"
                  className="w-12 h-12 object-cover rounded-md border border-border"
                />
                <CheckCircle2 className="w-4 h-4 text-foreground" />
                <span className="text-xs text-muted-foreground">
                  Uploaded
                </span>
              </div>
            )}
          </div>
          {errors.idCardUrl && (
            <p className="text-xs text-destructive mt-2">
              {errors.idCardUrl}
            </p>
          )}
        </FormSection>

        {/* 7. Contact Number & Email */}
        <FormSection
          index={form.isTeamGame ? 7 : 6}
          title="Contact Number & Email"
          icon={Phone}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5">Contact Number *</Label>
              <Input
                value={form.contactNumber}
                onChange={(e) => set("contactNumber", e.target.value)}
                className={fieldCls("contactNumber")}
                placeholder="10-digit mobile number"
              />
              {errors.contactNumber && (
                <p className="text-xs text-destructive mt-1">
                  {errors.contactNumber}
                </p>
              )}
            </div>
            <div>
              <Label className="mb-1.5">Email *</Label>
              <Input
                type="email"
                value={form.emailId}
                onChange={(e) => set("emailId", e.target.value)}
                className={fieldCls("emailId")}
                placeholder="you@example.com"
              />
              {errors.emailId && (
                <p className="text-xs text-destructive mt-1">
                  {errors.emailId}
                </p>
              )}
            </div>
          </div>
        </FormSection>

        {/* 8. Emergency Contact */}
        <FormSection
          index={form.isTeamGame ? 8 : 7}
          title="Emergency Contact"
          icon={Heart}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="mb-1.5">Name *</Label>
              <Input
                value={form.emergencyName}
                onChange={(e) => set("emergencyName", e.target.value)}
                className={fieldCls("emergencyName")}
                placeholder="Emergency contact name"
              />
              {errors.emergencyName && (
                <p className="text-xs text-destructive mt-1">
                  {errors.emergencyName}
                </p>
              )}
            </div>
            <div>
              <Label className="mb-1.5">Phone *</Label>
              <Input
                value={form.emergencyPhone}
                onChange={(e) => set("emergencyPhone", e.target.value)}
                className={fieldCls("emergencyPhone")}
                placeholder="10-digit mobile number"
              />
              {errors.emergencyPhone && (
                <p className="text-xs text-destructive mt-1">
                  {errors.emergencyPhone}
                </p>
              )}
            </div>
            <div>
              <Label className="mb-1.5">Relation *</Label>
              <Select
                value={form.emergencyRelation}
                onValueChange={(v) => set("emergencyRelation", v)}
              >
                <SelectTrigger
                  className={cn("w-full", fieldCls("emergencyRelation"))}
                >
                  <SelectValue placeholder="Select relation" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.emergencyRelation && (
                <p className="text-xs text-destructive mt-1">
                  {errors.emergencyRelation}
                </p>
              )}
            </div>
          </div>
        </FormSection>

        {/* 9. Medical Fitness */}
        <FormSection
          index={form.isTeamGame ? 9 : 8}
          title="Medical Fitness"
          icon={ShieldCheck}
        >
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={form.fitnessConfirmed}
                onCheckedChange={(v) => set("fitnessConfirmed", !!v)}
                className="mt-0.5"
              />
              <span className="text-sm">
                I declare I am medically fit to participate in this sporting
                event and accept full responsibility for my health.
              </span>
            </label>
            {errors.fitnessConfirmed && (
              <p className="text-xs text-destructive">
                {errors.fitnessConfirmed}
              </p>
            )}
            <div>
              <Label className="mb-1.5">Blood Group *</Label>
              <Select
                value={form.bloodGroup}
                onValueChange={(v) => set("bloodGroup", v)}
              >
                <SelectTrigger
                  className={cn("w-full sm:w-48", fieldCls("bloodGroup"))}
                >
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_GROUPS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.bloodGroup && (
                <p className="text-xs text-destructive mt-1">
                  {errors.bloodGroup}
                </p>
              )}
            </div>
          </div>
        </FormSection>

        {/* 10. Registration Fee */}
        <FormSection
          index={form.isTeamGame ? 10 : 9}
          title="Registration Fee"
          icon={Ticket}
        >
          {event.entryFeeIsFree ? (
            <div className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-display text-2xl tracking-wide">
                NO ENTRY FEE REQUIRED
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="glass-card !rounded-xl p-3 text-sm">
                <span className="text-muted-foreground">Fee: </span>
                <span className="font-mono font-bold">
                  ₹
                  {event.entryFeePerPlayer ||
                    event.entryFeePerTeam ||
                    "—"}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  ({event.entryFeePerPlayer ? "per player" : "per team"})
                </span>
              </div>
              <div>
                <Label className="mb-1.5">Transaction ID *</Label>
                <Input
                  value={form.paymentTxnId}
                  onChange={(e) => set("paymentTxnId", e.target.value)}
                  className={fieldCls("paymentTxnId")}
                  placeholder="UPI / bank transaction reference"
                />
                {errors.paymentTxnId && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.paymentTxnId}
                  </p>
                )}
              </div>
              <div>
                <Label className="mb-1.5">Upload Payment Receipt *</Label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFile(e.target.files?.[0], "paymentReceiptUrl")
                      }
                    />
                    <span className="inline-flex items-center gap-2 glass-card !rounded-lg px-4 py-2.5 text-sm hover:bg-accent/50 transition-colors">
                      <Upload className="w-4 h-4" />
                      {form.paymentReceiptUrl
                        ? "Change file"
                        : "Upload Receipt"}
                    </span>
                  </label>
                  {form.paymentReceiptUrl && (
                    <div className="flex items-center gap-2">
                      <img
                        src={form.paymentReceiptUrl}
                        alt="Receipt preview"
                        className="w-12 h-12 object-cover rounded-md border border-border"
                      />
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs text-muted-foreground">
                        Uploaded
                      </span>
                    </div>
                  )}
                </div>
                {errors.paymentReceiptUrl && (
                  <p className="text-xs text-destructive mt-2">
                    {errors.paymentReceiptUrl}
                  </p>
                )}
              </div>
            </div>
          )}
        </FormSection>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end sticky bottom-4 z-10">
          <Button
            variant="outline"
            onClick={() =>
              navigate("user-event-detail", { id: event.id })
            }
            className="glass-card"
          >
            Cancel
          </Button>
          <Button
            size="lg"
            onClick={submit}
            disabled={submitting}
            className="gap-2 sm:px-8"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {submitting ? "Submitting…" : "Submit Registration"}
          </Button>
        </div>
      </div>

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        registration={confirmation}
      />
    </main>
  );
}

export default ApplyForm;
