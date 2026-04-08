import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    // Smaller client bundles when importing many lucide icons (dashboard sidebar, etc.)
    optimizePackageImports: ["lucide-react"],
  },
  async redirects() {
    return [
      // Marketing short links — clean bio URLs; UTM attached server-side for analytics.
      // Instagram / X / Threads / YouTube "about" fields: use https://elevate.ai.kr/ig etc.
      {
        source: "/ig",
        destination:
          "/?utm_source=instagram&utm_medium=social&utm_campaign=bio_shortlink",
        permanent: false,
      },
      {
        source: "/x",
        destination:
          "/?utm_source=twitter&utm_medium=social&utm_campaign=bio_shortlink",
        permanent: false,
      },
      {
        source: "/threads",
        destination:
          "/?utm_source=threads&utm_medium=social&utm_campaign=bio_shortlink",
        permanent: false,
      },
      {
        source: "/yt",
        destination:
          "/?utm_source=youtube&utm_medium=social&utm_campaign=bio_shortlink",
        permanent: false,
      },
      {
        source: "/links",
        destination: "https://linktr.ee/elevate_ai",
        permanent: false,
      },
      {
        source: "/dashboard/audit-log",
        destination: "/dashboard/organization/audit",
        permanent: true,
      },
      {
        source: "/dashboard/admin",
        destination: "/dashboard/team",
        permanent: true,
      },
      {
        source: "/dashboard/admin/:path*",
        destination: "/dashboard/team",
        permanent: true,
      },
      {
        source: "/dashboard/organization",
        destination: "/dashboard/team",
        permanent: true,
      },
      {
        source: "/dashboard/audit",
        destination: "/dashboard/organization/audit",
        permanent: true,
      },
      {
        source: "/dashboard/events",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/dashboard/events/:path*",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/dashboard/venues",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/dashboard/venues/:path*",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/dashboard/attendees",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/dashboard/attendees/:path*",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/dashboard/analytics",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/resources",
        destination: "/blog",
        permanent: true,
      },
      { source: "/ko/resources", destination: "/ko/blog", permanent: true },
      { source: "/ja/resources", destination: "/ja/blog", permanent: true },
      {
        source: "/zh-CN/resources",
        destination: "/zh-CN/blog",
        permanent: true,
      },
      {
        source: "/zh-TW/resources",
        destination: "/zh-TW/blog",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
