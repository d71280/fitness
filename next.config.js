/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cloudinary.com'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig