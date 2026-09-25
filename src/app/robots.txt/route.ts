import { headers } from "next/headers";
import { isAdminHost, siteOrigin } from "@/lib/hosts";

/**
 * A route handler rather than the robots.ts convention, because the answer
 * depends on which host asked. The office is hidden entirely; the public site
 * hides the doors — login, invites and the field pages behind the QRs.
 */
export async function GET() {
  const host = (await headers()).get("host");

  if (isAdminHost(host)) {
    return new Response("User-agent: *\nDisallow: /\n", {
      headers: { "content-type": "text/plain", "x-robots-tag": "noindex, nofollow" },
    });
  }

  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /login",
    "Disallow: /admin",
    "Disallow: /field",
    "Disallow: /invite",
    "Disallow: /api",
    "",
    `Sitemap: ${siteOrigin()}/sitemap.xml`,
    "",
  ].join("\n");

  return new Response(body, { headers: { "content-type": "text/plain" } });
}
