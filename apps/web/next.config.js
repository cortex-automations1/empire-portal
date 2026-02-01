/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@empire/shared', '@empire/database'],
};

module.exports = nextConfig;
