"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";

export function Toast({
  message,
  onDone,
}: {
  message: string | null;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 3600);
    return () => clearTimeout(t);
  }, [message, onDone]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2.5 rounded-[var(--radius-pill)] material-thick specular-edge py-2.5 pl-3 pr-5"
        >
          <span
            className="grid size-5 place-items-center rounded-full"
            style={{ background: "var(--color-available)" }}
          >
            <Check className="size-3 text-black" strokeWidth={3} />
          </span>
          <span className="text-subhead font-[520] text-ink-0">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
