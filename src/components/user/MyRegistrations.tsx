"use client";

import { useEffect, useState } from "react";
import {
  Ticket,
  Download,
  QrCode,
  Calendar,
  MapPin,
  User,
  Users,
  Loader2,
  FileText,
} from "lucide-react";
import { api, RegistrationItem } from "@/lib/api";
import { useUIStore } from "@/store/ui-store";
import { GlassCard } from "@/components/common/GlassCard";
import { StatusBadge, EmptyState } from "@/components/common/UI";
import { RowSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  formatDate,
  getSportIcon,
  downloadTextFile,
} from "@/lib/utils";
import { generateSlipPDF, generateSlipText } from "./ApplyForm";

export function MyRegistrations() {
  const { navigate, pushToast } = useUIStore();
  const [regs, setRegs] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrReg, setQrReg] = useState<RegistrationItem | null>(null);

  useEffect(() => {
    (async () => {
      const res = await api<RegistrationItem[]>("/api/registrations/my");
      if (res.success && res.data) setRegs(res.data);
      else if (res.message)
        pushToast({ type: "error", message: res.message });
      setLoading(false);
    })();
  }, [pushToast]);

  if (loading) {
    return (
      <main className="pb-32 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pt-24">
        <div className="skeleton h-12 w-72 rounded mb-6" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <RowSkeleton key={i} cols={4} />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="pb-32 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pt-24">
      <div className="mb-6">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">
          Dashboard
        </p>
        <h1 className="font-display text-5xl sm:text-6xl tracking-wide leading-none">
          My Registrations
        </h1>
        <p className="font-accent italic text-lg text-muted-foreground mt-1">
          {regs.length > 0
            ? `You have ${regs.length} registration${regs.length === 1 ? "" : "s"}.`
            : "Your registered events will appear here."}
        </p>
      </div>

      {regs.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No registrations yet"
          description="Browse events and apply to compete in inter-college sports tournaments."
          action={
            <Button
              onClick={() => navigate("user-events")}
              className="mt-2"
            >
              Browse Events
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {regs.map((reg) => {
            const ev = reg.event;
            return (
              <GlassCard key={reg.id} liquid className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={reg.status} />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        {formatDate(reg.appliedAt)}
                      </span>
                    </div>
                    <h3 className="font-display text-3xl tracking-wide leading-tight line-clamp-2">
                      {ev?.eventName || "Event"}
                    </h3>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">
                      {ev?.collegeName || reg.collegeName}
                    </p>
                  </div>
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-foreground text-background flex items-center justify-center text-2xl">
                    {getSportIcon(reg.selectedSport)}
                  </div>
                </div>

                {/* Registration code — prominent */}
                <div className="glass-card !rounded-xl px-4 py-3 mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                      Registration Code
                    </div>
                    <div className="font-mono text-lg font-bold tracking-wider">
                      {reg.registrationCode}
                    </div>
                  </div>
                  <Ticket className="w-5 h-5 opacity-50" />
                </div>

                {/* Quick info */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <User className="w-3 h-3 shrink-0" />
                    <span className="truncate">{reg.fullName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="text-base leading-none">
                      {getSportIcon(reg.selectedSport)}
                    </span>
                    <span className="truncate">
                      {reg.selectedSport}
                      {reg.eventCategory ? ` · ${reg.eventCategory}` : ""}
                    </span>
                  </div>
                  {ev && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {formatDate(ev.eventDate)}
                      </span>
                    </div>
                  )}
                  {ev?.venue && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{ev.venue}</span>
                    </div>
                  )}
                  {reg.isTeamGame && reg.teamName && (
                    <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                      <Users className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        Team: {reg.teamName} · Captain: {reg.captainName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    onClick={() => generateSlipPDF(reg)}
                    className="gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Slip
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setQrReg(reg)}
                    className="gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    QR
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      downloadTextFile(
                        `SF-${reg.registrationCode}.txt`,
                        generateSlipText(reg)
                      )
                    }
                    className="gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    TXT
                  </Button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* QR Code dialog */}
      <Dialog open={!!qrReg} onOpenChange={(v) => !v && setQrReg(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl tracking-wide text-center">
              Your QR Code
            </DialogTitle>
            <DialogDescription className="text-center">
              Present this at the venue for verification.
            </DialogDescription>
          </DialogHeader>
          {qrReg && (
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 bg-white rounded-xl">
                <img
                  src={qrReg.qrCodeData}
                  alt="Registration QR code"
                  className="w-56 h-56"
                />
              </div>
              <div className="text-center">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Registration Code
                </div>
                <div className="font-mono text-xl font-bold tracking-wider mt-1">
                  {qrReg.registrationCode}
                </div>
              </div>
              <Button
                onClick={() => generateSlipPDF(qrReg)}
                className="w-full gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF Slip
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default MyRegistrations;
