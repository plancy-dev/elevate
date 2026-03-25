import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { ensureDefaultOrganization } from "@/actions/onboarding";
import { EditEventForm } from "@/components/dashboard/edit-event-form";
import { ElevateLogo } from "@/components/layout/elevate-logo";
import { getEventByIdForEdit } from "@/lib/data/events";

export const metadata = { title: "Edit event" };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditEventPage({ params }: PageProps) {
  const ensured = await ensureDefaultOrganization();
  if (!ensured.ok) {
    return (
      <div className="min-h-screen bg-background p-6">
        <p className="text-sm text-danger">{ensured.error}</p>
      </div>
    );
  }

  const { id } = await params;
  const row = await getEventByIdForEdit(id);
  if (!row) notFound();

  const event = {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    event_type: row.event_type,
    status: row.status,
    start_date: row.start_date,
    end_date: row.end_date,
    timezone: row.timezone ?? "UTC",
    expected_attendees: row.expected_attendees ?? 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border-subtle bg-background px-6 h-12">
        <Link
          href={`/dashboard/events/${id}`}
          className="text-text-tertiary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-sm font-medium text-text-primary truncate">
          Edit event
        </span>
      </div>

      <div className="p-6 max-w-xl">
        <Link href="/" className="inline-block">
          <ElevateLogo size="sm" />
        </Link>
        <h1 className="mt-6 text-xl font-semibold tracking-[-0.02em] text-text-primary">
          {event.title}
        </h1>
        <p className="mt-1 text-sm text-text-tertiary">
          Update schedule, status, and description.
        </p>
        <EditEventForm event={event} />
      </div>
    </div>
  );
}
