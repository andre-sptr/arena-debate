/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@react-three/fiber', '@react-three/drei'],
  },

  // Webpack configuration for Three.js
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_API_BASE_PATH: process.env.NEXT_PUBLIC_API_BASE_PATH,
  },

  // Image optimization
  images: {
    domains: [],
  },
};

module.exports = nextConfig;

// Made with Bob
