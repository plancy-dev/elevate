#!/usr/bin/env node

/**
 * Production sample post gate — ensures sample-* posts never leak to production builds.
 * 
 * This script tests the LOADER OUTPUT, not file existence.
 * Sample posts must exist in the repo for staging/preview QA, but should be filtered
 * out by getAllPostMetaForLocale() when VERCEL_ENV=production.
 * 
 * Used in CI to prevent sample posts from being deployed to production.
 */

import { getAllPostMetaForLocale } from "../src/lib/blog/posts.ts";

const SAMPLE_SLUG_RE = /^sample-/;
const LOCALES = ["en", "ko"];

async function main() {
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV;
  
  console.log(`[blog-sample-production-gate] Environment: ${env}`);
  
  if (env !== "production") {
    console.log(`[blog-sample-production-gate] ✅ PASS (non-production environment, samples allowed)`);
    process.exit(0);
  }
  
  const leakedPosts = [];
  
  for (const locale of LOCALES) {
    const posts = getAllPostMetaForLocale(locale);
    const samplePosts = posts.filter(p => SAMPLE_SLUG_RE.test(p.slug));
    
    if (samplePosts.length > 0) {
      leakedPosts.push(...samplePosts.map(p => ({ locale, slug: p.slug })));
    }
  }
  
  if (leakedPosts.length === 0) {
    console.log(`[blog-sample-production-gate] ✅ PASS (no sample posts in loader output)`);
    console.log(`[blog-sample-production-gate] Production filtering working correctly`);
    process.exit(0);
  }
  
  console.error(`[blog-sample-production-gate] ❌ FAIL`);
  console.error(`[blog-sample-production-gate] Sample posts leaked into production loader output:`);
  for (const { locale, slug } of leakedPosts) {
    console.error(`  - [${locale}] ${slug}`);
  }
  console.error(`[blog-sample-production-gate] The loader (getAllPostMetaForLocale) is not filtering sample posts correctly.`);
  console.error(`[blog-sample-production-gate] Check src/lib/blog/posts.ts shouldExcludeSlug() logic.`);
  
  process.exit(1);
}

main();
