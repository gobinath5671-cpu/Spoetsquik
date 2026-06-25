import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import QRCode from "qrcode";
import { generateRegistrationCode, parseJsonArray, safeJsonStringifyArray } from "@/lib/utils";

/* POST /api/registrations/[id] — register student for event (id = eventId) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }
    const { id: eventId } = await params;
    const event = await db.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) {
      return NextResponse.json(
        { success: false, message: "Registration deadline has passed" },
        { status: 400 }
      );
    }

    const existing = await db.registration.findFirst({
      where: { eventId, studentId: session.userId },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "You have already registered for this event" },
        { status: 409 }
      );
    }

    const body = await req.json();

    const count = await db.registration.count();
    const registrationCode = generateRegistrationCode(count + 1);
    const qrPayload = `SF-${eventId}-${registrationCode}`;
    const qrCodeData = await QRCode.toDataURL(qrPayload, {
      width: 240,
      margin: 1,
      color: { dark: "#000000", light: "#FFFFFF" },
    });

    const registration = await db.registration.create({
      data: {
        eventId,
        studentId: session.userId,
        registrationCode,
        qrCodeData,
        fullName: body.fullName || "",
        rollNumber: body.rollNumber || "",
        department: body.department || "",
        year: body.year || "",
        section: body.section || "",
        collegeName: body.collegeName || "",
        selectedSport: body.selectedSport || "",
        eventCategory: body.eventCategory || "",
        isTeamGame: !!body.isTeamGame,
        teamName: body.teamName || "",
        captainName: body.captainName || "",
        members: safeJsonStringifyArray(body.members || []),
        idCardUrl: body.idCardUrl || "",
        contactNumber: body.contactNumber || "",
        emailId: body.emailId || "",
        emergencyName: body.emergencyName || "",
        emergencyPhone: body.emergencyPhone || "",
        emergencyRelation: body.emergencyRelation || "",
        fitnessConfirmed: !!body.fitnessConfirmed,
        bloodGroup: body.bloodGroup || "",
        paymentTxnId: body.paymentTxnId || "",
        paymentReceiptUrl: body.paymentReceiptUrl || "",
        isPaid: !!body.isPaid,
        status: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Registration submitted successfully",
      data: {
        ...registration,
        members: parseJsonArray(registration.members),
        event: {
          id: event.id,
          eventName: event.eventName,
          collegeName: event.collegeName,
          eventDate: event.eventDate,
          venue: event.venue,
        },
      },
    });
  } catch (e) {
    console.error("[registration POST] error", e);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/* GET /api/registrations/[id] — all registrations for an event (admin). id = eventId */
export async function GET(
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
    const { id: eventId } = await params;
    const regs = await db.registration.findMany({
      where: { eventId },
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
    console.error("[registrations/event GET] error", e);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
