"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Invite = { fullName: string; email: string | null; phone: string | null };

export function AcceptInvite({ token }: { token: string }) {
  const router = useRouter();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/invite/accept?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) setLoadError(d.error ?? "This link is not valid.");
        else {
          setInvite(d.invite);
          if (d.invite.email) setEmail(d.invite.email);
        }
      })
      .catch(() => setLoadError("Could not check this link."));
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = await fetch("/api/invite/accept", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, email: email.trim(), password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not create your account.");
      setBusy(false);
      return;
    }

    // sign straight in — they should never see a login screen after this
    const supabase = createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInErr) {
      router.replace("/login");
      return;
    }
    router.replace("/field");
    router.refresh();
  }

  if (loadError) {
    return (
      <main className="grid min-h-dvh place-items-center px-6 text-center">
        <div className="max-w-[360px]">
          <h1 className="text-title2 font-[680] text-ink-0">Link not usable</h1>
          <p className="mt-3 text-body text-ink-300">{loadError}</p>
        </div>
      </main>
    );
  }

  if (!invite) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <p className="text-subhead text-ink-500">Checking your link…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-[460px] px-6 pb-10 pt-12">
      <span
        className="grid size-12 place-items-center rounded-full"
        style={{ background: "color-mix(in srgb, var(--color-available) 18%, transparent)" }}
      >
        <Check className="size-6" strokeWidth={2.6} style={{ color: "var(--color-available)" }} />
      </span>

      <h1 className="mt-5 text-title1 font-[680] leading-tight text-ink-0">
        Welcome, {invite.fullName.split(" ")[0]}
      </h1>
      <p className="mt-2 text-body text-ink-300">
        DV Outdoor has invited you as a field agent. Set a password and you are done —
        after this, scanning a board&rsquo;s QR code takes you straight in.
      </p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <div>
          <label className="mb-2 block text-subhead text-ink-300">Your name</label>
          <div className="flex h-[60px] items-center rounded-[var(--radius-card)] bg-black/25 px-5 text-body text-ink-300 ring-1 ring-white/[0.07] ring-inset">
            {invite.fullName}
          </div>
          <p className="mt-1.5 text-caption text-ink-600">Set by the office. Ask them if it is wrong.</p>
        </div>

        <div>
          <label className="mb-2 block text-subhead text-ink-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="h-[60px] w-full rounded-[var(--radius-card)] bg-chrome-raised px-5 text-body text-ink-0 placeholder:text-ink-500 ring-1 ring-white/[0.1] ring-inset outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label className="mb-2 block text-subhead text-ink-300">Create a password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            className="h-[60px] w-full rounded-[var(--radius-card)] bg-chrome-raised px-5 text-body text-ink-0 placeholder:text-ink-500 ring-1 ring-white/[0.1] ring-inset outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {error && (
          <p
            className="rounded-[var(--radius-control)] px-4 py-3 text-footnote"
            style={{ color: "var(--color-damaged)", background: "color-mix(in srgb, var(--color-damaged) 12%, transparent)" }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !email || password.length < 8}
          className="mt-2 h-[64px] w-full rounded-[var(--radius-card)] bg-accent text-title3 font-[620] text-accent-on transition-opacity disabled:opacity-35"
        >
          {busy ? "Creating…" : "Create my account"}
        </button>
      </form>
    </main>
  );
}
