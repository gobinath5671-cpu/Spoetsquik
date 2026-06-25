"use client";

import { cn } from "@/lib/utils";
import { forwardRef, HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  liquid?: boolean;
  glow?: boolean;
  as?: "div" | "section" | "article" | "aside";
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, liquid = false, glow = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "glass-card relative",
          liquid && "glass-card-liquid",
          glow && "glass-glow",
          className
        )}
        {...props}
      >
        {/* content sits above ::before pseudo */}
        <div className="relative z-10 h-full">{children}</div>
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";
