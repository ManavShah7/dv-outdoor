# Recording the case-study media

These produce the screenshots and screen recordings for
`manavshah.me/work/times-media`. They drive the real app, so `npm run dev`
has to be up on `:3000` first.

```
node scripts/media/auth.mjs     # once — saves an admin and a field session
node scripts/media/v1.mjs       # admin: map -> boards -> board detail + Street View
node scripts/media/v2.mjs       # phone: the screen the board's QR opens
node scripts/media/v3.mjs       # desktop: the maintenance queue and one report
node scripts/media/v4.mjs       # analytics
node scripts/media/v5.mjs       # the public site
node scripts/media/shots.mjs    # the desktop stills
node scripts/media/shots2.mjs   # the phone still and the full-page landing shot
```

Each `vN` leaves a `.webm` in the scratch dir; encode to the slot size with

```
ffmpeg -i vN.webm -vf scale=2476:1568:flags=lanczos \
  -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -movflags +faststart NN.mp4
```

`rec.mjs` holds the shared pieces: the caption overlay, the browser context,
and the login. Desktop is recorded at 1238×784 because that is the width of a
full-measure card on the case-study page; the 2× encode is what gets shipped.

Captions: `say(page, text, holdMs, light)`. Pass `light = true` on the client
site — dark text on a small white plate, instead of white text over a scrim,
because a scrim over a light page just greys the photography out.
