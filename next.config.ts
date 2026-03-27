import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    // Smaller client bundles when importing many lucide icons (dashboard sidebar, etc.)
    optimizePackageImports: ["lucide-react"],
  },
};

export default withNextIntl(nextConfig);
