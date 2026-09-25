# Deploying to timesmedia.online

The repo is public and builds clean from a fresh clone. Everything below is
dashboard work — there is no Vercel CLI session on this machine.

## 1. Import the project

Vercel → **Add New… → Project** → import `ManavShah7/dv-outdoor`.

Framework preset is detected as Next.js. Leave the build and output settings
alone.

## 2. Environment variables — do this *before* the first build

The `NEXT_PUBLIC_*` values are inlined at build time, so a build that runs
without them ships a broken bundle and you have to redeploy.

Open `~/dv-outdoor/.env.local`, copy the whole file, and paste it into Vercel's
bulk "paste .env" box on the Environment Variables screen. Then change one line:

```
NEXT_PUBLIC_SITE_URL=https://timesmedia.online
```

`.env.example` lists every key and what it is for. `SUPABASE_SERVICE_ROLE_KEY`
and `ANTHROPIC_API_KEY` are server-only — they must not get a `NEXT_PUBLIC_`
prefix.

## 3. Domain

Vercel → project → **Settings → Domains** → add `timesmedia.online`, then
`www.timesmedia.online` (set it to redirect to the apex).

Vercel prints the exact records to create. At Namecheap → Domain List →
timesmedia.online → **Advanced DNS**, delete the parking records and add what
Vercel printed. As of now that is normally:

| Type  | Host | Value                   |
|-------|------|-------------------------|
| A     | `@`  | `76.76.21.21`           |
| CNAME | `www`| `cname.vercel-dns.com.` |

Use Vercel's values over these if they differ. The domain is on Namecheap's
default nameservers (`dns1/dns2.registrar-servers.com`), so Advanced DNS is the
right place — do not switch nameservers.

Propagation is usually minutes. Check with `dig +short timesmedia.online`.

## 4. Google Maps key

The map is the product; if this is wrong the whole admin side is a grey box.

Google Cloud console → APIs & Services → Credentials → the browser key →
**Application restrictions → HTTP referrers**, and add:

```
https://timesmedia.online/*
https://*.timesmedia.online/*
http://localhost:3000/*
```

Without a restriction the key is public in the JS bundle and anyone can bill
against it. With the wrong restriction the map silently fails to load.

## 5. Supabase

- **Authentication → URL Configuration** → set Site URL to
  `https://timesmedia.online` and add it to redirect URLs. Sign-in is
  email+password and invites are a custom token flow, so nothing depends on
  this today — but password reset will.
- The `dv-assets` storage bucket must stay **public-read**. The board photos,
  the deck and the audio are served from it; see `src/lib/assets.ts`.

## 6. Before you tell anyone the address

- **Change the admin password.** `admin@gmail.com` / `admin123` is currently a
  working superuser on a public URL. Supabase → Authentication → Users →
  admin@gmail.com → Reset password. Do the same for `bharat@dvoutdoor.in` /
  `field1234`, which exists only so the field screenshots read "Reporting as
  Bharat Solanki".
- **Rotate the Anthropic key.** It was pasted into a chat during development.
  `/api/chat` is admin-gated so it is not open to the internet, but the key
  itself should not be trusted any more.
- **The QR codes encode `NEXT_PUBLIC_SITE_URL`.** Do not print any until the
  domain resolves, or every sticker points at localhost.

## Known to be untrue on the live site

Flagged and kept deliberately — listed here so nobody is surprised later.

- The **"Trusted by"** row on the landing page prints generated company names
  (Amul, Audi Junagadh, Jio Fiber, Tanishq, HDFC Bank…). They are not DV's
  clients. The 650 / 12 / 31 / 144 figures are generated too.
- **Board coordinates are generated.** The real deck carries none. Street View
  snaps to the nearest Google-captured road, so it shows a real street — not
  necessarily the board's street.
- **The field report does not reach the database.** "Send to office" sets local
  state; the maintenance queue reads mock data.
- **The voice note plays a generated tone**, not a recording.
