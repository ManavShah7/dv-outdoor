/**
 * Which surface a request belongs to.
 *
 * The public site, the admin portal and the field pages all ship from one
 * Next app, but they live at different hosts in production:
 *
 *   timesmedia.online          public site, board browser, /f/<code>
 *   admin.timesmedia.online    the office
 *
 * Splitting them by host rather than by path means the admin can be
 * noindexed and locked down as a whole, and a session on one does not carry
 * to the other — Supabase scopes its cookies per host.
 *
 * Locally there are no subdomains, so everything stays on localhost and the
 * host split is skipped entirely.
 */
export function siteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** `admin.timesmedia.online`, derived from the public origin. */
export function adminHost() {
  const { hostname } = new URL(siteOrigin());
  return `admin.${hostname.replace(/^www\./, "")}`;
}

export function adminOrigin() {
  const { protocol } = new URL(siteOrigin());
  return `${protocol}//${adminHost()}`;
}

/** True when this request arrived on the admin host. */
export function isAdminHost(host: string | null | undefined) {
  if (!host) return false;
  return host.split(":")[0].toLowerCase() === adminHost().toLowerCase();
}

/** Local development, where the split does not apply. */
export function isLocalHost(host: string | null | undefined) {
  const name = (host ?? "").split(":")[0].toLowerCase();
  return name === "localhost" || name === "127.0.0.1" || name.endsWith(".local");
}
