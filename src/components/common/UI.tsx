"use client";

import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cls =
    status === "upcoming"
      ? "status-upcoming"
      : status === "ongoing"
      ? "status-ongoing"
      : status === "completed"
      ? "status-completed"
      : status === "approved"
      ? "status-approved"
      : status === "rejected"
      ? "status-rejected"
      : "status-pending";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-medium",
        cls,
        className
      )}
    >
      {status}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
      <div>
        <h1 className="font-display text-4xl sm:text-5xl tracking-wide leading-none">
          {title}
        </h1>
        {subtitle && (
          <p className="font-accent text-lg italic text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="hidden sm:flex w-12 h-12 rounded-xl glass-card items-center justify-center">
            <Icon className="w-5 h-5" strokeWidth={2} />
          </div>
        )}
        {action}
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <GlassCard className="p-10 text-center flex flex-col items-center gap-3">
      <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center mb-1">
        <Icon className="w-7 h-7 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h3 className="font-display text-2xl tracking-wide">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md font-accent italic">
          {description}
        </p>
      )}
      {action}
    </GlassCard>
  );
}
