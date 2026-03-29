import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 若要純靜態輸出（無 SSR）改成 "export"
  // 若要 SSR / ISR 就留空或不設
  // output: "export",

  images: {
    // 允許載入 Supabase 圖片
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ziiagdrrytyrmzoeegjk.supabase.co",
      },
    ],
    // 靜態 export 時改用 unoptimized
    // unoptimized: true,
  },
};

export default nextConfig;
