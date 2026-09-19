"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { fadeUp } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await createClient().auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push(searchParams.get("next") ?? "/");
    router.refresh();
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex flex-col items-center">
      <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-accent text-sm font-semibold tracking-tight text-accent-foreground shadow-[var(--shadow-float)]">
        DV
      </div>

      <Card className="w-full max-w-sm p-8 shadow-[var(--shadow-float)]">
        <h1 className="text-[19px] font-semibold tracking-tight text-foreground">DV Outdoor Advertising</h1>
        <p className="mt-1 text-sm text-muted">Sign in to the board portal.</p>

        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-medium text-muted">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-medium text-muted">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-status-damaged">{error}</p>}

          <Button type="submit" disabled={loading} className="mt-2.5 w-full">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>
    </motion.div>
  );
}
