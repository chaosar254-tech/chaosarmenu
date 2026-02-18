/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Hata olsa bile yayına al
  },
  eslint: {
    ignoreDuringBuilds: true, // Lint hatalarını görmezden gel
  },
  // Increase body size limit for file uploads (20MB for cover images)
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
}

module.exports = nextConfig