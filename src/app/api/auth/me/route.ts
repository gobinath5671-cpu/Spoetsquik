import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ success: false, data: null });
  }
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ success: false, data: null });
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
    },
  });
}
