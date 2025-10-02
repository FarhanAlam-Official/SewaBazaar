/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ignore lint errors during build
  },
  typescript: {
    ignoreBuildErrors: true, // ignore TS errors during build
  },
  trailingSlash: false, // avoid implicit redirects
  experimental: {
    esmExternals: true, // allows ESM modules in node_modules
  },
  output: 'standalone', // for standalone deployments
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
    ],
  },
  webpack(config) {
    // Fix build issues with ESM packages (like react-day-picker v8 and Recharts v3)
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: { fullySpecified: false },
    });
    return config;
  },
};

export default nextConfig;
