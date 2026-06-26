"use client";

import { useState, type FormEvent } from "react";
import {
  Trophy,
  Mail,
  Lock,
  ArrowRight,
  UserPlus,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/common/GlassCard";
import { api } from "@/lib/api";
import { useAuthStore, type AuthUser } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";

export function LoginPage() {
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useUIStore((s) => s.navigate);
  const pushToast = useUIStore((s) => s.pushToast);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    if (!email.trim() || !password) {
      pushToast({ type: "error", message: "Please enter your email and password." });
      return;
    }
    setLoading(true);
    try {
      const res = await api<AuthUser>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (res.success && res.data) {
        setUser(res.data);
        pushToast({
          type: "success",
          message: `Welcome back, ${res.data.fullName.split(" ")[0]}!`,
        });
        if (res.data.role === "admin") {
          navigate("admin-dashboard");
        } else {
          navigate("user-home");
        }
      } else {
        pushToast({
          type: "error",
          message: res.message || "Invalid email or password.",
        });
      }
    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.35]" />
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-60" />
      <div
        className="pointer-events-none absolute inset-0 select-none font-display text-foreground/[0.03] leading-none flex items-center justify-center"
        aria-hidden="true"
      >
        <span className="text-[28vw] sm:text-[24vw]">SPORTSFEST</span>
      </div>
      <div
        className="pointer-events-none absolute -top-40 -right-40 h-[420px] w-[420px] rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--accent-glow)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-40 h-[420px] w-[420px] rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--accent-glow)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="animate-fade-in-up mb-8 text-center sm:mb-10">
          <div className="mb-3 inline-flex items-center justify-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-muted-foreground backdrop-blur-sm">
            <Trophy className="size-3" />
            <span>Est. 2025</span>
          </div>
          <h1 className="font-display text-6xl leading-none tracking-tight sm:text-7xl md:text-8xl">
            SPORTSFEST
          </h1>
          <p className="font-accent mt-2 text-xl italic text-muted-foreground sm:text-2xl">
            Inter-College Sports Events Portal
          </p>
        </div>

        {/* Glass login card */}
        <GlassCard
          liquid
          glow
          className="animate-fade-in-up w-full max-w-md p-6 sm:p-8"
          style={{ animationDelay: "80ms" }}
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-foreground text-background">
              <Trophy className="size-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl tracking-wide">SIGN IN</h2>
              <p className="text-xs text-muted-foreground">
                Enter your credentials to continue
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-xs uppercase tracking-wider">
                <Mail className="size-3.5" />
                Email
              </Label>
              <Input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                aria-label="Email address"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-xs uppercase tracking-wider">
                <Lock className="size-3.5" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  aria-label="Password"
                  className="h-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="group h-11 w-full text-sm font-semibold tracking-wide"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Login
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>


          <div className="mt-6 border-t border-border/60 pt-5 text-center">
            <p className="text-sm text-muted-foreground">
              New here?{" "}
              <button
                type="button"
                onClick={() => navigate("register")}
                className="group inline-flex items-center gap-1.5 font-medium text-foreground underline-offset-4 hover:underline"
              >
                <UserPlus className="size-3.5" />
                Register
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </p>
          </div>
        </GlassCard>

        <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
          SportsFest · Inter-College Championship Series
        </p>
      </div>
    </main>
  );
}
