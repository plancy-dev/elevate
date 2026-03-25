import { revalidatePath } from "next/cache";

/** Centralize dashboard + events + venues cache tags to avoid drift across server actions. */
export function revalidateEventAndDashboard(eventId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/events");
  revalidatePath("/dashboard/venues");
  if (eventId) {
    revalidatePath(`/dashboard/events/${eventId}`);
    revalidatePath(`/dashboard/events/${eventId}/edit`);
  }
}
