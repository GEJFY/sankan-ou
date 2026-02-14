import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GRC Triple Crown - 三冠王",
  description: "AI駆動型 CIA/CISA/CFE 学習プラットフォーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
