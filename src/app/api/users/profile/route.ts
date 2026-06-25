import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/* GET /api/users/profile */
export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Authentication required" },
      { status: 401 }
    );
  }
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json(
      { success: false, message: "User not found" },
      { status: 404 }
    );
  }
  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      collegeName: user.collegeName,
      department: user.department,
      year: user.year,
      section: user.section,
      rollNumber: user.rollNumber,
      phone: user.phone,
      profilePicture: user.profilePicture,
      savedEvents: user.savedEvents,
      createdAt: user.createdAt,
    },
  });
}

/* PUT /api/users/profile */
export async function PUT(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }
    const body = await req.json();
    const user = await db.user.update({
      where: { id: session.userId },
      data: {
        fullName: body.fullName ?? undefined,
        collegeName: body.collegeName ?? undefined,
        department: body.department ?? undefined,
        year: body.year ?? undefined,
        section: body.section ?? undefined,
        rollNumber: body.rollNumber ?? undefined,
        phone: body.phone ?? undefined,
        profilePicture: body.profilePicture ?? undefined,
        savedEvents: body.savedEvents ?? undefined,
      },
    });
    return NextResponse.json({
      success: true,
      message: "Profile updated",
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        collegeName: user.collegeName,
        department: user.department,
        year: user.year,
        section: user.section,
        rollNumber: user.rollNumber,
        phone: user.phone,
        profilePicture: user.profilePicture,
        savedEvents: user.savedEvents,
      },
    });
  } catch (e) {
    console.error("[profile PUT] error", e);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
