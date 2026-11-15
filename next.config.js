/** @type {import('next').NextConfig} */
const nextConfig = {
  // Invoice signatures/font live outside /public and are read at runtime
  outputFileTracingIncludes: {
    "/admin/invoice-asset/*": ["./private/invoice/**/*"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cms.jabalun.com" },
      { protocol: "https", hostname: "jabalun.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    // 75 is the default for the site; 70 is used by the ready-hijab collection grid
    qualities: [70, 75],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

module.exports = nextConfig;
