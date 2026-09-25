"use client";

import { ImageOff } from "lucide-react";
import { useState } from "react";
import { boardPhotoUrl } from "@/lib/assets";

/**
 * The picture for a board, in whatever card is showing it.
 *
 * Order matters: a photo the crew just sent beats the site photo from the
 * deck, because when something is broken that is the thing you want to look
 * at. Deck photos only exist for cities we have imported, so rather than keep
 * a manifest in sync we ask for the file and fall back when it is not there.
 */
export function BoardPhoto({ code, override }: { code: string; override?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  const src = override && override !== failed ? override : boardPhotoUrl(code);

  if (src === failed) return <ImageOff className="size-6 text-ink-600" strokeWidth={1.5} />;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote asset from Supabase Storage, the Next loader adds nothing
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(src)}
      className="absolute inset-0 size-full object-cover"
    />
  );
}
