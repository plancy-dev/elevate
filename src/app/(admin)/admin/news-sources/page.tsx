import Link from "next/link";
import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import {
  listAdminNewsSources,
  setAdminNewsSourceActive,
  upsertAdminNewsSource,
} from "@/actions/admin-content-ops";

export const metadata: Metadata = {
  title: "Admin | News Sources",
};

export default async function AdminNewsSourcesPage() {
  const listRes = await listAdminNewsSources();
  const rows = listRes.ok ? listRes.rows : [];

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-ink-100 bg-paper-50 px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Newspaper className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <h1 className="truncate text-sm font-medium text-ink-900">News Sources</h1>
        </div>
        <Link
          href="/admin"
          className="text-xs text-vermilion-600 transition-colors hover:text-vermilion-700"
        >
          Back to admin
        </Link>
      </div>

      <div className="max-w-5xl space-y-5 p-6">
        <p className="text-sm leading-relaxed text-ink-700">
          Register trusted sources for automated ingestion and control trust weighting.
        </p>

        <form action={upsertAdminNewsSource} className="space-y-3 border border-ink-100 bg-paper-0 p-4">
          <h2 className="text-sm font-medium text-ink-900">Add source</h2>
          <div className="grid gap-2 md:grid-cols-2">
            <input
              name="name"
              required
              placeholder="Source name"
              className="border border-ink-100 bg-paper-50 px-2.5 py-2 text-xs text-ink-900"
            />
            <select
              name="kind"
              defaultValue="rss"
              className="border border-ink-100 bg-paper-50 px-2.5 py-2 text-xs text-ink-900"
            >
              <option value="rss">rss</option>
              <option value="blog">blog</option>
              <option value="api">api</option>
              <option value="manual">manual</option>
            </select>
            <input
              name="base_url"
              required
              placeholder="https://example.com"
              className="border border-ink-100 bg-paper-50 px-2.5 py-2 text-xs text-ink-900 md:col-span-2"
            />
            <input
              name="trust_weight"
              type="number"
              min={0}
              max={100}
              defaultValue={50}
              className="border border-ink-100 bg-paper-50 px-2.5 py-2 text-xs text-ink-900"
            />
            <input
              name="fetch_interval_minutes"
              type="number"
              min={10}
              defaultValue={1440}
              className="border border-ink-100 bg-paper-50 px-2.5 py-2 text-xs text-ink-900"
            />
          </div>
          <button
            type="submit"
            className="border border-ink-100 bg-paper-50 px-3 py-1.5 text-xs text-ink-900 hover:bg-highlight"
          >
            Save source
          </button>
        </form>

        {!listRes.ok ? <p className="text-xs text-danger">{listRes.error}</p> : null}

        {rows.length === 0 ? (
          <p className="text-xs text-ink-500">No sources yet.</p>
        ) : (
          <div className="overflow-x-auto border border-ink-100">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ink-100 bg-paper-50">
                  <th className="p-2 font-medium text-ink-700">Name</th>
                  <th className="p-2 font-medium text-ink-700">Kind</th>
                  <th className="p-2 font-medium text-ink-700">URL</th>
                  <th className="p-2 font-medium text-ink-700">Trust</th>
                  <th className="p-2 font-medium text-ink-700">Active</th>
                  <th className="p-2 font-medium text-ink-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-ink-100/80">
                    <td className="p-2 text-ink-900">{row.name}</td>
                    <td className="p-2 text-ink-700">{row.kind}</td>
                    <td className="p-2 text-ink-700">{row.base_url}</td>
                    <td className="p-2 text-ink-700">{row.trust_weight}</td>
                    <td className="p-2 text-ink-700">{row.is_active ? "yes" : "no"}</td>
                    <td className="p-2">
                      <form action={setAdminNewsSourceActive}>
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="is_active" value={row.is_active ? "false" : "true"} />
                        <button
                          type="submit"
                          className="border border-ink-100 px-2 py-1 text-[11px] text-ink-700 hover:bg-highlight"
                        >
                          {row.is_active ? "Disable" : "Enable"}
                        </button>
                      </form>
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
