import Link from "next/link";
import type { Metadata } from "next";
import { Users } from "lucide-react";
import {
  addAdminNewsletterSubscriber,
  listAdminNewsletterSubscribers,
  updateAdminNewsletterSubscriberStatus,
} from "@/actions/admin-content-ops";

export const metadata: Metadata = {
  title: "Admin | Newsletter Subscribers",
};

export default async function AdminSubscribersPage() {
  const listRes = await listAdminNewsletterSubscribers();
  const rows = listRes.ok ? listRes.rows : [];

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-ink-100 bg-paper-50 px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Users className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <h1 className="truncate text-sm font-medium text-ink-900">Subscribers</h1>
        </div>
        <Link
          href="/admin"
          className="text-xs text-vermilion-600 transition-colors hover:text-vermilion-700"
        >
          Back to admin
        </Link>
      </div>

      <div className="max-w-6xl space-y-5 p-6">
        <p className="text-sm leading-relaxed text-ink-700">
          Manage newsletter subscription lifecycle independently from waitlist leads.
        </p>

        <form action={addAdminNewsletterSubscriber} className="space-y-3 border border-ink-100 bg-paper-0 p-4">
          <h2 className="text-sm font-medium text-ink-900">Add subscriber</h2>
          <div className="grid gap-2 md:grid-cols-3">
            <input
              type="email"
              name="email"
              required
              placeholder="name@company.com"
              className="border border-ink-100 bg-paper-50 px-2.5 py-2 text-xs text-ink-900 md:col-span-2"
            />
            <input
              name="locale"
              defaultValue="en"
              placeholder="en"
              className="border border-ink-100 bg-paper-50 px-2.5 py-2 text-xs text-ink-900"
            />
            <select
              name="frequency_pref"
              defaultValue="weekly"
              className="border border-ink-100 bg-paper-50 px-2.5 py-2 text-xs text-ink-900"
            >
              <option value="daily">daily</option>
              <option value="weekly">weekly</option>
            </select>
          </div>
          <button
            type="submit"
            className="border border-ink-100 bg-paper-50 px-3 py-1.5 text-xs text-ink-900 hover:bg-highlight"
          >
            Save subscriber
          </button>
        </form>

        {!listRes.ok ? <p className="text-xs text-danger">{listRes.error}</p> : null}

        {rows.length === 0 ? (
          <p className="text-xs text-ink-500">No subscribers yet.</p>
        ) : (
          <div className="overflow-x-auto border border-ink-100">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ink-100 bg-paper-50">
                  <th className="p-2 font-medium text-ink-700">Email</th>
                  <th className="p-2 font-medium text-ink-700">Status</th>
                  <th className="p-2 font-medium text-ink-700">Frequency</th>
                  <th className="p-2 font-medium text-ink-700">Locale</th>
                  <th className="p-2 font-medium text-ink-700">Source</th>
                  <th className="p-2 font-medium text-ink-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-ink-100/80">
                    <td className="p-2 font-mono text-ink-900">{row.email}</td>
                    <td className="p-2 text-ink-700">{row.status}</td>
                    <td className="p-2 text-ink-700">{row.frequency_pref}</td>
                    <td className="p-2 text-ink-700">{row.locale}</td>
                    <td className="p-2 text-ink-700">{row.source}</td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1.5">
                        <form action={updateAdminNewsletterSubscriberStatus}>
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="status" value="subscribed" />
                          <button
                            type="submit"
                            className="border border-ink-100 px-2 py-1 text-[11px] text-ink-700 hover:bg-highlight"
                          >
                            Subscribe
                          </button>
                        </form>
                        <form action={updateAdminNewsletterSubscriberStatus}>
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="status" value="unsubscribed" />
                          <button
                            type="submit"
                            className="border border-ink-100 px-2 py-1 text-[11px] text-ink-700 hover:bg-highlight"
                          >
                            Unsubscribe
                          </button>
                        </form>
                        <form action={updateAdminNewsletterSubscriberStatus}>
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="status" value="bounced" />
                          <button
                            type="submit"
                            className="border border-ink-100 px-2 py-1 text-[11px] text-ink-700 hover:bg-highlight"
                          >
                            Mark bounced
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
