import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LINE風チャット作成",
  description: "LINE風のチャット画面を作成・演出できるツール",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LINEチャット",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-visual",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" style={{ height: "100%", overflow: "hidden" }}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body style={{ height: "100%", margin: 0, padding: 0, overflow: "hidden" }}>{children}</body>
    </html>
  );
}
