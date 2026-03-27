import Link from "next/link";
import { redirect } from "next/navigation";
import { acceptInvitationByToken } from "@/actions/accept-invite";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Accept invitation" };

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const raw = token?.trim();
  if (!raw) {
    return (
      <div className="min-h-screen bg-background p-6">
        <p className="text-sm text-text-secondary">Missing invitation token.</p>
        <Link
          href="/login"
          className="text-sm text-interactive mt-4 inline-block"
        >
          Log in
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = encodeURIComponent(`/invite?token=${raw}`);
    redirect(`/login?next=${next}`);
  }

  const result = await acceptInvitationByToken(raw);
  if (!result.ok) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <p className="text-sm text-danger max-w-md text-center leading-relaxed">
          {result.error}
        </p>
        <Link className="mt-6 text-sm text-interactive" href="/dashboard">
          Dashboard
        </Link>
      </div>
    );
  }

  redirect("/dashboard");
}
