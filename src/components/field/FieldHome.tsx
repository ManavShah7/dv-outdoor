"use client";

import { useRouter } from "next/navigation";
import { QrCode, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/** What a signed-in agent sees when they open the app without scanning. */
export function FieldHome({ name }: { name: string }) {
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col px-6 pb-10 pt-14">
      <h1 className="text-title1 font-[680] leading-tight text-ink-0">
        Hello, {name.split(" ")[0]}
      </h1>
      <p className="mt-3 text-body text-ink-300">
        Scan the QR code on a board to report a problem or mark a repair done.
      </p>

      <div className="mt-10 flex flex-col items-center gap-4 rounded-[var(--radius-panel)] bg-chrome-raised px-6 py-12 text-center ring-1 ring-white/[0.07] ring-inset">
        <QrCode className="size-16 text-ink-600" strokeWidth={1.4} />
        <p className="text-body text-ink-400">
          Use your phone camera on the sticker at the board.
        </p>
      </div>

      <button
        onClick={signOut}
        className="mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] text-subhead font-[590] text-ink-400 transition-colors hover:text-ink-0"
      >
        <LogOut className="size-4" strokeWidth={2} />
        Sign out
      </button>
    </main>
  );
}
