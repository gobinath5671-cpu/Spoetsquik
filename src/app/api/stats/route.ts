import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/* GET /api/stats — admin dashboard stats */
export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const [
      totalEvents,
      upcoming,
      ongoing,
      completed,
      totalRegistrations,
      pending,
      approved,
      rejected,
      totalUsers,
      recentEvents,
      recentRegistrations,
    ] = await Promise.all([
      db.event.count(),
      db.event.count({ where: { status: "upcoming" } }),
      db.event.count({ where: { status: "ongoing" } }),
      db.event.count({ where: { status: "completed" } }),
      db.registration.count(),
      db.registration.count({ where: { status: "pending" } }),
      db.registration.count({ where: { status: "approved" } }),
      db.registration.count({ where: { status: "rejected" } }),
      db.user.count({ where: { role: "student" } }),
      db.event.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
      db.registration.findMany({
        take: 5,
        orderBy: { appliedAt: "desc" },
        include: { event: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        events: { total: totalEvents, upcoming, ongoing, completed },
        registrations: { total: totalRegistrations, pending, approved, rejected },
        users: { total: totalUsers },
        recentEvents,
        recentRegistrations,
      },
    });
  } catch (e) {
    console.error("[stats] error", e);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
