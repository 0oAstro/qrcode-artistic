/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
    webpack: (config, {dev}) => { if (dev) { watchOptions: { poll: true } return config } return config }
}

export default nextConfig
