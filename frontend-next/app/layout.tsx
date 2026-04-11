import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "偶像熱度平台 Idol Platform",
  description: "以繁體中文整理偶像團體、成員與社群活躍資料，快速掌握本週熱度、焦點人物與推薦探索方向。",
  other: {
    "google-adsense-account": "ca-pub-9012388026055638",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9012388026055638"
          crossOrigin="anonymous"
        />
        <script
          async
          src="https://fundingchoicesmessages.google.com/i/pub-9012388026055638?ers=1"
          nonce=""
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){function signalGooglefcPresent(){if(!window.frames['googlefcPresent']){if(document.body){const iframe=document.createElement('iframe');iframe.style='width:0;height:0;border:none;z-index:-1000;left:-1000px;top:-1000px;display:none;';iframe.name='googlefcPresent';document.body.appendChild(iframe);}else{setTimeout(signalGooglefcPresent,0);}}}signalGooglefcPresent();})();",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
