"use client";

import { cn } from "@/lib/utils";

export function EventCardSkeleton() {
  return (
    <div className="glass-card p-4 h-[360px] flex flex-col gap-3">
      <div className="skeleton h-36 rounded-xl" />
      <div className="skeleton h-4 w-20 rounded" />
      <div className="skeleton h-7 w-3/4 rounded" />
      <div className="skeleton h-3 w-1/2 rounded" />
      <div className="flex gap-2 mt-auto">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-16 rounded-full" />
      </div>
      <div className="skeleton h-9 w-full rounded-lg" />
    </div>
  );
}

export function EventListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-card p-5">
          <div className="skeleton h-4 w-20 rounded mb-3" />
          <div className="skeleton h-10 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

export function RowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className={cn("flex items-center gap-4 px-4 py-3")}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="skeleton h-4 flex-1 rounded" />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <RowSkeleton key={i} cols={cols} />
      ))}
    </div>
  );
}
