"use client";

import { useEffect, useRef } from "react";

/**
 * Apple's scroll-linked reveal, as measured off apple.com/apple-music and
 * /airpods-5 (see ~/.claude/refs/apple-motion-2026.md).
 *
 * Two parts, and the second is the whole trick:
 *
 *  1. Scroll maps to progress *linearly* — no easing curve at all. The element
 *     starts moving when its top is at 108% of viewport height and finishes at
 *     68%, a window of 40vh.
 *
 *  2. The rendered value chases that target with exponential decay rather than
 *     playing a transition: `current += (target - current) * 0.15` every frame.
 *     Park the scroll mid-way and it keeps easing in. That is why it feels
 *     attached to your hand instead of played back at you, and why a fast
 *     flick settles gracefully instead of snapping.
 *
 * Opacity rides the same progress, so it is exactly `1 - y/amplitude`.
 *
 * `amplitude` is the stagger device: neighbours with different travel arrive at
 * different times from the same trigger point, which stays correct at any
 * scroll speed — a transition-delay does not.
 */
export function Reveal({
  children,
  amplitude = 30,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  amplitude?: number;
  className?: string;
  as?: "div" | "section" | "li" | "header";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let current = amplitude;
    let raf = 0;
    let running = true;

    el.style.transform = `translateY(${amplitude}px)`;
    el.style.opacity = "0";

    const tick = () => {
      if (!running) return;
      const vh = window.innerHeight;
      const top = el.getBoundingClientRect().top;
      // linear scroll → progress, 108vh down to 68vh
      const progress = Math.min(1, Math.max(0, (1.08 * vh - top) / (0.4 * vh)));
      const target = (1 - progress) * amplitude;

      // damped follower — ~0.15 per frame at 60fps, time constant ~100ms
      current += (target - current) * 0.15;
      if (Math.abs(current - target) < 0.01) current = target;

      el.style.transform = `translateY(${current.toFixed(2)}px)`;
      el.style.opacity = String(1 - current / amplitude);

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(raf); };
  }, [amplitude]);

  return (
    <Tag ref={ref as never} className={className ? `reveal ${className}` : "reveal"}>
      {children}
    </Tag>
  );
}
