import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";

/* Instrument Sans rather than the -apple-system stack: SF Pro only renders on
   Apple devices, and DV's clients in Gujarat are largely on Android and
   Windows. Slightly narrow, confident letterforms that hold up at 13px in
   dense tables, with real tabular figures for the money columns. */
const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DV Outdoor",
  description: "Board management for DV Outdoor Advertising",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-accent="graphite" className={sans.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
