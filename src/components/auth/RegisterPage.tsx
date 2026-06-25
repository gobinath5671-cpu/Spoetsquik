"use client";

import { useState, type FormEvent } from "react";
import {
  Trophy,
  Mail,
  Lock,
  User,
  Phone,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  Building2,
  Hash,
  Users,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GlassCard } from "@/components/common/GlassCard";
import { api } from "@/lib/api";
import { useAuthStore, type AuthUser } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";

interface RegisterForm {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  collegeName: string;
  department: string;
  year: string;
  section: string;
  rollNumber: string;
  phone: string;
}

const EMPTY_FORM: RegisterForm = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  collegeName: "",
  department: "",
  year: "",
  section: "",
  rollNumber: "",
  phone: "",
};

export function RegisterPage() {
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useUIStore((s) => s.navigate);
  const pushToast = useUIStore((s) => s.pushToast);

  const [form, setForm] = useState<RegisterForm>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): string | null {
    if (!form.fullName.trim()) return "Full name is required";
    if (!form.email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      return "Please enter a valid email address";
    if (form.password.length < 6)
      return "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword)
      return "Passwords do not match";
    if (!form.collegeName.trim()) return "College name is required";
    if (!form.department.trim()) return "Department is required";
    if (!form.year) return "Please select your year";
    if (!form.section) return "Please select your section";
    if (!form.rollNumber.trim()) return "Roll number is required";
    if (form.phone && !/^[0-9+\-\s]{6,15}$/.test(form.phone.trim()))
      return "Please enter a valid phone number";
    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    const error = validate();
    if (error) {
      pushToast({ type: "error", message: error });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        collegeName: form.collegeName.trim(),
        department: form.department.trim(),
        year: form.year,
        section: form.section,
        rollNumber: form.rollNumber.trim(),
        phone: form.phone.trim(),
      };
      const res = await api<AuthUser>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res.success && res.data) {
        setUser(res.data);
        pushToast({
          type: "success",
          message: `Welcome to the arena, ${res.data.fullName.split(" ")[0]}!`,
        });
        navigate("user-home");
      } else {
        pushToast({
          type: "error",
          message: res.message || "Registration failed. Please try again.",
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
        <span className="text-[26vw] sm:text-[22vw]">ARENA</span>
      </div>
      <div
        className="pointer-events-none absolute -top-40 -left-40 h-[420px] w-[420px] rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--accent-glow)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-[420px] w-[420px] rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--accent-glow)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="animate-fade-in-up mb-8 text-center sm:mb-10">
          <div className="mb-3 inline-flex items-center justify-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-muted-foreground backdrop-blur-sm">
            <Trophy className="size-3" />
            <span>Athlete Registration</span>
          </div>
          <h1 className="font-display text-5xl leading-none tracking-tight sm:text-7xl md:text-8xl">
            JOIN THE ARENA
          </h1>
          <p className="font-accent mt-2 text-xl italic text-muted-foreground sm:text-2xl">
            Create your athlete profile
          </p>
        </div>

        {/* Glass register card */}
        <GlassCard
          liquid
          glow
          className="animate-fade-in-up w-full max-w-2xl p-6 sm:p-8"
          style={{ animationDelay: "80ms" }}
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-foreground text-background">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl tracking-wide">STUDENT SIGN UP</h2>
              <p className="text-xs text-muted-foreground">
                Fill in your details to register for events
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Personal info */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="reg-fullName" className="text-xs uppercase tracking-wider">
                  <User className="size-3.5" />
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="reg-fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Virat Kohli"
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  disabled={loading}
                  required
                  aria-label="Full name"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-email" className="text-xs uppercase tracking-wider">
                  <Mail className="size-3.5" />
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="reg-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@college.edu"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  disabled={loading}
                  required
                  aria-label="Email address"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-phone" className="text-xs uppercase tracking-wider">
                  <Phone className="size-3.5" />
                  Phone
                </Label>
                <Input
                  id="reg-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  disabled={loading}
                  aria-label="Phone number"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-password" className="text-xs uppercase tracking-wider">
                  <Lock className="size-3.5" />
                  Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
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

              <div className="space-y-2">
                <Label htmlFor="reg-confirmPassword" className="text-xs uppercase tracking-wider">
                  <ShieldCheck className="size-3.5" />
                  Confirm Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="reg-confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  disabled={loading}
                  required
                  aria-label="Confirm password"
                  aria-invalid={
                    form.confirmPassword.length > 0 &&
                    form.password !== form.confirmPassword
                  }
                  className="h-11"
                />
                {form.confirmPassword.length > 0 &&
                  form.password !== form.confirmPassword && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-border/60" />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Academic Details
              </span>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            {/* Academic info */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="reg-collegeName" className="text-xs uppercase tracking-wider">
                  <Building2 className="size-3.5" />
                  College Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="reg-collegeName"
                  name="collegeName"
                  type="text"
                  placeholder="e.g. Anna University"
                  value={form.collegeName}
                  onChange={(e) => update("collegeName", e.target.value)}
                  disabled={loading}
                  required
                  aria-label="College name"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-department" className="text-xs uppercase tracking-wider">
                  <GraduationCap className="size-3.5" />
                  Department <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="reg-department"
                  name="department"
                  type="text"
                  placeholder="e.g. CSE, ECE, Mech"
                  value={form.department}
                  onChange={(e) => update("department", e.target.value)}
                  disabled={loading}
                  required
                  aria-label="Department"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-rollNumber" className="text-xs uppercase tracking-wider">
                  <Hash className="size-3.5" />
                  Roll Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="reg-rollNumber"
                  name="rollNumber"
                  type="text"
                  placeholder="e.g. CS21B012"
                  value={form.rollNumber}
                  onChange={(e) => update("rollNumber", e.target.value)}
                  disabled={loading}
                  required
                  aria-label="Roll number"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider">
                  <Users className="size-3.5" />
                  Year <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.year}
                  onValueChange={(v) => update("year", v)}
                  disabled={loading}
                >
                  <SelectTrigger className="h-11 w-full" aria-label="Academic year">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider">
                  <Users className="size-3.5" />
                  Section <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.section}
                  onValueChange={(v) => update("section", v)}
                  disabled={loading}
                >
                  <SelectTrigger className="h-11 w-full" aria-label="Section">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                  </SelectContent>
                </Select>
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
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 border-t border-border/60 pt-5 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("login")}
                className="group inline-flex items-center gap-1.5 font-medium text-foreground underline-offset-4 hover:underline"
              >
                <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                Login
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
