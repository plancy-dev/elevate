import { createAdminClient } from "@/lib/supabase/admin";

export async function getWaitlistBccEmail(): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("platform_email_settings")
      .select("waitlist_bcc_email")
      .eq("id", 1)
      .maybeSingle();
    if (error) {
      console.error("platform_email_settings read:", error.message);
      return null;
    }
    const v = data?.waitlist_bcc_email?.trim();
    return v || null;
  } catch (e) {
    console.error("platform_email_settings read:", e);
    return null;
  }
}
