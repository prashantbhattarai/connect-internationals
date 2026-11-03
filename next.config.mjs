/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async redirects() {
    return [{ source: "/", destination: "/connect", permanent: false }];
  },
};
export default nextConfig;
