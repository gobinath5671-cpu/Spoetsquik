import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseJsonArray } from "@/lib/utils";

/* GET /api/registrations/my — current user's registrations */
export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }
    const regs = await db.registration.findMany({
      where: { studentId: session.userId },
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
    console.error("[registrations/my] error", e);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
