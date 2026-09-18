import type { Transition, Variants } from "motion/react";

// Two spring feels, used consistently everywhere instead of ad-hoc easing
// curves per component — this is what keeps motion feeling like one
// coherent system rather than decoration bolted onto each screen.
export const springSubtle: Transition = { type: "spring", stiffness: 380, damping: 32, mass: 0.9 };
export const springSnappy: Transition = { type: "spring", stiffness: 520, damping: 30, mass: 0.7 };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: springSubtle },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: springSubtle },
};

export const listStagger: Variants = {
  visible: { transition: { staggerChildren: 0.035 } },
};
