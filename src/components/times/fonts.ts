import { Inter } from "next/font/google";

/**
 * The second mock is set in Arial Bold — Figma's default — so it specifies
 * layout, not type. Inter is the closest free web equivalent: matched on cap
 * height it lands within 1.4% of the artwork's width, so the measured line
 * breaks still hold.
 *
 * To put a licensed face in, drop the webfont in and point --face in
 * globals.css at it. Every size on the page is derived from a measured cap
 * height, so only the cap ratio in that comment block needs revisiting.
 */
export const text = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--tm-text",
  display: "swap",
});
