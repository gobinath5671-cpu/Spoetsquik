import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseJsonArray, safeJsonStringifyArray } from "@/lib/utils";

/* GET single event */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = await db.event.findUnique({ where: { id } });
    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }
    const regCount = await db.registration.count({ where: { eventId: id } });
    return NextResponse.json({
      success: true,
      data: {
        ...event,
        categories: parseJsonArray(event.categories),
        sportsAndGames: parseJsonArray(event.sportsAndGames),
        registrationCount: regCount,
      },
    });
  } catch (e) {
    console.error("[event GET] error", e);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/* PUT — admin only */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }
    const { id } = await params;
    const body = await req.json();

    const event = await db.event.update({
      where: { id },
      data: {
        collegeName: body.collegeName ?? undefined,
        eventName: body.eventName ?? undefined,
        eventDate: body.eventDate ? new Date(body.eventDate) : undefined,
        reportingTime: body.reportingTime ?? undefined,
        venue: body.venue ?? undefined,
        chiefGuest: body.chiefGuest ?? undefined,
        categories:
          body.categories !== undefined
            ? safeJsonStringifyArray(body.categories)
            : undefined,
        sportsAndGames:
          body.sportsAndGames !== undefined
            ? safeJsonStringifyArray(body.sportsAndGames)
            : undefined,
        tournamentFormat: body.tournamentFormat ?? undefined,
        eligibility: body.eligibility ?? undefined,
        prizesCashPrizes: body.prizesCashPrizes ?? undefined,
        prizesMedals: body.prizesMedals !== undefined ? !!body.prizesMedals : undefined,
        prizesChampionship:
          body.prizesChampionship !== undefined
            ? !!body.prizesChampionship
            : undefined,
        prizesDetails: body.prizesDetails ?? undefined,
        entryFeePerTeam: body.entryFeePerTeam !== undefined ? Number(body.entryFeePerTeam) : undefined,
        entryFeePerPlayer:
          body.entryFeePerPlayer !== undefined ? Number(body.entryFeePerPlayer) : undefined,
        entryFeeIsFree: body.entryFeeIsFree !== undefined ? body.entryFeeIsFree : undefined,
        generalRules: body.generalRules ?? undefined,
        dresscode: body.dresscode ?? undefined,
        registrationDeadline: body.registrationDeadline
          ? new Date(body.registrationDeadline)
          : body.registrationDeadline === null
          ? null
          : undefined,
        registrationLink: body.registrationLink ?? undefined,
        contactDirectorName: body.contactDirectorName ?? undefined,
        contactDirectorPhone: body.contactDirectorPhone ?? undefined,
        contactCaptainName: body.contactCaptainName ?? undefined,
        contactCaptainPhone: body.contactCaptainPhone ?? undefined,
        contactEmail: body.contactEmail ?? undefined,
        eventPoster: body.eventPoster ?? undefined,
        status: body.status ?? undefined,
        targetAudience: body.targetAudience ?? undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Event updated",
      data: {
        ...event,
        categories: parseJsonArray(event.categories),
        sportsAndGames: parseJsonArray(event.sportsAndGames),
      },
    });
  } catch (e) {
    console.error("[event PUT] error", e);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/* PATCH status toggle */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }
    const { id } = await params;
    const body = await req.json();
    const { status } = body as { status: string };

    const event = await db.event.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json({
      success: true,
      message: "Status updated",
      data: event,
    });
  } catch (e) {
    console.error("[event PATCH] error", e);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/* DELETE — admin only */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }
    const { id } = await params;
    await db.registration.deleteMany({ where: { eventId: id } });
    await db.event.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Event deleted" });
  } catch (e) {
    console.error("[event DELETE] error", e);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
