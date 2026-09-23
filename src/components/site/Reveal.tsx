"use client";

import { useEffect, useRef } from "react";

/**
 * Apple's scroll-linked reveal, measured off apple.com (see
 * ~/.claude/refs/apple-motion-2026.md).
 *
 *  1. Scroll → progress is *linear*, no easing. Starts when the element's top
 *     is at 108% of viewport height, done at 68% — a 40vh window.
 *  2. The rendered value chases that target with exponential decay rather than
 *     a transition: current += (target - current) * 0.15 per frame. Park the
 *     scroll mid-way and it keeps easing in. That is the whole trick.
 *
 * Opacity rides the same progress. Stagger comes from varying `amplitude`
 * between neighbours, which stays correct at any scroll speed — unlike a
 * transition-delay.
 *
 * One shared rAF loop drives every element on the page; a loop per component
 * would mean a dozen independent tickers running forever.
 */
type Entry = { el: HTMLElement; amp: number; cur: number };

const entries = new Set<Entry>();
let raf = 0;

function tick() {
  const vh = window.innerHeight;
  for (const e of entries) {
    const top = e.el.getBoundingClientRect().top;
    const progress = Math.min(1, Math.max(0, (1.08 * vh - top) / (0.4 * vh)));
    const target = (1 - progress) * e.amp;
    e.cur += (target - e.cur) * 0.15;
    if (Math.abs(e.cur - target) < 0.01) e.cur = target;
    e.el.style.transform = e.cur === 0 ? "none" : `translateY(${e.cur.toFixed(2)}px)`;
    e.el.style.opacity = String(1 - e.cur / e.amp);
  }
  raf = entries.size ? requestAnimationFrame(tick) : 0;
}

export function Reveal({
  children,
  amplitude = 30,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  amplitude?: number;
  className?: string;
  as?: "div" | "section" | "li" | "header" | "figure";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const entry: Entry = { el, amp: amplitude, cur: amplitude };
    el.style.transform = `translateY(${amplitude}px)`;
    el.style.opacity = "0";
    entries.add(entry);
    if (!raf) raf = requestAnimationFrame(tick);

    return () => {
      entries.delete(entry);
      if (!entries.size && raf) { cancelAnimationFrame(raf); raf = 0; }
    };
  }, [amplitude]);

  return (
    <Tag ref={ref as never} className={className ? `reveal ${className}` : "reveal"}>
      {children}
    </Tag>
  );
}
