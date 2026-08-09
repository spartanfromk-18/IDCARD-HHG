import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "HH Goa 2026 – ID Card Generator",
    template: "%s · HH Goa 2026",
  },
  description: "FrameInGoa — generate your Hacker House Goa 2026 ID card and share it.",
  openGraph: {
    siteName: "Hacker House Goa 2026",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}