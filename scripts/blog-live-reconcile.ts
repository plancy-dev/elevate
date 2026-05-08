/**
 * Compare three surfaces for the **public marketing blog** (not Library / catalog):
 * 1) Supabase `content_items` (`type=blog`) — pipeline / editorial state
 * 2) Repo `content/blog/<locale>/<slug>.mdx` — what Next serves at runtime after deploy
 * 3) Production `sitemap.xml` — what the **currently deployed** build advertises
 *
 * The live site does **not** read post bodies from Postgres; DB rows become URLs only
 * after publish writes MDX and that commit ships to Vercel.
 *
 * Usage:
 *   pnpm run blog:live-reconcile
 *   pnpm run blog:live-reconcile -- --site=https://elevate.ai.kr
 *   pnpm run blog:live-reconcile -- --out=reports/blog-live-reconcile-latest.json
 *
 * DB slice requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (same as other content-ops CLIs).
 */
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { routing } from "@/i18n/routing";
import {
  extractLocHrefsFromSitemapXml,
  parseMarketingBlogPathname,
} from "@/lib/blog/marketing-blog-url";

dotenv.config({ path: ".env.local", quiet: true });

const BLOG_ROOT = path.join(process.cwd(), "content/blog");
const SAMPLE_SLUG_RE = /^sample-/;

function listMdxSlugsByLocale(excludeSamples: boolean): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const locale of routing.locales) {
    const dir = path.join(BLOG_ROOT, locale);
    const set = new Set<string>();
    if (fs.existsSync(dir)) {
      for (const file of fs.readdirSync(dir)) {
        if (!file.endsWith(".mdx")) continue;
        const slug = file.replace(/\.mdx$/i, "");
        if (excludeSamples && SAMPLE_SLUG_RE.test(slug)) continue;
        set.add(slug);
      }
    }
    map.set(locale, set);
  }
  return map;
}

function addToLocaleSlugMap(
  target: Map<string, Set<string>>,
  locale: string,
  slug: string,
) {
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) return;
  let set = target.get(locale);
  if (!set) {
    set = new Set();
    target.set(locale, set);
  }
  set.add(slug);
}

async function fetchSitemapBlogSlugs(
  siteOrigin: string,
): Promise<{ ok: true; byLocale: Map<string, Set<string>> } | { ok: false; error: string }> {
  const sitemapUrl = `${siteOrigin.replace(/\/$/, "")}/sitemap.xml`;
  let res: Response;
  try {
    res = await fetch(sitemapUrl, { redirect: "follow" });
  } catch (e) {
    return {
      ok: false,
      error: `fetch_failed:${e instanceof Error ? e.message : String(e)}`,
    };
  }
  if (!res.ok) {
    return { ok: false, error: `sitemap_http_${res.status}` };
  }
  const xml = await res.text();
  const locs = extractLocHrefsFromSitemapXml(xml);
  const byLocale = new Map<string, Set<string>>();
  for (const href of locs) {
    let u: URL;
    try {
      u = new URL(href);
    } catch {
      continue;
    }
    const parsed = parseMarketingBlogPathname(u.pathname);
    if (!parsed) continue;
    addToLocaleSlugMap(byLocale, parsed.locale, parsed.slug);
  }
  return { ok: true, byLocale };
}

type DbRow = {
  id: string;
  locale: string;
  slug: string | null;
  status: string;
  published_at: string | null;
  title: string;
  updated_at: string;
};

async function loadDbBlogRows(): Promise<
  { ok: true; rows: DbRow[] } | { ok: false; reason: string }
> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) {
    return { ok: false, reason: "missing_SUPABASE_SERVICE_ROLE_KEY" };
  }
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("content_items")
      .select("id,locale,slug,status,published_at,title,updated_at")
      .eq("type", "blog")
      .order("updated_at", { ascending: false })
      .limit(800);
    if (error) {
      return { ok: false, reason: `query:${error.message}` };
    }
    const rows = (data ?? []) as DbRow[];
    return { ok: true, rows };
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : String(e),
    };
  }
}

async function run(): Promise<void> {
  const siteArg = process.argv.find((a) => a.startsWith("--site="));
  const siteOrigin = (siteArg?.split("=")[1] ?? "https://elevate.ai.kr").replace(
    /\/$/,
    "",
  );
  const outArg = process.argv.find((a) => a.startsWith("--out="));
  const outPath = outArg?.split("=")[1]?.trim();
  const excludeSamples = !process.argv.includes("--include-samples");

  const generatedAt = new Date().toISOString();
  const mdxByLocale = listMdxSlugsByLocale(excludeSamples);
  const sitemap = await fetchSitemapBlogSlugs(siteOrigin);
  const db = await loadDbBlogRows();

  const mdxKeys = new Set<string>();
  for (const [loc, slugs] of mdxByLocale) {
    for (const s of slugs) mdxKeys.add(`${loc}:${s}`);
  }

  const prodKeys = new Set<string>();
  if (sitemap.ok) {
    for (const [loc, slugs] of sitemap.byLocale) {
      for (const s of slugs) prodKeys.add(`${loc}:${s}`);
    }
  }

  const summary: Record<string, unknown> = {
    ok: true,
    generatedAt,
    siteOrigin,
    excludeSampleSlugs: excludeSamples,
    sitemap: sitemap.ok
      ? {
          ok: true,
          locales: Object.fromEntries(
            [...sitemap.byLocale.entries()].map(([k, v]) => [k, [...v].sort()]),
          ),
        }
      : { ok: false, error: sitemap.error },
    mdx: Object.fromEntries(
      [...mdxByLocale.entries()].map(([k, v]) => [k, [...v].sort()]),
    ),
    db:
      db.ok
        ? {
            ok: true,
            rowCount: db.rows.length,
            byStatus: Object.fromEntries(
              (() => {
                const m = new Map<string, number>();
                for (const r of db.rows) {
                  m.set(r.status, (m.get(r.status) ?? 0) + 1);
                }
                return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
              })(),
            ),
          }
        : { ok: false, reason: db.reason },
  };

  const divergences: Record<string, unknown> = {};

  if (sitemap.ok) {
    divergences.mdxNotOnProdSitemap = [...mdxKeys]
      .filter((k) => !prodKeys.has(k))
      .sort();
    divergences.prodSitemapNotInLocalMdx = [...prodKeys]
      .filter((k) => !mdxKeys.has(k))
      .sort();
  }

  if (sitemap.ok && db.ok) {
    const dbPublished = db.rows.filter((r) => r.published_at && r.slug?.trim());
    const dbPubKeys = new Set(
      dbPublished.map((r) => `${r.locale}:${r.slug!.trim()}`),
    );
    divergences.dbPublishedAtNotInLocalMdx = [...dbPubKeys]
      .filter((k) => !mdxKeys.has(k))
      .sort();
  }

  const payload = { ...summary, divergences };

  const json = JSON.stringify(payload, null, 2);
  if (outPath) {
    if (!outPath.startsWith("reports/")) {
      console.error("[blog-live-reconcile] --out= must be under reports/");
      process.exit(1);
    }
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, `${json}\n`, "utf8");
    process.stderr.write(`[blog-live-reconcile] wrote ${outPath}\n`);
  } else {
    console.log(json);
  }
}

run().catch((e) => {
  console.error("[blog-live-reconcile] failed:", e);
  process.exit(1);
});
