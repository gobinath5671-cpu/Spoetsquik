import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/* PATCH /api/registrations/[id]/status — approve / reject */
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
    const { status } = body as { status: "approved" | "rejected" | "pending" };

    if (!["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    const reg = await db.registration.update({
      where: { id },
      data: { status },
      include: { event: true },
    });
    return NextResponse.json({
      success: true,
      message: `Registration ${status}`,
      data: reg,
    });
  } catch (e) {
    console.error("[registration PATCH status] error", e);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
