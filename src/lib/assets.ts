/**
 * Board photography and the imported deck live in Supabase Storage, not in the
 * repo. The repo is public and this is the family's business data — locations,
 * rates, the site photos themselves — so it stays out of git. The bucket is
 * public-read because the client site shows these to anyone anyway; what we are
 * avoiding is a permanent copy in a public git history.
 *
 * Bucket: `dv-assets`, keys `boards/<code>.jpg`, `audio/…`, `deck/parsed.json`.
 * Populate it with `node scripts/upload-assets.mjs`.
 */
const BUCKET = "dv-assets";

function base() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  return `${url}/storage/v1/object/public/${BUCKET}`;
}

/** Absolute URL for a key in the asset bucket. */
export function assetUrl(key: string) {
  return `${base()}/${key.replace(/^\//, "")}`;
}

/** The site photo for a board. Only cities we have imported have one; the
 *  components that use this fall back when the request 404s. */
export function boardPhotoUrl(code: string) {
  return assetUrl(`boards/${code}.jpg`);
}

export const VOICE_SAMPLE_URL = () => assetUrl("audio/voice-sample.mp3");
