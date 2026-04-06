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
