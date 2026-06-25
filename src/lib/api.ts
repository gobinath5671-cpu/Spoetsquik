"use client";

/* Lightweight fetch wrapper returning consistent { success, data, message } */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export async function api<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
      credentials: "include",
    });
    const json = await res.json();
    return json as ApiResponse<T>;
  } catch (e) {
    console.error("[api] network error", e);
    return { success: false, message: "Network error. Please try again." };
  }
}

export interface EventItem {
  id: string;
  collegeName: string;
  eventName: string;
  eventDate: string;
  reportingTime: string;
  venue: string;
  chiefGuest: string;
  categories: string[];
  sportsAndGames: string[];
  tournamentFormat: string;
  eligibility: string;
  prizesCashPrizes: string;
  prizesMedals: boolean;
  prizesChampionship: boolean;
  prizesDetails: string;
  entryFeePerTeam: number;
  entryFeePerPlayer: number;
  entryFeeIsFree: boolean;
  generalRules: string;
  dresscode: string;
  registrationDeadline: string | null;
  registrationLink: string;
  contactDirectorName: string;
  contactDirectorPhone: string;
  contactCaptainName: string;
  contactCaptainPhone: string;
  contactEmail: string;
  eventPoster: string;
  status: string;
  targetAudience: string;
  registrationCount?: number;
  createdAt: string;
}

export interface RegistrationItem {
  id: string;
  eventId: string;
  studentId: string | null;
  registrationCode: string;
  qrCodeData: string;
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
  isPaid: boolean;
  status: string;
  appliedAt: string;
  event?: EventItem;
}
