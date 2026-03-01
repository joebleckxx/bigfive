import type {NextConfig} from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {},
  async redirects() {
    return [
      {
        source: "/se/:path*",
        destination: "/sv/:path*",
        permanent: true,
      },
      {
        source: "/:locale(en|pl|sv|es|de|fr|pt)/se/:path*",
        destination: "/sv/:path*",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
