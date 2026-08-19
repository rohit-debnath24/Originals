import type { NextConfig } from "next";
import path from "path";

// Resolve the monorepo root
const monorepoRoot = path.resolve(__dirname, '../..');

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Output standalone for Docker/production deployments
  output: 'standalone',
  // Empty turbopack config to acknowledge we're using turbopack for dev
  turbopack: {},
  webpack: (config) => {
    // Externalize problematic Node.js modules
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    // Force all viem imports to use the root viem package
    // This fixes issues with nested dependencies having broken viem versions
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
      // Force consistent viem version across all packages (from monorepo root)
      'viem': path.resolve(monorepoRoot, 'node_modules/viem'),
    };
    
    // Ignore test files and non-JS files from problematic packages
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.(md|txt|LICENSE|sh|zip)$/,
      use: 'null-loader',
    });
    
    // Ignore test directories
    config.module.rules.push({
      test: /[\\/]node_modules[\\/]@walletconnect[\\/].*[\\/]test[\\/]/,
      use: 'null-loader',
    });
    
    config.module.rules.push({
      test: /[\\/]node_modules[\\/]thread-stream[\\/]test[\\/]/,
      use: 'null-loader',
    });
    
    // Ignore viem test decorators from nested dependencies
    config.module.rules.push({
      test: /[\\/]node_modules[\\/].*[\\/]viem[\\/]_esm[\\/]clients[\\/]decorators[\\/]test\.js$/,
      use: 'null-loader',
    });
    
    return config;
  },
  // Environment variables available at runtime
  env: {
    NEXT_PUBLIC_API_URL: process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3001/api',
    NEXT_PUBLIC_X402_FACILITATOR_URL: process.env['NEXT_PUBLIC_X402_FACILITATOR_URL'] || 'https://x402.org/facilitator',
  },
};

export default nextConfig;
