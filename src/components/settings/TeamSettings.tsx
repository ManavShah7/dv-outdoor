"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Check, Copy, HardHat, Mail, MessageCircle, Plus, Shield, Trash2, UserPlus, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Person = {
  id: string; email: string; full_name: string | null; phone: string | null;
  role: "admin" | "field_agent"; status: "pending" | "approved" | "rejected";
};
type Invite = {
  id: string; token: string; full_name: string; email: string | null; phone: string | null;
  status: "pending" | "accepted" | "revoked" | "expired"; expires_at: string; created_at: string;
};

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function daysLeft(iso: string) {
  const d = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  return d <= 0 ? "expired" : d === 1 ? "1 day left" : `${d} days left`;
}

function Avatar({ name, tone }: { name: string; tone: "admin" | "agent" }) {
  const color = tone === "admin" ? "var(--accent)" : "var(--color-available)";
  return (
    <span
      className="grid size-10 shrink-0 place-items-center rounded-full text-footnote font-[680]"
      style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
    >
      {initials(name) || "?"}
    </span>
  );
}

function Field({
  label, hint, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-footnote text-ink-400">{label}</span>
      <input
        {...props}
        className="h-11 w-full min-w-0 rounded-[var(--radius-control)] bg-black/30 px-4 text-subhead text-ink-0 placeholder:text-ink-600 ring-1 ring-white/[0.08] ring-inset outline-none transition-shadow focus:ring-2 focus:ring-accent"
      />
      {hint && <span className="mt-1.5 block text-caption text-ink-600">{hint}</span>}
    </label>
  );
}

function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-[var(--radius-card)] bg-chrome-raised ring-1 ring-white/[0.07] ring-inset",
        className,
      )}
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
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState<{ url: string; name: string; phone: string | null; email: string | null } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

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
  // runs in a promise callback after the awaits.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1600);
  }

  async function createInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteErr(null);
    setBusy(true);
    const res = await fetch("/api/team/invites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fullName: agentName, email: agentEmail, phone: agentPhone }),
    });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) { setInviteErr(d.error ?? "Could not create the invite."); return; }
    setFresh({
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
  const canInvite = agentName.trim().length >= 2 && (!!agentEmail.trim() || !!agentPhone.trim());

  return (
    <div className="h-full overflow-y-auto material-thick">
      <div className="mx-auto max-w-[1080px] px-10 py-9">
        <header>
          <h1 className="text-title2 font-[680] text-ink-0">Team</h1>
          <p className="mt-1.5 text-subhead text-ink-400">
            {admins.length} admin{admins.length === 1 ? "" : "s"} · {agents.length} field agent
            {agents.length === 1 ? "" : "s"}
            {pending.length > 0 && ` · ${pending.length} invite${pending.length === 1 ? "" : "s"} waiting`}
          </p>
        </header>

        {loadError && (
          <p
            className="mt-5 rounded-[var(--radius-control)] px-4 py-3 text-footnote"
            style={{ color: "var(--color-damaged)", background: "color-mix(in srgb, var(--color-damaged) 12%, transparent)" }}
          >
            {loadError}
          </p>
        )}

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          {/* ------------------------------------------------- invite column */}
          <div className="flex flex-col gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-full"
                  style={{ background: "color-mix(in srgb, var(--color-available) 15%, transparent)" }}
                >
                  <HardHat className="size-5" strokeWidth={2} style={{ color: "var(--color-available)" }} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-subhead font-[620] text-ink-0">Invite a field agent</h2>
                  <p className="text-caption text-ink-500">They set their own password</p>
                </div>
              </div>

              <form onSubmit={createInvite} className="mt-5 flex flex-col gap-4">
                <Field
                  label="Their full name"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Jignesh Vala"
                  hint="This is the name the office sees on every report they raise."
                />
                <Field
                  label="Phone"
                  value={agentPhone}
                  onChange={(e) => setAgentPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
                <Field
                  label="Email"
                  type="email"
                  value={agentEmail}
                  onChange={(e) => setAgentEmail(e.target.value)}
                  placeholder="optional"
                  hint="Either one is enough — it's just how you send the link."
                />

                {inviteErr && (
                  <p className="text-footnote" style={{ color: "var(--color-damaged)" }}>{inviteErr}</p>
                )}

                <button
                  type="submit"
                  disabled={!canInvite || busy}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-accent text-subhead font-[590] text-accent-on transition-opacity disabled:opacity-35"
                >
                  <UserPlus className="size-4" strokeWidth={2.4} />
                  {busy ? "Creating…" : "Create invite link"}
                </button>
              </form>
            </Card>

            <AnimatePresence>
              {fresh && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                >
                  <Card
                    className="p-6"
                    style={{ boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-available) 35%, transparent)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="grid size-6 shrink-0 place-items-center rounded-full"
                          style={{ background: "var(--color-available)" }}
                        >
                          <Check className="size-3.5 text-black" strokeWidth={3} />
                        </span>
                        <h3 className="text-subhead font-[620] text-ink-0">
                          Link ready for {fresh.name}
                        </h3>
                      </div>
                      <button
                        onClick={() => setFresh(null)}
                        aria-label="Dismiss"
                        className="-mr-1 -mt-1 grid size-7 shrink-0 place-items-center rounded-full text-ink-500 hover:text-ink-0"
                      >
                        <X className="size-4" strokeWidth={2.2} />
                      </button>
                    </div>

                    <p className="mt-1.5 pl-[34px] text-caption text-ink-500">
                      Works once · expires in 14 days
                    </p>

                    <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-control)] bg-black/45 px-3 py-2.5">
                      <code className="min-w-0 flex-1 truncate text-caption text-ink-300">{fresh.url}</code>
                      <button
                        onClick={() => copy(fresh.url, "fresh")}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-[7px] bg-white/10 px-2.5 py-1.5 text-caption font-[590] text-ink-100 transition-colors hover:bg-white/[0.18]"
                      >
                        {copied === "fresh"
                          ? <><Check className="size-3.5" strokeWidth={2.8} /> Copied</>
                          : <><Copy className="size-3.5" strokeWidth={2.2} /> Copy</>}
                      </button>
                    </div>

                    <div className="mt-3 flex gap-2">
                      {fresh.phone && (
                        <a
                          href={`https://wa.me/${fresh.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${fresh.name}, set up your DV Outdoor account here: ${fresh.url}`)}`}
                          target="_blank" rel="noreferrer"
                          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-black/30 text-footnote font-[590] text-ink-100 ring-1 ring-white/[0.1] ring-inset transition-colors hover:bg-white/[0.08]"
                        >
                          <MessageCircle className="size-4" strokeWidth={2} /> WhatsApp
                        </a>
                      )}
                      {fresh.email && (
                        <a
                          href={`mailto:${fresh.email}?subject=${encodeURIComponent("Your DV Outdoor account")}&body=${encodeURIComponent(`Hello ${fresh.name},\n\nSet up your account here:\n${fresh.url}\n\nThis link works once and expires in 14 days.`)}`}
                          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-black/30 text-footnote font-[590] text-ink-100 ring-1 ring-white/[0.1] ring-inset transition-colors hover:bg-white/[0.08]"
                        >
                          <Mail className="size-4" strokeWidth={2} /> Email
                        </a>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ------------------------------------------------- roster column */}
          <div className="flex flex-col gap-6">
            {pending.length > 0 && (
              <section>
                <h2 className="text-caption2 uppercase text-ink-500">Waiting to be accepted</h2>
                <div className="mt-3 flex flex-col gap-2">
                  {pending.map((i) => (
                    <Card key={i.id} className="flex items-center gap-3 px-4 py-3">
                      <Avatar name={i.full_name} tone="agent" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-subhead font-[590] text-ink-0">{i.full_name}</p>
                        <p className="truncate text-caption text-ink-500">
                          {i.email ?? i.phone} · {daysLeft(i.expires_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => copy(`${window.location.origin}/invite/${i.token}`, i.id)}
                        className="shrink-0 rounded-[7px] bg-white/[0.08] px-3 py-1.5 text-caption font-[590] text-ink-200 transition-colors hover:bg-white/[0.16]"
                      >
                        {copied === i.id ? "Copied" : "Copy link"}
                      </button>
                      <button
                        onClick={() => revoke(i.id)}
                        aria-label={`Revoke invite for ${i.full_name}`}
                        className="grid size-8 shrink-0 place-items-center rounded-full text-ink-600 transition-colors hover:text-ink-0"
                      >
                        <Trash2 className="size-4" strokeWidth={2} />
                      </button>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-caption2 uppercase text-ink-500">Field agents</h2>
              <div className="mt-3">
                {agents.length === 0 ? (
                  <Card className="px-5 py-8 text-center">
                    <HardHat className="mx-auto size-7 text-ink-700" strokeWidth={1.6} />
                    <p className="mt-3 text-subhead text-ink-400">No field agents yet</p>
                    <p className="mt-1 text-caption text-ink-600">
                      Send an invite and they&rsquo;ll appear here once they accept.
                    </p>
                  </Card>
                ) : (
                  <div className="flex flex-col gap-2">
                    {agents.map((p) => (
                      <Card key={p.id} className="flex items-center gap-3 px-4 py-3">
                        <Avatar name={p.full_name ?? p.email} tone="agent" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-subhead font-[590] text-ink-0">
                            {p.full_name ?? p.email}
                          </p>
                          <p className="truncate text-caption text-ink-500">{p.email}</p>
                        </div>
                        <span
                          className="shrink-0 rounded-[var(--radius-pill)] px-2.5 py-1 text-caption font-[620] capitalize"
                          style={{
                            color: p.status === "approved" ? "var(--color-available)" : "var(--color-maintenance)",
                            background: `color-mix(in srgb, ${p.status === "approved" ? "var(--color-available)" : "var(--color-maintenance)"} 15%, transparent)`,
                          }}
                        >
                          {p.status}
                        </span>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-caption2 uppercase text-ink-500">Admins</h2>
                {!showAdmin && (
                  <button
                    onClick={() => setShowAdmin(true)}
                    className="inline-flex items-center gap-1.5 text-caption font-[590] text-ink-400 transition-colors hover:text-ink-0"
                  >
                    <Plus className="size-3.5" strokeWidth={2.6} /> Add
                  </button>
                )}
              </div>

              <div className="mt-3 flex flex-col gap-2">
                {admins.map((p) => (
                  <Card key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <Avatar name={p.full_name ?? p.email} tone="admin" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-subhead font-[590] text-ink-0">
                        {p.full_name ?? p.email}
                        {p.email === meEmail && (
                          <span className="ml-2 text-caption font-normal text-ink-600">you</span>
                        )}
                      </p>
                      <p className="truncate text-caption text-ink-500">{p.email}</p>
                    </div>
                    <span
                      className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-1 text-caption font-[620]"
                      style={{ color: "var(--accent)", background: "color-mix(in srgb, var(--accent) 15%, transparent)" }}
                    >
                      <Shield className="size-3" strokeWidth={2.6} /> admin
                    </span>
                  </Card>
                ))}
              </div>

              <AnimatePresence>
                {showAdmin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                    className="overflow-hidden"
                  >
                    <Card className="mt-2 p-5">
                      <form onSubmit={createAdmin} className="flex flex-col gap-4">
                        <Field label="Full name" value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Name" />
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="name@dvoutdoor.in" />
                          <Field label="Temporary password" type="password" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} placeholder="8+ characters" />
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
                          <button
                            type="button"
                            onClick={() => { setShowAdmin(false); setAdminErr(null); setAdminOk(null); }}
                            className="h-11 rounded-[var(--radius-control)] px-5 text-subhead font-[590] text-ink-400 transition-colors hover:text-ink-0"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
