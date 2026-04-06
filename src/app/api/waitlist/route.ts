import { NextResponse } from "next/server";
import { sendWaitlistConfirmationEmail } from "@/lib/email/send-waitlist-confirmation-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWaitlistBccEmail } from "@/lib/platform/platform-email-settings";
import { normalizeWaitlistSource } from "@/lib/waitlist/sources";

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { email, locale, source, website } = body as Record<
    string,
    unknown
  >;

  if (typeof website === "string" && website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  if (typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const normalized = normalizeEmail(email);
  if (normalized.length > 254 || !EMAIL_RE.test(normalized)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const sourceVal = normalizeWaitlistSource(source);

  let localeVal: string | null = null;
  if (typeof locale === "string" && locale.length <= 12) {
    localeVal = locale.trim() || null;
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("waitlist_signups").insert({
      email: normalized,
      locale: localeVal,
      source: sourceVal,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ ok: true });
      }
      console.error("waitlist insert:", error.message);
      return NextResponse.json(
        { error: "Could not save. Try again later." },
        { status: 503 },
      );
    }

    const bcc = await getWaitlistBccEmail();
    void sendWaitlistConfirmationEmail({
      to: normalized,
      locale: localeVal,
      bcc,
    }).catch((err) => {
      console.error("waitlist confirmation email:", err);
    });
  } catch (e) {
    console.error("waitlist:", e);
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return NextResponse.json(
        { error: "Waitlist is not configured on this server." },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "Could not save. Try again later." },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
