/** @type {import('next').NextConfig} */
const nextConfig = {
  // Speed up development
  reactStrictMode: false, // Disable double-rendering in dev

  // Reduce bundle analysis overhead
  productionBrowserSourceMaps: false,

  // Allow dev server access from local network devices
  allowedDevOrigins: [
    "http://192.168.1.10:3000",
    "http://192.168.1.*:3000", // Allow any device on 192.168.1.x subnet
  ],
};

export default nextConfig;
