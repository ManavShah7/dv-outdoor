"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * Reveal on first sight: a 16px rise and a fade, once, never undone.
 *
 * One observer per element rather than one shared observer with a registry —
 * there are a couple of dozen of these on the page, not a couple of
 * thousand, and the simpler version has no bookkeeping to get wrong.
 *
 * It unobserves itself on the way in, so scrolling back up does not replay
 * anything. A page that re-animates on every pass is the single most common
 * way scroll motion turns from craft into noise.
 *
 * `prefers-reduced-motion` is handled in CSS, not here: the element still
 * gets its data attribute, the transition is simply removed. That keeps the
 * reduced-motion path on exactly the same DOM as the animated one.
 */
export function Reveal({
  as: Tag = "div",
  delay = 0,
  variant = "rise",
  className = "",
  children,
  ...rest
}: {
  as?: ElementType;
  /** ms, for staggering siblings */
  delay?: number;
  variant?: "rise" | "rule";
  className?: string;
  children?: ReactNode;
} & Record<string, unknown>) {
  const ref = useRef<HTMLElement | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;

    // Anything already on screen at mount should not animate in — on a
    // reload partway down the page that reads as content arriving late.
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.85 && r.bottom > 0) {
      setSeen(true);
      return;
    }

    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setSeen(true);
        io.disconnect();
      },
      // fires a little before the element's top edge arrives, so the motion
      // finishes about when it reaches comfortable reading height
      { rootMargin: "0px 0px -12% 0px", threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);

  return (
    <Tag
      ref={ref}
      className={`${variant === "rule" ? "ed-rev-rule" : "ed-rev"} ${className}`.trim()}
      style={delay ? ({ "--d": `${delay}ms` } as Record<string, string>) : undefined}
      {...(seen ? { "data-in": "" } : {})}
      {...rest}
    >
      {children}
    </Tag>
  );
}
