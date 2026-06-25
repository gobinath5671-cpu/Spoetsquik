import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName,
      email,
      password,
      collegeName,
      department,
      year,
      section,
      rollNumber,
      phone,
    } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Full name, email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Email already registered. Please login." },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);
    const user = await db.user.create({
      data: {
        fullName: fullName.trim(),
        email: normalizedEmail,
        passwordHash,
        collegeName: collegeName || "",
        department: department || "",
        year: year || "",
        section: section || "",
        rollNumber: rollNumber || "",
        phone: phone || "",
        role: "student",
      },
    });

    await setSessionCookie({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    return NextResponse.json({
      success: true,
      message: "Registration successful",
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
    console.error("[auth/register] error", e);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}


