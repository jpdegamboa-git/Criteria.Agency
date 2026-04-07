import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { sendWaitlistWelcome } from "@/lib/email";
import { waitlistEntries } from "@/lib/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, company, videoType, source } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Nombre y email requeridos" },
        { status: 400 }
      );
    }

    // Check duplicate
    const existing = await db
      .select()
      .from(waitlistEntries)
      .where(eq(waitlistEntries.email, email));

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Ya estas en la lista" },
        { status: 409 }
      );
    }

    // Insert
    await db.insert(waitlistEntries).values({
      name,
      email,
      company: company || null,
      videoType: videoType || null,
      source: source || "landing",
    });

    // Send welcome email
    await sendWaitlistWelcome(name, email);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[WAITLIST API] Error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
