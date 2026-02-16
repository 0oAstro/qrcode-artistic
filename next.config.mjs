/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude pyodide from webpack bundling - it will be loaded dynamically from CDN
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'pyodide': 'pyodide'
      });
    }
    return config;
  },
};

export default nextConfig;
