/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow builds even with lint/type warnings
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Allow images from any https source
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
    unoptimized: true,
  },

  // Production environment variable for API URL
  // When deployed: set NEXT_PUBLIC_API_URL to your Render backend URL
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  },

  // Output configuration - 'standalone' works best for Netlify/Vercel
  // Remove if causing issues on specific platforms
};

export default nextConfig;
