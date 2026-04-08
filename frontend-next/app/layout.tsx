import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "台灣地下偶像數據情報平台",
  description: "整合團體排行、成員熱度、社群活躍與市場趨勢的地下偶像數據平台。",
  other: {
    "google-adsense-account": "ca-pub-9012388026055638",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <head>
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9012388026055638"
          crossOrigin="anonymous"
        />
        {/* Google Funding Choices (CMP for GDPR) */}
        <script
          async
          src="https://fundingchoicesmessages.google.com/i/pub-9012388026055638?ers=1"
          nonce=""
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {function signalGooglefcPresent() {if (!window.frames['googlefcPresent']) {if (document.body) {const iframe = document.createElement('iframe');iframe.style = 'width: 0; height: 0; border: none; z-index: -1000; left: -1000px; top: -1000px;';iframe.style.display = 'none';iframe.name = 'googlefcPresent';document.body.appendChild(iframe);} else {setTimeout(signalGooglefcPresent, 0);}}}signalGooglefcPresent();})();`
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
