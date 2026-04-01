// idol-platform v3.7.3
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "ziiagdrrytyrmzoeegjk.supabase.co" }],
  },
};
module.exports = nextConfig;
