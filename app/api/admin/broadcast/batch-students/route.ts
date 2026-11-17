import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/broadcast/batch-students?batchId=<batchId>
 * Returns the list of confirmed registered students for a specific batch date.
 * Excludes cancelled or failed bookings, and deduplicates students with multiple bookings.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Admin session required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batchId");

    if (!batchId) {
      return NextResponse.json(
        { error: "Batch identifier (batchId) is required." },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Query confirmed bookings for this specific batch
    const { data: bookings, error } = await adminClient
      .from("bookings")
      .select(
        `
        id,
        booking_reference,
        status,
        created_at,
        customer_id,
        customers (
          id,
          full_name,
          email,
          phone,
          whatsapp_phone
        )
      `
      )
      .eq("batch_id", batchId)
      .eq("status", "confirmed")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching batch students:", error);
      return NextResponse.json(
        { error: "Failed to fetch registered students for this batch." },
        { status: 500 }
      );
    }

    // Deduplicate students by customer ID
    const studentMap = new Map<
      string,
      {
        id: string;
        fullName: string;
        email: string;
        phone: string | null;
        bookingReference: string;
        createdAt: string;
      }
    >();

    for (const b of bookings || []) {
      const cust = b.customers as any;
      if (cust && cust.id && !studentMap.has(cust.id)) {
        const resolvedPhone = cust.whatsapp_phone || cust.phone || null;
        studentMap.set(cust.id, {
          id: cust.id,
          fullName: cust.full_name || "Student",
          email: cust.email || "",
          phone: resolvedPhone,
          bookingReference: b.booking_reference,
          createdAt: b.created_at,
        });
      }
    }

    const students = Array.from(studentMap.values());

    return NextResponse.json({
      success: true,
      count: students.length,
      students,
    });
  } catch (err: any) {
    console.error("GET /api/admin/broadcast/batch-students unhandled error:", err);
    return NextResponse.json(
      { error: "Internal server error fetching batch students." },
      { status: 500 }
    );
  }
}
