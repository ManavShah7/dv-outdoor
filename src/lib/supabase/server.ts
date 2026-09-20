import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** Cookie-bound client. Carries the signed-in user, subject to RLS. */
export async function createClient() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          try {
            for (const { name, value, options } of list) store.set(name, value, options);
          } catch {
            // called from a Server Component — middleware refreshes instead
          }
        },
      },
    },
  );
}

/**
 * Service-role client. Bypasses RLS entirely, so it is only ever constructed
 * inside a route handler that has already established the caller's authority.
 * Never import this into anything that reaches the browser.
 */
export function createAdminClient() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: "admin" | "field_agent";
  status: "pending" | "approved" | "rejected";
};

/** The signed-in user's profile, or null. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, role, status")
    .eq("id", auth.user.id)
    .single();
  return (data as Profile) ?? null;
}

/** Throws unless the caller is an approved admin. Use at the top of any
 *  route handler that then reaches for the service role. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin" || profile.status !== "approved") {
    throw new Error("forbidden");
  }
  return profile;
}
