import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";

const BASE_URL = "https://idol-platform-git-main-ach018040s-projects.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "台灣地下偶像數據情報平台",
    template: "%s | 地下偶像情報",
  },
  description:
    "整合團體排行、成員熱度、社群活躍與市場趨勢的台灣地下偶像數據平台。即時追蹤溫度指數、Rising Stars、週熱度排名。",
  keywords: ["台灣地下偶像", "アイドル", "idol", "偶像排行", "溫度指數", "地下偶像"],
  authors: [{ name: "Idol Platform" }],
  creator: "Idol Platform",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: BASE_URL,
    siteName: "台灣地下偶像數據情報平台",
    title: "台灣地下偶像數據情報平台",
    description:
      "整合團體排行、成員熱度、社群活躍與市場趨勢的台灣地下偶像數據平台。",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "台灣地下偶像數據情報平台",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "台灣地下偶像數據情報平台",
    description: "整合團體排行、成員熱度、社群活躍與市場趨勢的地下偶像數據平台。",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>{children}<Analytics /></body>
    </html>
  );
}
