"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A spoken note, for crew who would rather talk than type — and who mostly
 * think in Gujarati. Recording is one big target, and the only states are
 * "hold to talk", "recording", and "recorded"; nothing to read, nothing to
 * choose.
 */
export function VoiceNote({ onChange }: { onChange?: (url: string | null, secs: number) => void }) {
  const [state, setState] = useState<"idle" | "recording" | "done">("idle");
  const [secs, setSecs] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        const u = URL.createObjectURL(blob);
        setUrl(u);
        onChange?.(u, secs);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      rec.current = mr;
      setSecs(0);
      setState("recording");
      timer.current = setInterval(() => setSecs((s) => s + 1), 1000);
    } catch {
      // no mic permission — leave the control alone rather than erroring at
      // someone standing under a hoarding
      setState("idle");
    }
  }

  function stop() {
    rec.current?.stop();
    if (timer.current) clearInterval(timer.current);
    setState("done");
  }

  function reset() {
    setUrl(null); setSecs(0); setState("idle"); setPlaying(false);
    onChange?.(null, 0);
  }

  function toggle() {
    if (!audio.current) return;
    if (playing) { audio.current.pause(); setPlaying(false); }
    else { void audio.current.play(); setPlaying(true); }
  }

  const mmss = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;

  if (state === "done" && url) {
    return (
      <div className="flex h-[68px] w-full items-center gap-4 rounded-[var(--radius-card)] bg-chrome-raised px-5 ring-1 ring-white/[0.1] ring-inset">
        <button
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-on"
        >
          {playing ? <Pause className="size-5" strokeWidth={2.4} /> : <Play className="size-5 translate-x-[1px]" strokeWidth={2.4} />}
        </button>
        <Waveform seed={secs} className="h-8 flex-1" />
        <span className="shrink-0 text-body font-[590] tabular-nums text-ink-100">{mmss}</span>
        <button onClick={reset} aria-label="Delete voice note" className="shrink-0 text-ink-500 hover:text-ink-0">
          <Trash2 className="size-5" strokeWidth={2} />
        </button>
        <audio ref={audio} src={url} onEnded={() => setPlaying(false)} className="hidden" />
      </div>
    );
  }

  return (
    <button
      onClick={state === "recording" ? stop : start}
      className={cn(
        "flex h-[68px] w-full items-center justify-center gap-3 rounded-[var(--radius-card)]",
        "text-body font-[590] ring-1 ring-inset transition-colors",
        state === "recording"
          ? "text-ink-0 ring-transparent"
          : "bg-chrome-raised text-ink-100 ring-white/[0.1]",
      )}
      style={state === "recording" ? { background: "color-mix(in srgb, var(--color-damaged) 18%, transparent)" } : undefined}
    >
      {state === "recording" ? (
        <>
          <span className="grid size-6 place-items-center">
            <Square className="size-4 fill-current" style={{ color: "var(--color-damaged)" }} />
          </span>
          Recording — {mmss}
          <span className="ml-1 size-2 animate-pulse rounded-full" style={{ background: "var(--color-damaged)" }} />
        </>
      ) : (
        <>
          <Mic className="size-6" strokeWidth={2} />
          Record a voice note
        </>
      )}
    </button>
  );
}

/** Static bars — a real analyser would cost a canvas and an audio graph for
 *  something the eye reads as "there is audio here". */
export function Waveform({ seed = 7, className }: { seed?: number; className?: string }) {
  const bars = Array.from({ length: 38 }, (_, i) => {
    const n = Math.sin((i + seed) * 1.7) * Math.cos((i + seed) * 0.6);
    return 22 + Math.abs(n) * 78;
  });
  return (
    <div className={cn("flex items-center gap-[3px]", className)}>
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-[3px] shrink-0 rounded-full"
          style={{ height: `${h}%`, background: "var(--color-ink-500)" }}
        />
      ))}
    </div>
  );
}
