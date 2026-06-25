"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";
import { api } from "@/lib/api";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Dock } from "@/components/layout/Dock";
import { ToastHost } from "@/components/common/ToastHost";

import { LoginPage } from "@/components/auth/LoginPage";
import { RegisterPage } from "@/components/auth/RegisterPage";

import { UserHome } from "@/components/user/UserHome";
import { UserEvents } from "@/components/user/UserEvents";
import { EventDetail } from "@/components/user/EventDetail";
import { ApplyForm } from "@/components/user/ApplyForm";
import { MyRegistrations } from "@/components/user/MyRegistrations";
import { UserProfile } from "@/components/user/UserProfile";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AddEvent } from "@/components/admin/AddEvent";
import { AllEvents } from "@/components/admin/AllEvents";
import { AllRegistrations } from "@/components/admin/AllRegistrations";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center animate-pulse-glow">
          <span className="font-display text-3xl">SF</span>
        </div>
      </div>
      <p className="font-display text-2xl tracking-widest animate-pulse">SPORTSFEST</p>
      <p className="font-accent italic text-sm text-muted-foreground">
        Loading the arena…
      </p>
    </div>
  );
}

export default function Home() {
  const { user, setUser } = useAuthStore();
  const { view, navigate } = useUIStore();
  const [bootstrapped, setBootstrapped] = useState(false);

  // Restore session on mount
  useEffect(() => {
    (async () => {
      const res = await api<{
        id: string;
        fullName: string;
        email: string;
        role: string;
      }>("/api/auth/me");
      if (res.success && res.data) {
        setUser({
          id: res.data.id,
          fullName: res.data.fullName,
          email: res.data.email,
          role: res.data.role as "student" | "admin",
          collegeName: (res.data as { collegeName?: string }).collegeName,
          department: (res.data as { department?: string }).department,
          year: (res.data as { year?: string }).year,
          section: (res.data as { section?: string }).section,
          rollNumber: (res.data as { rollNumber?: string }).rollNumber,
          phone: (res.data as { phone?: string }).phone,
          profilePicture: (res.data as { profilePicture?: string }).profilePicture,
        });
        // If on auth views, route to proper home
        if (view === "login" || view === "register") {
          navigate(res.data.role === "admin" ? "admin-dashboard" : "user-home");
        }
      } else {
        // Not logged in — ensure on login
        if (view !== "register") {
          navigate("login");
        }
      }
      setBootstrapped(true);
    })();
  }, []);

  // Guard: if not authenticated, only show auth views
  if (!bootstrapped) {
    return <LoadingScreen />;
  }

  const isAuthenticated = !!user;
  const isAdmin = user?.role === "admin";

  // Not authenticated → only auth views
  if (!isAuthenticated) {
    if (view === "register") {
      return (
        <>
          <ThemeToggle />
          <ToastHost />
          <RegisterPage />
        </>
      );
    }
    // default to login
    return (
      <>
        <ThemeToggle />
        <ToastHost />
        <LoginPage />
      </>
    );
  }

  // Authenticated — determine the page to render
  let page: React.ReactNode;

  if (isAdmin) {
    switch (view) {
      case "admin-dashboard":
        page = <AdminDashboard />;
        break;
      case "admin-add-event":
        page = <AddEvent />;
        break;
      case "admin-edit-event":
        page = <AddEvent />;
        break;
      case "admin-events":
        page = <AllEvents />;
        break;
      case "admin-registrations":
        page = <AllRegistrations />;
        break;
      case "admin-event-registrations":
        page = <AllRegistrations />;
        break;
      default:
        // admin trying to access user views → redirect to dashboard
        page = <AdminDashboard />;
    }
  } else {
    // student
    switch (view) {
      case "user-home":
        page = <UserHome />;
        break;
      case "user-events":
        page = <UserEvents />;
        break;
      case "user-event-detail":
        page = <EventDetail />;
        break;
      case "user-apply":
        page = <ApplyForm />;
        break;
      case "user-my-registrations":
        page = <MyRegistrations />;
        break;
      case "user-profile":
        page = <UserProfile />;
        break;
      default:
        page = <UserHome />;
    }
  }

  return (
    <>
      <ThemeToggle />
      <ToastHost />
      <main className="min-h-screen pb-32">{page}</main>
      <Dock />
    </>
  );
}
