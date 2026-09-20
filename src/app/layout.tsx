import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

/* Inter rather than the -apple-system stack: SF Pro only renders on Apple
   devices, and DV's clients in Gujarat are largely on Android and Windows.
   Inter is metrically close enough that the design does not shift. */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DV Outdoor",
  description: "Board management for DV Outdoor Advertising",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-accent="graphite" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
