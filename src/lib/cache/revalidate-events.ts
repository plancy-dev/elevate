import { revalidatePath } from "next/cache";

/** Centralize dashboard + events cache tags to avoid drift across server actions. */
export function revalidateEventAndDashboard(eventId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/events");
  if (eventId) {
    revalidatePath(`/dashboard/events/${eventId}`);
    revalidatePath(`/dashboard/events/${eventId}/edit`);
  }
}
