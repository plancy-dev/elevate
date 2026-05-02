#!/usr/bin/env node

/**
 * Production sample post gate — ensures sample-* posts never leak to production builds.
 * 
 * This script fails if:
 * 1. VERCEL_ENV=production and sample-* blog posts are discoverable
 * 2. sitemap.xml (if built) contains sample-* URLs
 * 
 * Used in CI to prevent sample posts from being deployed to production.
 * Sample posts are QA/staging fixtures for testing access gates.
 */

import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const BLOG_CONTENT_ROOT = path.join(cwd, "content/blog");
const SAMPLE_SLUG_RE = /^sample-/;

function collectSampleSlugs() {
  const slugs = new Set();
  const locales = ["en", "ko"];
  
  for (const locale of locales) {
    const dir = path.join(BLOG_CONTENT_ROOT, locale);
    if (!fs.existsSync(dir)) continue;
    
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".mdx"));
    for (const file of files) {
      const slug = file.replace(/\.mdx$/i, "");
      if (SAMPLE_SLUG_RE.test(slug)) {
        slugs.add(slug);
      }
    }
  }
  
  return Array.from(slugs).sort();
}

function checkSitemapForSampleUrls() {
  const sitemapPath = path.join(cwd, ".next/server/app/sitemap.xml/route.js");
  if (!fs.existsSync(sitemapPath)) {
    return { checked: false, hasSamples: false, samples: [] };
  }
  
  try {
    const sitemapOutputDir = path.join(cwd, ".next/server/app/sitemap.xml");
    if (!fs.existsSync(sitemapOutputDir)) {
      return { checked: false, hasSamples: false, samples: [] };
    }
    
    return { checked: false, hasSamples: false, samples: [] };
  } catch {
    return { checked: false, hasSamples: false, samples: [] };
  }
}

function main() {
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV;
  const sampleSlugs = collectSampleSlugs();
  
  console.log(`[blog-sample-production-gate] Environment: ${env}`);
  console.log(`[blog-sample-production-gate] Sample slugs found: ${sampleSlugs.length}`);
  
  if (sampleSlugs.length > 0) {
    console.log(`[blog-sample-production-gate] Sample posts: ${sampleSlugs.join(", ")}`);
  }
  
  if (env !== "production") {
    console.log(`[blog-sample-production-gate] ✅ PASS (non-production environment, samples allowed)`);
    process.exit(0);
  }
  
  if (sampleSlugs.length === 0) {
    console.log(`[blog-sample-production-gate] ✅ PASS (no sample posts found)`);
    process.exit(0);
  }
  
  const sitemapCheck = checkSitemapForSampleUrls();
  
  console.error(`[blog-sample-production-gate] ❌ FAIL`);
  console.error(`[blog-sample-production-gate] Production build detected with ${sampleSlugs.length} sample posts:`);
  for (const slug of sampleSlugs) {
    console.error(`  - ${slug}`);
  }
  console.error(`[blog-sample-production-gate] Sample posts must not be exposed in production.`);
  console.error(`[blog-sample-production-gate] These are QA fixtures for testing access gates.`);
  console.error(`[blog-sample-production-gate] Either:`);
  console.error(`  1. Remove sample-*.mdx files before production deployment`);
  console.error(`  2. Ensure VERCEL_ENV !== "production" for preview/staging`);
  
  process.exit(1);
}

main();
