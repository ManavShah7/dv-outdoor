#!/usr/bin/env bash
# Pull what draw-saurashtra.py needs into a working directory.
#
#   ./scripts/fetch-map-inputs.sh /tmp/sau
#   python3 scripts/draw-saurashtra.py /tmp/sau
#
# The road extract is the same file the map's Major roads layer loads, so the
# drawn map and the live layer can never disagree about the network.
set -euo pipefail
DIR="${1:?usage: fetch-map-inputs.sh <dir>}"
mkdir -p "$DIR"

URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | cut -d= -f2-)
KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.local | cut -d= -f2-)

curl -sfS -o "$DIR/roads-saurashtra.json" \
  "$URL/storage/v1/object/public/dv-assets/data/roads-saurashtra.json"
echo "roads: $(wc -c <"$DIR/roads-saurashtra.json") bytes"

# PostgREST caps a response at 1000 rows; 650 boards fits in one page, but
# page it anyway so this keeps working as the inventory grows.
node -e '
const fs = require("fs");
const [url, key, dir] = process.argv.slice(1);
(async () => {
  const out = [];
  for (let from = 0; ; from += 500) {
    const r = await fetch(`${url}/rest/v1/boards?select=code,city,lat,lng&order=code`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${from}-${from + 499}` },
    });
    const page = await r.json();
    out.push(...page);
    if (page.length < 500) break;
  }
  fs.writeFileSync(`${dir}/boards.json`, JSON.stringify(out));
  console.log(`boards: ${out.length}`);
})();
' "$URL" "$KEY" "$DIR"
