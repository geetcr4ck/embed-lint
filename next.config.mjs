/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ref: ARCHITECTURE.md §13 — static export untuk Cloudflare Pages.
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
