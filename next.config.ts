import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@whiskeysockets/baileys', 'pino', 'pino-pretty', 'sharp', 'fluent-ffmpeg', 'jimp'],
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
      'jimp': 'commonjs jimp',
    })
    return config
  },
};

export default nextConfig;
