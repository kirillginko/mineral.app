/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  },
  env: {
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'mineral.ltd']
    }
  },
  serverExternalPackages: ['@prisma/client']
};

export default nextConfig;
