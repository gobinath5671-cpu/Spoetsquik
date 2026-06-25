"use client";

import { useUIStore } from "@/store/ui-store";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ToastHost() {
  const { toasts, dismissToast } = useUIStore();

  return (
    <div className="fixed top-20 right-4 z-[2000] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const Icon =
          t.type === "success" ? CheckCircle2 : t.type === "error" ? XCircle : Info;
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto glass-card min-w-[260px] max-w-[360px] px-4 py-3 flex items-start gap-3 animate-slide-in-right",
              t.type === "error" && "glass-glow"
            )}
          >
            <Icon
              className={cn(
                "w-5 h-5 mt-0.5 shrink-0",
                t.type === "success" && "text-foreground",
                t.type === "error" && "text-foreground",
                t.type === "info" && "text-muted-foreground"
              )}
              strokeWidth={2}
            />
            <p className="text-sm flex-1 leading-snug">{t.message}</p>
            <button
              type="button"
              aria-label="Dismiss"
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => dismissToast(t.id)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
