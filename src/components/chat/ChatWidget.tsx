"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, MessageSquare, X } from "lucide-react";
import type { AgentAction } from "@/lib/agentTools";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };
type Wire = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "How many boards are free in Rajkot?",
  "Who is our biggest client?",
  "What needs fixing most urgently?",
];

export function ChatWidget({ onActions }: { onActions: (a: AgentAction[]) => void }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    setError(null);
    const next: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs(next);
    setBusy(true);
    try {
      const wire: Wire[] = next.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: wire }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Request failed.");
      } else {
        setMsgs((m) => [...m, { role: "assistant", content: data.text || "…" }]);
        if (data.actions?.length) onActions(data.actions as AgentAction[]);
      }
    } catch {
      setError("Could not reach the assistant.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className="pointer-events-auto absolute bottom-6 left-6 z-40 grid size-14 place-items-center rounded-full bg-accent text-accent-on shadow-[var(--shadow-pop)] transition-transform hover:scale-105"
      >
        {open ? <X className="size-6" strokeWidth={2.4} /> : <MessageSquare className="size-6" strokeWidth={2.2} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
            className="pointer-events-auto absolute bottom-24 left-6 z-40 flex h-[560px] w-[400px] flex-col overflow-hidden rounded-[var(--radius-panel)] material-thick shadow-[var(--shadow-pop)] ring-1 ring-white/[0.08]"
          >
            <div className="shrink-0 border-b border-white/[0.07] px-5 py-4">
              <h2 className="text-subhead font-[620] text-ink-0">Ask about your boards</h2>
              <p className="mt-0.5 text-caption text-ink-500">
                Inventory, clients, revenue, maintenance — or tell it to book something.
              </p>
            </div>

            <div ref={scroller} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {msgs.length === 0 && (
                <div className="flex flex-col gap-2 pt-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-[var(--radius-control)] bg-black/25 px-4 py-2.5 text-left text-footnote text-ink-200 ring-1 ring-white/[0.07] ring-inset transition-colors hover:bg-white/[0.07]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {msgs.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[88%] whitespace-pre-wrap rounded-[var(--radius-card)] px-4 py-2.5 text-footnote leading-relaxed",
                    m.role === "user"
                      ? "ml-auto bg-accent text-accent-on"
                      : "bg-black/30 text-ink-100 ring-1 ring-white/[0.06] ring-inset",
                  )}
                >
                  {m.content}
                </div>
              ))}

              {busy && (
                <div className="flex items-center gap-1.5 px-1 py-2">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="size-1.5 rounded-full bg-ink-400"
                      animate={{ opacity: [0.25, 1, 0.25] }}
                      transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
                    />
                  ))}
                </div>
              )}

              {error && (
                <p
                  className="rounded-[var(--radius-control)] px-4 py-2.5 text-footnote"
                  style={{ color: "var(--color-damaged)", background: "color-mix(in srgb, var(--color-damaged) 12%, transparent)" }}
                >
                  {error}
                </p>
              )}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="shrink-0 border-t border-white/[0.07] p-3"
            >
              <div className="relative">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything…"
                  className="h-11 w-full rounded-[var(--radius-control)] bg-black/30 pl-4 pr-12 text-footnote text-ink-0 placeholder:text-ink-500 ring-1 ring-white/[0.08] ring-inset outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || busy}
                  aria-label="Send"
                  className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-[8px] bg-accent text-accent-on transition-opacity disabled:opacity-30"
                >
                  <ArrowUp className="size-4" strokeWidth={2.6} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
