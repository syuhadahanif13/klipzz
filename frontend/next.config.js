/** @type {import('next').NextConfig} */
const apiProxyTarget = (
  process.env.API_PROXY_TARGET || 'http://127.0.0.1:4000'
).replace(/\/$/, '');

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'img.youtube.com', 'p16-sign-va.tiktokcdn.com', 'instagram.com'],
  },
  // Keep the browser on the same origin. When NEXT_PUBLIC_API_URL is unset,
  // /api/* is proxied server-side to the Express backend (defaults to port 4000
  // on the same machine). Set API_PROXY_TARGET if the backend runs elsewhere.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
