# Deploying to timesmedia.online

**Status: everything is done except one DNS record, which needs your Namecheap
login.**

Done already:

- Vercel project `timesmedia` created under `manavshah7s-projects`, built and
  deployed to production from `main`.
- All six environment variables set on production, preview and development,
  with `NEXT_PUBLIC_SITE_URL=https://timesmedia.online`.
- `timesmedia.online` and `www.timesmedia.online` attached to the project.
- SSO protection checked: it is `all_except_custom_domains`, so the live domain
  is public and only the `*.vercel.app` URL sits behind Vercel auth.
- Google Maps key locked to the domain (it was completely unrestricted, i.e.
  anyone could have billed against it).

## The one thing left — point DNS

Namecheap → Domain List → timesmedia.online → **Advanced DNS**. Delete the
parking records and add:

| Type  | Host | Value          | TTL       |
|-------|------|----------------|-----------|
| A     | `@`  | `76.76.21.21`  | Automatic |
| CNAME | `www`| `cname.vercel-dns.com.` | Automatic |

Vercel confirmed those values itself. Leave the nameservers alone — the domain
is on Namecheap's own (`dns1/dns2.registrar-servers.com`), which is fine.

Propagation is usually a few minutes. Check with:

```
dig +short timesmedia.online     # want 76.76.21.21
curl -sI https://timesmedia.online | head -1
```

Vercel issues the certificate automatically once the record resolves.

## Before you tell anyone the address

- **Change the admin password.** `admin@gmail.com` / `admin123` is currently a
  working superuser on a public URL. Supabase → Authentication → Users →
  admin@gmail.com → Reset password. Do the same for `bharat@dvoutdoor.in` /
  `field1234`, which exists only so the field screenshots read "Reporting as
  Bharat Solanki".
- **Rotate the Anthropic key.** It was pasted into a chat during development.
  `/api/chat` is admin-gated so it is not open to the internet, but the key
  itself should not be trusted any more. Rotate it in the Anthropic console,
  then `vercel env rm ANTHROPIC_API_KEY production` and add the new one.
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

## Reference

- Redeploy: pushing to `main` deploys automatically. Manually:
  `npx vercel --prod` from the repo.
- Change an env var: `npx vercel env rm NAME production`, then
  `npx vercel env add NAME production`. `NEXT_PUBLIC_*` values are inlined at
  build time, so redeploy after changing one.
- Board photos, the imported deck and the audio live in the `dv-assets`
  Supabase Storage bucket, not in the repo — it is public and that is the
  family's business data. Re-upload after importing a new city:
  `node scripts/upload-assets.mjs`. See `src/lib/assets.ts`.
- `.env.example` lists every key and what it is for.
