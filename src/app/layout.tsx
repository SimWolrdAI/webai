import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WebAI",
  description: "AI-powered bot generation platform. Describe your bot, get production-ready code.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
