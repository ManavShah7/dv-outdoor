import { Inter, Instrument_Serif } from "next/font/google";

/**
 * Two faces, and a clear division of labour.
 *
 * Instrument Serif carries the display: headlines, the oversized numerals,
 * the pull quotes. It is a high-contrast modern serif with one weight and an
 * italic, which is exactly what an editorial page wants — the drama comes
 * from size and from the thick-to-thin, not from piling on weights. SIL Open
 * Font License, served from the bundle, so nothing licensed goes near this
 * public repo. (The last attempt at display type here used Fontspring demo
 * files, which silently replace + & % ( ) - with a DEMO watermark.)
 *
 * Inter carries everything that has to be read or operated: body copy, the
 * small-caps labels and credits, form fields. It is already in the bundle.
 */
export const text = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--tm-text",
  display: "swap",
});

export const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--tm-display",
  display: "swap",
});
