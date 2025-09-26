/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // output: 'export', // Removed to enable API routes and server-side functionality
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api.gtvmotor.dev/api/:path*',
      },
    ]
  },
}

export default nextConfig
