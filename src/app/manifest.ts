import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DV Outdoor Advertising — Board Portal",
    short_name: "DV Outdoor",
    description: "Board inventory, status, and field operations for DV Outdoor Advertising.",
    start_url: "/field",
    display: "standalone",
    background_color: "#faf9f7",
    theme_color: "#0e7c7b",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
