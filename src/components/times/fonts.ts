import { Montserrat, Inter } from "next/font/google";

/**
 * The artwork is set in Modica Ultra and Jam Grotesque — both Fontspring
 * *demo* files. They cannot ship: beyond the licence, the demos replace
 * `+ & % ( ) -` with a "DEMO" watermark glyph, which showed up as a badge
 * in every filter pill.
 *
 * Montserrat 900 is the closest free display face measured against the
 * artwork (0.83 pixel overlap on a matched cap height, vs 0.95 for Modica
 * itself); Inter 500 is the closest to Jam Grotesque and within 2% on width,
 * so the measured line breaks still hold.
 *
 * To go back to the real thing: buy Modica and Jam Grotesque, drop the
 * webfonts in, and point --display / --text at them in globals.css. Nothing
 * else on the page needs to change — every size is derived from cap height,
 * and both families are cap 0.70em.
 */
export const display = Montserrat({
  subsets: ["latin"],
  weight: ["900"],
  variable: "--tm-display",
  display: "swap",
});

export const text = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--tm-text",
  display: "swap",
});
