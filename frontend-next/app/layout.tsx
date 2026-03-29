// frontend-next/app/layout.tsx
export const metadata = {
  title: "Idol Temperature Platform",
  description: "台灣地下偶像市場即時監測平台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body style={{ margin: 0, background: "#f9fafb", color: "#111" }}>
        {children}
      </body>
    </html>
  );
}
