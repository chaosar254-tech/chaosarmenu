/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  // TypeScript hatalarını yoksay
  typescript: {
    ignoreBuildErrors: true,
  },

  // ESLint (Tırnak işareti vb.) hatalarını yoksay
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;