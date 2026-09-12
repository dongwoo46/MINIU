import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://miniu-lake.vercel.app";
const title = "MINIU | 너를 알아가는 작은 세상";
const description = "연인의 취향과 일상을 기억하고, 둘만의 미니유를 함께 키워가는 관계 기록 앱.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "MINIU",
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "MINIU",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "MINIU - 너를 알아가는 작은 세상",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
  },
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
