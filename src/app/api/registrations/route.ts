import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseJsonArray } from "@/lib/utils";

/* GET /api/registrations — all registrations (admin) */
export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const eventId = searchParams.get("eventId") || undefined;
    const search = searchParams.get("search") || undefined;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (eventId) where.eventId = eventId;
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { rollNumber: { contains: search } },
        { registrationCode: { contains: search } },
      ];
    }

    const regs = await db.registration.findMany({
      where,
      include: { event: true },
      orderBy: { appliedAt: "desc" },
    });
    return NextResponse.json({
      success: true,
      data: regs.map((r) => ({
        ...r,
        members: parseJsonArray(r.members),
      })),
    });
  } catch (e) {
    console.error("[registrations GET] error", e);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
