/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ziiagdrrytyrmzoeegjk.supabase.co",
      },
    ],
  },
};
module.exports = nextConfig;
