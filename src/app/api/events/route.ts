import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseJsonArray, safeJsonStringifyArray } from "@/lib/utils";

/* GET /api/events — public, with filters */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const sport = searchParams.get("sport") || undefined;
    const targetAudience = searchParams.get("targetAudience") || undefined;
    const fromDate = searchParams.get("fromDate") || undefined;
    const toDate = searchParams.get("toDate") || undefined;
    const college = searchParams.get("college") || undefined;
    const format = searchParams.get("format") || undefined;
    const search = searchParams.get("search") || undefined;
    const isFree = searchParams.get("isFree") || undefined;
    const limit = parseInt(searchParams.get("limit") || "0") || undefined;
    const sortBy = searchParams.get("sortBy") || "date";
    const order = (searchParams.get("order") || "asc") as "asc" | "desc";

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (targetAudience) where.targetAudience = targetAudience;
    if (format) where.tournamentFormat = format;
    if (isFree === "free") where.entryFeeIsFree = true;
    if (isFree === "paid") where.entryFeeIsFree = false;
    if (fromDate || toDate) {
      where.eventDate = {};
      if (fromDate) {
        const d = new Date(fromDate);
        if (!isNaN(d.getTime())) (where.eventDate as Record<string, unknown>).gte = d;
      }
      if (toDate) {
        // toDate may be date-only (YYYY-MM-DD) or a full ISO string.
        // For date-only, extend to end of that day (inclusive).
        const isDateOnly = toDate.length === 10;
        const base = new Date(toDate);
        if (!isNaN(base.getTime())) {
          const end = isDateOnly
            ? new Date(base.getTime() + 24 * 60 * 60 * 1000 - 1)
            : base;
          (where.eventDate as Record<string, unknown>).lte = end;
        }
      }
    }
    if (college) {
      where.collegeName = { contains: college };
    }
    if (search) {
      where.OR = [
        { eventName: { contains: search } },
        { collegeName: { contains: search } },
      ];
    }

    const orderBy: Record<string, "asc" | "desc"> = {};
    orderBy[sortBy === "createdAt" ? "createdAt" : "eventDate"] = order;

    const events = await db.event.findMany({
      where,
      orderBy,
      ...(limit ? { take: limit } : {}),
    });

    // Filter by sport (stored as JSON array string) and enrich counts
    const enriched = await Promise.all(
      events
        .filter((ev) => {
          if (!sport) return true;
          return parseJsonArray(ev.sportsAndGames).some(
            (s) => s.toLowerCase() === sport.toLowerCase()
          );
        })
        .map(async (ev) => {
          const regCount = await db.registration.count({
            where: { eventId: ev.id },
          });
          return {
            ...ev,
            categories: parseJsonArray(ev.categories),
            sportsAndGames: parseJsonArray(ev.sportsAndGames),
            registrationCount: regCount,
          };
        })
    );

    return NextResponse.json({ success: true, data: enriched });
  } catch (e) {
    console.error("[events GET] error", e);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/* POST /api/events — admin only */
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }
    if (session.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const event = await db.event.create({
      data: {
        collegeName: body.collegeName || "",
        eventName: body.eventName || "",
        eventDate: body.eventDate ? new Date(body.eventDate) : new Date(),
        reportingTime: body.reportingTime || "",
        venue: body.venue || "",
        chiefGuest: body.chiefGuest || "",
        categories: safeJsonStringifyArray(body.categories || []),
        sportsAndGames: safeJsonStringifyArray(body.sportsAndGames || []),
        tournamentFormat: body.tournamentFormat || "Knockout",
        eligibility: body.eligibility || "",
        prizesCashPrizes: body.prizesCashPrizes || "",
        prizesMedals: !!body.prizesMedals,
        prizesChampionship: !!body.prizesChampionship,
        prizesDetails: body.prizesDetails || "",
        entryFeePerTeam: Number(body.entryFeePerTeam) || 0,
        entryFeePerPlayer: Number(body.entryFeePerPlayer) || 0,
        entryFeeIsFree: body.entryFeeIsFree !== false,
        generalRules: body.generalRules || "",
        dresscode: body.dresscode || "",
        registrationDeadline: body.registrationDeadline
          ? new Date(body.registrationDeadline)
          : null,
        registrationLink: body.registrationLink || "",
        contactDirectorName: body.contactDirectorName || "",
        contactDirectorPhone: body.contactDirectorPhone || "",
        contactCaptainName: body.contactCaptainName || "",
        contactCaptainPhone: body.contactCaptainPhone || "",
        contactEmail: body.contactEmail || "",
        eventPoster: body.eventPoster || "",
        status: body.status || "upcoming",
        targetAudience: body.targetAudience || "College",
        createdBy: session.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Event created",
      data: { ...event, categories: parseJsonArray(event.categories), sportsAndGames: parseJsonArray(event.sportsAndGames) },
    });
  } catch (e) {
    console.error("[events POST] error", e);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
