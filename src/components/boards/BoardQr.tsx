"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, Printer } from "lucide-react";
import type { Board } from "@/lib/types";

/**
 * Every board gets a QR that resolves to its own field page. The crew scans
 * the sticker on the pole and lands directly on that board — no account, no
 * typing, no choosing from a list of 650.
 */
export function BoardQr({ board }: { board: Board }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const target =
    (process.env.NEXT_PUBLIC_SITE_URL ?? "https://dvoutdoor.example").replace(/\/$/, "") +
    `/field/${board.code}`;

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(target, {
      errorCorrectionLevel: "H", // stickers on poles get weathered and scratched
      margin: 2,
      width: 512,
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then((url) => alive && setDataUrl(url))
      .catch(() => alive && setDataUrl(null));
    return () => { alive = false; };
  }, [target]);

  function download() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${board.code}-qr.png`;
    a.click();
  }

  function print() {
    if (!dataUrl) return;
    const w = window.open("", "_blank", "width=420,height=560");
    if (!w) return;
    w.document.write(
      `<html><head><title>${board.code}</title></head>
       <body style="margin:0;display:grid;place-items:center;height:100vh;font-family:system-ui">
       <div style="text-align:center">
         <img src="${dataUrl}" style="width:300px;height:300px"/>
         <div style="font:600 20px system-ui;margin-top:8px">${board.code}</div>
         <div style="font:400 13px system-ui;color:#555;max-width:300px">${board.address}</div>
       </div></body></html>`,
    );
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-[var(--radius-card)] bg-white p-3">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt={`QR code for ${board.code}`} className="size-[168px]" />
        ) : (
          <div className="size-[168px] animate-pulse rounded bg-ink-200" />
        )}
      </div>
      <p className="text-center text-caption leading-snug text-ink-500">
        Scans to the field page for{" "}
        <span className="font-mono text-ink-300">{board.code}</span>
      </p>
      <div className="flex w-full gap-2">
        <button
          onClick={download}
          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-black/25 text-footnote font-[590] text-ink-100 ring-1 ring-white/[0.1] ring-inset transition-colors hover:bg-white/[0.07]"
        >
          <Download className="size-4" strokeWidth={2} /> PNG
        </button>
        <button
          onClick={print}
          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-black/25 text-footnote font-[590] text-ink-100 ring-1 ring-white/[0.1] ring-inset transition-colors hover:bg-white/[0.07]"
        >
          <Printer className="size-4" strokeWidth={2} /> Print
        </button>
      </div>
    </div>
  );
}
