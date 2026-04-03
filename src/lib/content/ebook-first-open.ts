import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/** Inserts first-open audit row; ignores unique-violation (already opened). */
export async function recordEbookFirstOpen(
  supabase: SupabaseClient<Database>,
  args: {
    organizationId: string;
    userId: string;
    contentProductId: string;
  },
): Promise<void> {
  const { error } = await supabase.from("content_ebook_first_opens").insert({
    organization_id: args.organizationId,
    user_id: args.userId,
    content_product_id: args.contentProductId,
  });
  if (error && error.code !== "23505") {
    throw error;
  }
}
