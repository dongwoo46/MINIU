import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MINIU · 너를 알아가는 작은 세상",
  description: "연인의 취향과 일상을 기억하는 MINIU. 홈, 문자, 프로필 디자인 프리뷰.",
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
