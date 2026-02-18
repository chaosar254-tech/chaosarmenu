/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // iOS AR Quick Look: /ar/model.usdz?url=... → /api/ar-model (Safari .usdz path görünce "Bu 3B model açılsın mı?" + Quick Look açıyor)
  async rewrites() {
    return [{ source: '/ar/model.usdz', destination: '/api/ar-model' }]
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

module.exports = nextConfig;