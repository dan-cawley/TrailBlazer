import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    serverActions: {
      // Curriculum uploads are capped at 20 MB in the server action. Leave a
      // small margin for multipart form metadata.
      bodySizeLimit: "25mb",
    },
    // Requests pass through the authentication proxy before reaching the
    // Server Action, so its buffer must accommodate the same upload size.
    proxyClientMaxBodySize: "25mb",
  },
};

export default nextConfig;
