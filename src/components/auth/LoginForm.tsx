"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError(error.message.includes("Invalid") ? "Wrong email or password." : error.message);
      setBusy(false);
      return;
    }
    router.replace(next ?? "/admin");
    router.refresh();
  }

  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <form onSubmit={submit} className="w-full max-w-[380px]">
        <h1 className="text-title1 font-[680] text-ink-0">DV Outdoor</h1>
        <p className="mt-1.5 text-subhead text-ink-400">Sign in to continue.</p>

        <div className="mt-8 flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="h-12 w-full rounded-[var(--radius-control)] bg-chrome-raised px-4 text-body text-ink-0 placeholder:text-ink-500 ring-1 ring-white/[0.08] ring-inset outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className="h-12 w-full rounded-[var(--radius-control)] bg-chrome-raised px-4 text-body text-ink-0 placeholder:text-ink-500 ring-1 ring-white/[0.08] ring-inset outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {error && (
          <p
            className="mt-3 rounded-[var(--radius-control)] px-4 py-2.5 text-footnote"
            style={{ color: "var(--color-damaged)", background: "color-mix(in srgb, var(--color-damaged) 12%, transparent)" }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !email || !password}
          className={cn(
            "mt-5 h-12 w-full rounded-[var(--radius-control)] bg-accent text-body font-[620] text-accent-on",
            "transition-opacity disabled:opacity-40",
          )}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <p className="mt-6 text-center text-footnote text-ink-500">
          Field staff: use the link the office sent you.
        </p>
      </form>
    </main>
  );
}
