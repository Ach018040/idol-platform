import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Idol Temperature Platform",
  description: "台灣地下偶像市場即時監測平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
