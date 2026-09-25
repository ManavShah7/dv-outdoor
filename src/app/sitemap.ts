import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/hosts";

/** Only the two public pages. Everything else is behind a login or a QR. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteOrigin();
  return [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/boards`, changeFrequency: "weekly", priority: 0.8 },
  ];
}
