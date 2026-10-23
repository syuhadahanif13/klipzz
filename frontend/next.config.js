/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'img.youtube.com', 'p16-sign-va.tiktokcdn.com', 'instagram.com'],
  },
  // API routes live in this same Next.js app under src/app/api.
  // No rewrite/proxy to a separate Express backend is needed.
};

module.exports = nextConfig;
