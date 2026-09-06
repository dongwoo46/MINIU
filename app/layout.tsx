import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "나를 믿는 종교",
  description: "내가 지나온 길을 기억해주는 AI 경전",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
