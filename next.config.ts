import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

// @serwist/next always attaches a `webpack()` key to the config it returns,
// even when `disable: true`. Next 16 treats any webpack config as fatal
// under Turbopack (the `next dev` default), so Serwist can only wrap the
// config for the production (webpack) build — see package.json's
// `build` script, which runs `next build --webpack` for this reason.
const isProd = process.env.NODE_ENV === "production";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
});

export default isProd ? withSerwist(nextConfig) : nextConfig;
