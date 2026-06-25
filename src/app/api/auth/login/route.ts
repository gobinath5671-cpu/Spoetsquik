import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, setSessionCookie, getSession } from "@/lib/auth";

/* GET — check current session (used for "me" / resume) */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        collegeName: true,
        department: true,
        year: true,
        section: true,
        rollNumber: true,
        phone: true,
        profilePicture: true,
      },
    });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: user });
  } catch (e) {
    console.error("[auth/login] GET error", e);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

/* POST — email + password login (admin or student) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await db.user.findUnique({ where: { email: normalizedEmail } });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const ok = verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    await setSessionCookie({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    return NextResponse.json({
      success: true,
      message: "Login successful",
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
      },
    });
  } catch (e) {
    console.error("[auth/login] POST error", e);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
