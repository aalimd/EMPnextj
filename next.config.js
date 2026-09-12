/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: `next build` writes `out/` — deployed directly to Cloudflare Pages.
  // No adapter, no server functions, no Node APIs at runtime.
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
};

module.exports = nextConfig;
