import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LINE Sticker Generator — AI-Powered Stickers from Your Face",
  description:
    "Upload a single face photo and instantly generate 10 unique LINE stickers with different emotions using AI. Fast, fun, and premium quality.",
  keywords: ["LINE stickers", "AI sticker generator", "face sticker", "custom stickers", "sticker maker"],
  openGraph: {
    title: "LINE Sticker Generator",
    description: "Create 10 unique LINE stickers from a single photo with AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${outfit.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
