import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ensureDefaultOrganization } from "@/actions/onboarding";
import { NewEventForm } from "@/components/dashboard/new-event-form";
import { ElevateLogo } from "@/components/layout/elevate-logo";

export const metadata = { title: "New event" };

export default async function NewEventPage() {
  const ensured = await ensureDefaultOrganization();
  if (!ensured.ok) {
    return (
      <div className="min-h-screen bg-background p-6">
        <p className="text-sm text-danger">{ensured.error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border-subtle bg-background px-6 h-12">
        <Link
          href="/dashboard/events"
          className="text-text-tertiary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-sm font-medium text-text-primary">New event</span>
      </div>

      <div className="p-6 max-w-xl">
        <Link href="/" className="inline-block">
          <ElevateLogo size="sm" />
        </Link>
        <h1 className="mt-6 text-xl font-semibold tracking-[-0.02em] text-text-primary">
          Create event
        </h1>
        <p className="mt-1 text-sm text-text-tertiary">
          Add a title and schedule. You can attach a venue and sessions later.
        </p>
        <NewEventForm />
      </div>
    </div>
  );
}
