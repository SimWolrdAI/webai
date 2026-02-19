import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable subdomain-based multi-tenant routing
  async rewrites() {
    return {
      beforeFiles: [
        // Rewrite subdomain requests to the site renderer
        // e.g., mytoken.yourdomain.com -> /site/mytoken
        {
          source: "/:path*",
          has: [
            {
              type: "host",
              value: "(?<subdomain>[^.]+)\\..*",
            },
          ],
          destination: "/site/:subdomain/:path*",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;

