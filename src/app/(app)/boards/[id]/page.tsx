import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { ImageOff, Pencil } from "lucide-react";
import { getBoardById, getBoardHistory, getBoardListingPhoto } from "@/lib/supabase/boards";
import { BOARD_TYPE_LABELS } from "@/lib/boards";
import { getSiteUrl } from "@/lib/site";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PermitBadge } from "@/components/ui/PermitBadge";
import { Card } from "@/components/ui/Card";
import { StatusHistoryTimeline } from "@/components/boards/StatusHistoryTimeline";

export default async function BoardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const board = await getBoardById(id);
  if (!board) notFound();

  const [history, listingPhoto, qrDataUrl] = await Promise.all([
    getBoardHistory(board.id),
    getBoardListingPhoto(board.id),
    QRCode.toDataURL(`${getSiteUrl()}/boards/${board.id}`, { margin: 1, width: 240 }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs tracking-tight text-muted">{board.code}</p>
          <h1 className="mt-0.5 text-[26px] font-semibold tracking-tight text-foreground">{board.name}</h1>
          <p className="mt-0.5 text-sm text-muted">
            {board.city}
            {board.address ? ` · ${board.address}` : ""}
          </p>
        </div>
        <Link
          href={`/boards/${board.id}/edit`}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-sm font-medium tracking-tight text-foreground transition-colors hover:border-foreground/25"
        >
          <Pencil className="size-3.5" />
          Edit
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusBadge status={board.status} />
        <PermitBadge permitExpiryDate={board.permit_expiry_date} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted">Current photo</h2>
          <div className="mt-3 flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-foreground/[0.03]">
            {listingPhoto ? (
              <Image
                src={listingPhoto.photo_url}
                alt={board.name}
                width={800}
                height={450}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted">
                <ImageOff className="size-6" />
                <p className="text-xs">No photo yet</p>
              </div>
            )}
          </div>

          <h2 className="mt-7 text-[11px] font-semibold uppercase tracking-wide text-muted">Details</h2>
          <dl className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">Type</dt>
              <dd className="text-foreground">{BOARD_TYPE_LABELS[board.board_type]}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">Size</dt>
              <dd className="text-foreground">{board.size_label ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">Permit expiry</dt>
              <dd className="text-foreground">{board.permit_expiry_date ?? "—"}</dd>
            </div>
          </dl>
          {board.notes && (
            <>
              <h2 className="mt-7 text-[11px] font-semibold uppercase tracking-wide text-muted">Notes</h2>
              <p className="mt-2 text-sm text-muted">{board.notes}</p>
            </>
          )}
        </Card>

        <Card className="flex flex-col items-center gap-3 p-6">
          <h2 className="self-start text-[11px] font-semibold uppercase tracking-wide text-muted">QR sticker</h2>
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL, next/image can't optimize it */}
          <img src={qrDataUrl} alt={`QR code for ${board.code}`} className="size-40" />
          <p className="text-center text-xs text-muted">
            Scanning this links directly to this board&apos;s record for field agents.
          </p>
          <a
            href={qrDataUrl}
            download={`${board.code}-qr.png`}
            className="text-xs font-medium text-accent hover:underline"
          >
            Download PNG
          </a>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted">Status history</h2>
        <div className="mt-4">
          <StatusHistoryTimeline entries={history} />
        </div>
      </Card>
    </div>
  );
}
