import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WebAI — Build AI Bots",
  description: "Generate real, deployable AI bot code and push to GitHub",
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
