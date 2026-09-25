import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { adminOrigin, isAdminHost, isLocalHost, siteOrigin } from "@/lib/hosts";

/** Paths the office needs. Everything else on the admin host goes back to the
 *  public site, so admin.timesmedia.online is only ever the office. */
const ADMIN_PATHS = ["/admin", "/login", "/invite", "/api"];

/** Served by whichever host asked. robots.txt in particular has to answer on
 *  the admin host — bouncing it to the public site hands a crawler the public
 *  "Allow: /" and the office stops being hidden. */
const PER_HOST = ["/robots.txt", "/sitemap.xml", "/favicon.ico"];

/** Paths that only make sense on the public host. */
const PUBLIC_ONLY = ["/boards", "/field"];

function routeByHost(request: NextRequest) {
  const host = request.headers.get("host");
  if (isLocalHost(host)) return null; // no subdomains in dev

  const { pathname, search } = request.nextUrl;

  if (isAdminHost(host)) {
    if (PER_HOST.includes(pathname) || pathname.startsWith("/.well-known/")) return null;
    // the office lands on the office
    if (pathname === "/") return NextResponse.redirect(`${adminOrigin()}/admin`);
    if (PUBLIC_ONLY.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(`${siteOrigin()}${pathname}${search}`);
    }
    if (!ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      return NextResponse.redirect(`${siteOrigin()}${pathname}${search}`);
    }
    return null;
  }

  // on the public host, /admin belongs somewhere else
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.redirect(`${adminOrigin()}${pathname}${search}`);
  }
  return null;
}

/**
 * Two jobs.
 *
 * One: keep the Supabase session cookie fresh. Without this a field agent's
 * session expires while they are standing at a board and the QR scan drops
 * them at a login screen — exactly the friction the invite flow exists to
 * remove.
 *
 * Two: route by host. See lib/hosts.ts for the split.
 */
export async function middleware(request: NextRequest) {
  const redirect = routeByHost(request);
  if (redirect) return redirect;

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          for (const { name, value } of list) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of list) response.cookies.set(name, value, options);
        },
      },
    },
  );

  // Same here: a stale refresh token is a signed-out user, not an error.
  try {
    await supabase.auth.getUser();
  } catch {
    /* ignore — the route handlers redirect unauthenticated users */
  }

  // The office should never turn up in a search result.
  if (isAdminHost(request.headers.get("host"))) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  return response;
}

export const config = {
  matcher: [
    // everything except static assets and image files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
