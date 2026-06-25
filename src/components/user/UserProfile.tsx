"use client";

import { useEffect, useState } from "react";
import {
  User as UserIcon,
  Upload,
  Save,
  Loader2,
  Bookmark,
  KeyRound,
  Info,
  Calendar,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";
import { api, EventItem } from "@/lib/api";
import { useUIStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { GlassCard } from "@/components/common/GlassCard";
import { EventCardSkeleton } from "@/components/common/Skeletons";
import { StatusBadge } from "@/components/common/UI";
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
import {
  initials,
  fileToDataUrl,
  formatDate,
  getSportIcon,
  parseJsonArray,
  cn,
} from "@/lib/utils";

interface ProfileData {
  id: string;
  fullName: string;
  email: string;
  role: string;
  collegeName?: string;
  department?: string;
  year?: string;
  section?: string;
  rollNumber?: string;
  phone?: string;
  profilePicture?: string;
  savedEvents: string;
  createdAt?: string;
}

export function UserProfile() {
  const { navigate, pushToast } = useUIStore();
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedEvents, setSavedEvents] = useState<EventItem[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  /* Form state */
  const [fullName, setFullName] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [section, setSection] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePicture, setProfilePicture] = useState<string>("");

  useEffect(() => {
    (async () => {
      const res = await api<ProfileData>("/api/users/profile");
      if (res.success && res.data) {
        setProfile(res.data);
        setFullName(res.data.fullName || "");
        setCollegeName(res.data.collegeName || "");
        setDepartment(res.data.department || "");
        setYear(res.data.year || "");
        setSection(res.data.section || "");
        setRollNumber(res.data.rollNumber || "");
        setPhone(res.data.phone || "");
        setProfilePicture(res.data.profilePicture || "");

        /* Fetch saved events */
        const savedIds = parseJsonArray(res.data.savedEvents);
        if (savedIds.length === 0) {
          setLoadingSaved(false);
          return;
        }
        const fetched = await Promise.all(
          savedIds.map((id) => api<EventItem>(`/api/events/${id}`))
        );
        setSavedEvents(
          fetched
            .filter((r) => r.success && r.data)
            .map((r) => r.data as EventItem)
        );
      } else if (res.message) {
        pushToast({ type: "error", message: res.message });
      }
      setLoading(false);
      setLoadingSaved(false);
    })();
  }, [pushToast]);

  const handlePicture = async (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      pushToast({ type: "error", message: "Image too large. Max 5MB." });
      return;
    }
    try {
      const url = await fileToDataUrl(file);
      setProfilePicture(url);
    } catch {
      pushToast({ type: "error", message: "Could not read image." });
    }
  };

  const save = async () => {
    if (!fullName.trim()) {
      pushToast({ type: "error", message: "Full name is required." });
      return;
    }
    setSaving(true);
    const res = await api<ProfileData>("/api/users/profile", {
      method: "PUT",
      body: JSON.stringify({
        fullName,
        collegeName,
        department,
        year,
        section,
        rollNumber,
        phone,
        profilePicture,
      }),
    });
    setSaving(false);
    if (res.success && res.data) {
      setProfile(res.data);
      if (user) {
        setUser({
          ...user,
          fullName: res.data.fullName,
          collegeName: res.data.collegeName,
          department: res.data.department,
          year: res.data.year,
          section: res.data.section,
          rollNumber: res.data.rollNumber,
          phone: res.data.phone,
          profilePicture: res.data.profilePicture,
        });
      }
      pushToast({ type: "success", message: "Profile updated." });
    } else {
      pushToast({
        type: "error",
        message: res.message || "Could not save profile.",
      });
    }
  };

  if (loading) {
    return (
      <main className="pb-32 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto pt-24">
        <div className="skeleton h-12 w-56 rounded mb-6" />
        <div className="skeleton h-48 w-full rounded-2xl mb-4" />
        <div className="skeleton h-48 w-full rounded-2xl" />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="pb-32 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto pt-24">
        <GlassCard className="p-10 text-center">
          <Info className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <h2 className="font-display text-3xl tracking-wide">
            Profile unavailable
          </h2>
          <p className="text-sm text-muted-foreground font-accent italic mt-1">
            Could not load your profile. Try again later.
          </p>
        </GlassCard>
      </main>
    );
  }

  return (
    <main className="pb-32 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pt-24">
      <div className="mb-6">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">
          Account
        </p>
        <h1 className="font-display text-5xl sm:text-6xl tracking-wide leading-none">
          My Profile
        </h1>
        <p className="font-accent italic text-lg text-muted-foreground mt-1">
          Keep your details current for faster registrations.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Avatar + identity card */}
        <GlassCard liquid className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-full bg-foreground text-background flex items-center justify-center font-display text-4xl tracking-wider overflow-hidden">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials(fullName)
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full glass-card flex items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePicture(e.target.files?.[0])}
                />
                <Upload className="w-3.5 h-3.5" />
              </label>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="font-display text-3xl tracking-wide">
                {profile.fullName}
              </h2>
              <p className="text-xs font-mono text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                <Mail className="w-3 h-3" />
                {profile.email}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-foreground text-background">
                  {profile.role}
                </span>
                {profile.department && (
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border border-border">
                    {profile.department}
                  </span>
                )}
                {profile.year && (
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border border-border">
                    {profile.year} Year
                  </span>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Edit form */}
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-lg glass-card flex items-center justify-center">
              <UserIcon className="w-4 h-4" />
            </div>
            <h3 className="font-display text-2xl tracking-wide">
              Edit Details
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5">Full Name *</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div>
              <Label className="mb-1.5">Roll Number</Label>
              <Input
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="e.g. 21CS045"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5">College / Institution</Label>
              <Input
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="e.g. Anna University"
              />
            </div>
            <div>
              <Label className="mb-1.5">Department</Label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. CSE"
              />
            </div>
            <div>
              <Label className="mb-1.5">Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-full">
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
            </div>
            <div>
              <Label className="mb-1.5">Section</Label>
              <Input
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. A"
              />
            </div>
            <div>
              <Label className="mb-1.5">Phone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
              />
            </div>
          </div>

          <div className="flex justify-end mt-5">
            <Button onClick={save} disabled={saving} className="gap-2 px-6">
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </GlassCard>

        {/* Bookmarked events */}
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg glass-card flex items-center justify-center">
                <Bookmark className="w-4 h-4" />
              </div>
              <h3 className="font-display text-2xl tracking-wide">
                Bookmarked Events
              </h3>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {savedEvents.length} SAVED
            </span>
          </div>

          {loadingSaved ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <EventCardSkeleton />
              <EventCardSkeleton />
            </div>
          ) : savedEvents.length === 0 ? (
            <div className="text-center py-8">
              <Bookmark className="w-8 h-8 mx-auto opacity-40 mb-2" />
              <p className="text-sm text-muted-foreground font-accent italic">
                No bookmarked events yet. Tap the bookmark icon on any event to
                save it here.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => navigate("user-events")}
              >
                Browse Events
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {savedEvents.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => navigate("user-event-detail", { id: ev.id })}
                  className="glass-card !rounded-xl p-3 text-left flex gap-3 hover:bg-accent/50 transition-colors group"
                >
                  <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-3xl shrink-0 overflow-hidden">
                    {ev.eventPoster ? (
                      <img
                        src={ev.eventPoster}
                        alt={ev.eventName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getSportIcon(
                        parseJsonArray(
                          ev.sportsAndGames as unknown as string
                        )[0] || ""
                      )
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h4 className="font-display text-lg tracking-wide leading-tight line-clamp-1 group-hover:underline">
                        {ev.eventName}
                      </h4>
                      <StatusBadge status={ev.status} />
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(ev.eventDate)}
                      </span>
                      {ev.venue && (
                        <span className="inline-flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3" />
                          {ev.venue}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                      {ev.collegeName}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Account info */}
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg glass-card flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
            <h3 className="font-display text-2xl tracking-wide">Account</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 py-2 border-b border-border/50">
              <Mail className="w-4 h-4 opacity-60" />
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Email
                </div>
                <div className="text-sm">{profile.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 py-2 border-b border-border/50">
              <Phone className="w-4 h-4 opacity-60" />
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Phone
                </div>
                <div className="text-sm">{profile.phone || "—"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 py-2 border-b border-border/50">
              <UserIcon className="w-4 h-4 opacity-60" />
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Role
                </div>
                <div className="text-sm capitalize">{profile.role}</div>
              </div>
            </div>
            {profile.createdAt && (
              <div className="flex items-center gap-2 py-2 border-b border-border/50">
                <Calendar className="w-4 h-4 opacity-60" />
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Joined
                  </div>
                  <div className="text-sm">
                    {formatDate(profile.createdAt)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Password section */}
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-lg glass-card flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <h3 className="font-display text-2xl tracking-wide">
              Change Password
            </h3>
          </div>
          <div className="glass-card !rounded-xl p-4 flex items-start gap-3">
            <Info className="w-4 h-4 mt-0.5 shrink-0 opacity-60" />
            <div className="text-sm text-muted-foreground">
              Password changes are not self-service for security reasons. Please
              contact the SportsFest administrator at{" "}
              <a
                href="mailto:admin@sportsfest.in"
                className="font-mono underline hover:text-foreground"
              >
                admin@sportsfest.in
              </a>{" "}
              to request a password reset.
            </div>
          </div>
        </GlassCard>
      </div>
    </main>
  );
}

export default UserProfile;
