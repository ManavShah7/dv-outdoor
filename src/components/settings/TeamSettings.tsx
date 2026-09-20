"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Link2, Mail, MessageCircle, Plus, Trash2, X } from "lucide-react";
import { cn, fullDate } from "@/lib/utils";

type Person = {
  id: string; email: string; full_name: string | null; phone: string | null;
  role: "admin" | "field_agent"; status: "pending" | "approved" | "rejected";
};
type Invite = {
  id: string; token: string; full_name: string; email: string | null; phone: string | null;
  status: "pending" | "accepted" | "revoked" | "expired"; expires_at: string; created_at: string;
};

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="mt-9 first:mt-0">
      <h2 className="text-title3 font-[620] text-ink-0">{title}</h2>
      {sub && <p className="mt-1 text-footnote text-ink-400">{sub}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-11 w-full min-w-0 rounded-[var(--radius-control)] bg-black/30 px-4 text-subhead text-ink-0 placeholder:text-ink-500 ring-1 ring-white/[0.08] ring-inset outline-none focus:ring-2 focus:ring-accent"
    />
  );
}

export function TeamSettings({ meEmail }: { meEmail: string }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [agentName, setAgentName] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [inviteErr, setInviteErr] = useState<string | null>(null);
  const [freshLink, setFreshLink] = useState<{ url: string; name: string; phone: string | null; email: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  const [showAdmin, setShowAdmin] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminErr, setAdminErr] = useState<string | null>(null);
  const [adminOk, setAdminOk] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [p, i] = await Promise.all([
      fetch("/api/team/admins").then((r) => r.json()),
      fetch("/api/team/invites").then((r) => r.json()),
    ]);
    if (p.error || i.error) setLoadError(p.error ?? i.error);
    else {
      setPeople(p.people ?? []);
      setInvites(i.invites ?? []);
      setLoadError(null);
    }
  }, []);

  // The rule fires on the call, but load() is async — every setState inside it
  // runs in a promise callback after the awaits, which is exactly the
  // "subscribe to an external system" shape the rule is protecting.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function createInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteErr(null);
    const res = await fetch("/api/team/invites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fullName: agentName, email: agentEmail, phone: agentPhone }),
    });
    const d = await res.json();
    if (!res.ok) { setInviteErr(d.error ?? "Could not create the invite."); return; }
    setFreshLink({
      url: `${window.location.origin}/invite/${d.invite.token}`,
      name: d.invite.full_name,
      phone: d.invite.phone,
      email: d.invite.email,
    });
    setAgentName(""); setAgentEmail(""); setAgentPhone("");
    void load();
  }

  async function revoke(id: string) {
    await fetch(`/api/team/invites?id=${id}`, { method: "DELETE" });
    void load();
  }

  async function createAdmin(e: React.FormEvent) {
    e.preventDefault();
    setAdminErr(null); setAdminOk(null);
    const res = await fetch("/api/team/admins", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fullName: adminName, email: adminEmail, password: adminPass }),
    });
    const d = await res.json();
    if (!res.ok) { setAdminErr(d.error ?? "Could not create the admin."); return; }
    setAdminOk(`${d.email} can sign in now.`);
    setAdminName(""); setAdminEmail(""); setAdminPass("");
    void load();
  }

  const admins = people.filter((p) => p.role === "admin");
  const agents = people.filter((p) => p.role === "field_agent");
  const pending = invites.filter((i) => i.status === "pending");

  return (
    <div className="h-full overflow-y-auto material-thick">
      <div className="mx-auto max-w-[900px] px-10 py-9">
        <h1 className="text-title2 font-[680] text-ink-0">Team</h1>

        {loadError && (
          <p
            className="mt-4 rounded-[var(--radius-control)] px-4 py-3 text-footnote"
            style={{ color: "var(--color-damaged)", background: "color-mix(in srgb, var(--color-damaged) 12%, transparent)" }}
          >
            {loadError} — if this mentions <code>field_invites</code>, run <code>supabase/02_invites.sql</code> first.
          </p>
        )}

        {/* ---------------------------------------------- invite an agent */}
        <Section
          title="Invite a field agent"
          sub="You enter their name; they set their own password. After that, scanning a board's QR takes them straight in."
        >
          <form onSubmit={createInvite} className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-chrome-raised p-5 ring-1 ring-white/[0.07] ring-inset">
            <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="Agent's full name" />
            <div className="grid grid-cols-2 gap-3">
              <Input type="email" value={agentEmail} onChange={(e) => setAgentEmail(e.target.value)} placeholder="Email (optional)" />
              <Input value={agentPhone} onChange={(e) => setAgentPhone(e.target.value)} placeholder="Phone (optional)" />
            </div>
            <p className="-mt-1 text-caption text-ink-600">One of email or phone is enough.</p>
            {inviteErr && <p className="text-footnote" style={{ color: "var(--color-damaged)" }}>{inviteErr}</p>}
            <button
              type="submit"
              disabled={agentName.trim().length < 2 || (!agentEmail.trim() && !agentPhone.trim())}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-accent text-subhead font-[590] text-accent-on transition-opacity disabled:opacity-35"
            >
              <Link2 className="size-4" strokeWidth={2.2} /> Create invite link
            </button>
          </form>

          {freshLink && (
            <div className="mt-3 rounded-[var(--radius-card)] p-5 ring-1 ring-inset"
                 style={{ background: "color-mix(in srgb, var(--color-available) 10%, transparent)", borderColor: "transparent" }}>
              <p className="text-subhead font-[590] text-ink-0">Link ready for {freshLink.name}</p>
              <p className="mt-1 text-caption text-ink-400">Valid for 14 days, single use.</p>
              <div className="mt-3 flex items-center gap-2 rounded-[var(--radius-control)] bg-black/40 px-3 py-2.5">
                <code className="min-w-0 flex-1 truncate text-caption text-ink-300">{freshLink.url}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(freshLink.url); setCopied(true); setTimeout(() => setCopied(false), 1600); }}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-[7px] bg-white/10 px-2.5 py-1.5 text-caption font-[590] text-ink-100 hover:bg-white/[0.16]"
                >
                  {copied ? <Check className="size-3.5" strokeWidth={2.6} /> : <Copy className="size-3.5" strokeWidth={2.2} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                {freshLink.phone && (
                  <a
                    href={`https://wa.me/${freshLink.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${freshLink.name}, set up your DV Outdoor account here: ${freshLink.url}`)}`}
                    target="_blank" rel="noreferrer"
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-black/30 text-footnote font-[590] text-ink-100 ring-1 ring-white/[0.1] ring-inset hover:bg-white/[0.07]"
                  >
                    <MessageCircle className="size-4" strokeWidth={2} /> WhatsApp
                  </a>
                )}
                {freshLink.email && (
                  <a
                    href={`mailto:${freshLink.email}?subject=${encodeURIComponent("Your DV Outdoor account")}&body=${encodeURIComponent(`Hello ${freshLink.name},\n\nSet up your account here:\n${freshLink.url}\n\nThis link works once and expires in 14 days.`)}`}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-black/30 text-footnote font-[590] text-ink-100 ring-1 ring-white/[0.1] ring-inset hover:bg-white/[0.07]"
                  >
                    <Mail className="size-4" strokeWidth={2} /> Email
                  </a>
                )}
                <button onClick={() => setFreshLink(null)} aria-label="Dismiss"
                        className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-control)] text-ink-400 hover:text-ink-0">
                  <X className="size-4" strokeWidth={2.2} />
                </button>
              </div>
            </div>
          )}
        </Section>

        {/* ---------------------------------------------- pending invites */}
        {pending.length > 0 && (
          <Section title="Waiting to be accepted">
            <div className="flex flex-col gap-2">
              {pending.map((i) => (
                <div key={i.id} className="flex items-center gap-4 rounded-[var(--radius-card)] bg-chrome-raised px-5 py-3.5 ring-1 ring-white/[0.07] ring-inset">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-subhead font-[590] text-ink-0">{i.full_name}</p>
                    <p className="truncate text-caption text-ink-500">
                      {i.email ?? i.phone} · expires {fullDate(i.expires_at.slice(0, 10))}
                    </p>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/invite/${i.token}`); }}
                    className="shrink-0 rounded-[7px] bg-white/[0.08] px-3 py-1.5 text-caption font-[590] text-ink-200 hover:bg-white/[0.14]"
                  >
                    Copy link
                  </button>
                  <button onClick={() => revoke(i.id)} aria-label="Revoke"
                          className="grid size-8 shrink-0 place-items-center rounded-full text-ink-500 hover:text-ink-0">
                    <Trash2 className="size-4" strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ---------------------------------------------- roster */}
        <Section title={`Field agents (${agents.length})`}>
          {agents.length === 0 ? (
            <p className="text-footnote text-ink-500">Nobody yet. Send an invite above.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {agents.map((p) => (
                <div key={p.id} className="flex items-center gap-4 rounded-[var(--radius-card)] bg-chrome-raised px-5 py-3.5 ring-1 ring-white/[0.07] ring-inset">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-subhead font-[590] text-ink-0">{p.full_name ?? p.email}</p>
                    <p className="truncate text-caption text-ink-500">{p.email}</p>
                  </div>
                  <span
                    className="shrink-0 rounded-[var(--radius-pill)] px-2.5 py-1 text-caption font-[620]"
                    style={{
                      color: p.status === "approved" ? "var(--color-available)" : "var(--color-maintenance)",
                      background: `color-mix(in srgb, ${p.status === "approved" ? "var(--color-available)" : "var(--color-maintenance)"} 15%, transparent)`,
                    }}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title={`Admins (${admins.length})`}>
          <div className="flex flex-col gap-2">
            {admins.map((p) => (
              <div key={p.id} className="flex items-center gap-4 rounded-[var(--radius-card)] bg-chrome-raised px-5 py-3.5 ring-1 ring-white/[0.07] ring-inset">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-subhead font-[590] text-ink-0">
                    {p.full_name ?? p.email}
                    {p.email === meEmail && <span className="ml-2 text-caption font-normal text-ink-500">you</span>}
                  </p>
                  <p className="truncate text-caption text-ink-500">{p.email}</p>
                </div>
              </div>
            ))}
          </div>

          {!showAdmin ? (
            <button
              onClick={() => setShowAdmin(true)}
              className="mt-3 inline-flex h-10 items-center gap-2 rounded-[var(--radius-control)] bg-black/25 px-4 text-footnote font-[590] text-ink-200 ring-1 ring-white/[0.08] ring-inset hover:bg-white/[0.07]"
            >
              <Plus className="size-4" strokeWidth={2.4} /> Add an admin
            </button>
          ) : (
            <form onSubmit={createAdmin} className="mt-3 flex flex-col gap-3 rounded-[var(--radius-card)] bg-chrome-raised p-5 ring-1 ring-white/[0.07] ring-inset">
              <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Full name" />
              <div className="grid grid-cols-2 gap-3">
                <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="Email" />
                <Input type="password" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} placeholder="Temporary password" />
              </div>
              {adminErr && <p className="text-footnote" style={{ color: "var(--color-damaged)" }}>{adminErr}</p>}
              {adminOk && <p className="text-footnote" style={{ color: "var(--color-available)" }}>{adminOk}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!adminName || !adminEmail || adminPass.length < 8}
                  className="h-11 flex-1 rounded-[var(--radius-control)] bg-accent text-subhead font-[590] text-accent-on transition-opacity disabled:opacity-35"
                >
                  Create admin
                </button>
                <button type="button" onClick={() => setShowAdmin(false)}
                        className={cn("h-11 rounded-[var(--radius-control)] px-5 text-subhead font-[590] text-ink-400 hover:text-ink-0")}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Section>
      </div>
    </div>
  );
}
