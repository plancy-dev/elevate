import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { ensureDefaultOrganization } from "@/actions/onboarding";
import { VenueForm } from "@/components/dashboard/venue-form";
import { ElevateLogo } from "@/components/layout/elevate-logo";
import { createClient } from "@/lib/supabase/server";
import { getVenueByIdForOrg } from "@/lib/data/venues";

export const metadata = { title: "Edit venue" };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditVenuePage({ params }: PageProps) {
  const ensured = await ensureDefaultOrganization();
  if (!ensured.ok) {
    return (
      <div className="min-h-screen bg-background p-6">
        <p className="text-sm text-danger">{ensured.error}</p>
      </div>
    );
  }

  const orgId = ensured.organizationId;
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const canManage =
    profile?.role === "admin" || profile?.role === "organizer";

  if (!canManage) {
    return (
      <div className="min-h-screen bg-background p-6">
        <p className="text-sm text-text-secondary">
          Only administrators and organizers can edit venues.
        </p>
        <Link href="/dashboard/venues" className="text-sm text-interactive mt-2 inline-block">
          Back to venues
        </Link>
      </div>
    );
  }

  const venue = await getVenueByIdForOrg(id, orgId);
  if (!venue) notFound();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border-subtle bg-background px-6 h-12">
        <Link
          href="/dashboard/venues"
          className="text-text-tertiary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-sm font-medium text-text-primary truncate">
          Edit venue
        </span>
      </div>

      <div className="p-6 max-w-xl">
        <Link href="/" className="inline-block">
          <ElevateLogo size="sm" />
        </Link>
        <h1 className="mt-6 text-xl font-semibold tracking-[-0.02em] text-text-primary">
          {venue.name}
        </h1>
        <p className="mt-1 text-sm text-text-tertiary">
          Update address and capacity.
        </p>
        <VenueForm venue={venue} />
      </div>
    </div>
  );
}
