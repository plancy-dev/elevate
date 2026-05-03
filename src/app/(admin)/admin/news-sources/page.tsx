import Link from "next/link";
import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { getTranslations } from "next-intl/server";
import {
  listAdminNewsSources,
  setAdminNewsSourceActive,
  upsertAdminNewsSource,
} from "@/actions/admin-content-ops";
import { FieldSelect } from "@/components/ui/field-select";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.adminNewsSources");
  return {
    title: t("metaTitle"),
  };
}

export default async function AdminNewsSourcesPage() {
  const t = await getTranslations("Dashboard.adminNewsSources");
  const listRes = await listAdminNewsSources();
  const rows = listRes.ok ? listRes.rows : [];

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-ink-100 bg-paper-50 px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Newspaper className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <h1 className="truncate text-sm font-medium text-ink-900">{t("title")}</h1>
        </div>
        <Link
          href="/admin"
          className="text-xs text-vermilion-600 transition-colors hover:text-vermilion-700"
        >
          {t("backToAdmin")}
        </Link>
      </div>

      <div className="max-w-5xl space-y-5 p-6">
        <p className="text-sm leading-relaxed text-ink-700">
          {t("intro")}
        </p>

        <form action={upsertAdminNewsSource} className="space-y-3 border border-ink-100 bg-paper-0 p-4">
          <h2 className="text-sm font-medium text-ink-900">{t("addHeading")}</h2>
          <div className="grid gap-2 md:grid-cols-2">
            <input
              name="name"
              required
              placeholder={t("sourceNamePlaceholder")}
              className="border border-ink-100 bg-paper-50 px-2.5 py-2 text-xs text-ink-900"
            />
            <FieldSelect
              name="kind"
              defaultValue="rss"
              variant="boxed"
              controlSize="sm"
              className="py-2 text-xs"
              options={[
                { value: "rss", label: t("kind.rss") },
                { value: "blog", label: t("kind.blog") },
                { value: "api", label: t("kind.api") },
                { value: "manual", label: t("kind.manual") },
              ]}
            />
            <input
              name="base_url"
              required
              placeholder={t("baseUrlPlaceholder")}
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
            {t("save")}
          </button>
        </form>

        {!listRes.ok ? <p className="text-xs text-danger">{listRes.error}</p> : null}

        {rows.length === 0 ? (
          <p className="text-xs text-ink-500">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto border border-ink-100">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ink-100 bg-paper-50">
                  <th className="p-2 font-medium text-ink-700">{t("columns.name")}</th>
                  <th className="p-2 font-medium text-ink-700">{t("columns.kind")}</th>
                  <th className="p-2 font-medium text-ink-700">{t("columns.url")}</th>
                  <th className="p-2 font-medium text-ink-700">{t("columns.trust")}</th>
                  <th className="p-2 font-medium text-ink-700">{t("columns.active")}</th>
                  <th className="p-2 font-medium text-ink-700">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-ink-100/80">
                    <td className="p-2 text-ink-900">{row.name}</td>
                    <td className="p-2 text-ink-700">{toKindLabel(t, row.kind)}</td>
                    <td className="p-2 text-ink-700">{row.base_url}</td>
                    <td className="p-2 text-ink-700">{row.trust_weight}</td>
                    <td className="p-2 text-ink-700">{row.is_active ? t("yes") : t("no")}</td>
                    <td className="p-2">
                      <form action={setAdminNewsSourceActive}>
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="is_active" value={row.is_active ? "false" : "true"} />
                        <button
                          type="submit"
                          className="border border-ink-100 px-2 py-1 text-[11px] text-ink-700 hover:bg-highlight"
                        >
                          {row.is_active ? t("actions.disable") : t("actions.enable")}
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

function toKindLabel(t: (key: string) => string, kind: string) {
  if (kind === "rss") return t("kind.rss");
  if (kind === "blog") return t("kind.blog");
  if (kind === "api") return t("kind.api");
  if (kind === "manual") return t("kind.manual");
  return kind;
}
