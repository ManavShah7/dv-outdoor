#!/usr/bin/env python3
"""
Replace the generated inventory with the real one.

    python3 scripts/import-real-boards.py "<xlsx>" --dry
    python3 scripts/import-real-boards.py "<xlsx>" --write

The spreadsheet is the family's own survey: city, location, size and a
latitude/longitude per site. Every board on the map was generated until now,
which is why two thirds of them scored near zero on visibility — they sat in
open fields, kilometres from any classified road.

Nothing in this file is committed with data in it. The repo is public and the
coordinates are the business; the workbook stays on Manav's machine and the
path is an argument.

Stdlib only, deliberately: neither pandas nor openpyxl is installed here, and
an .xlsx is a zip of XML.

WHAT IT DESTROYS, and why that is the right answer

  Every rental, rental_event, maintenance request, status-history row and
  visibility score is deleted. All of it hung off generated boards that are
  about to stop existing, and rentals.board_id is `on delete restrict`, so
  the delete would be refused otherwise.

  The real boards all land as `available`, with no bookings. Once the
  inventory is real, a generated booking status becomes a false statement
  about a real site to a real client reading the public map. The office marks
  what is actually let; that is what the admin is for.

RATES

  The survey carries no prices. His father's own Junagadh deck does, and it
  is a perfectly consistent card: Rs 90 per sq ft per month unlit, Rs 175
  backlit, exactly, across all 26 sites. That card is applied here. It is his
  real pricing for Junagadh and an extrapolation of his own structure
  everywhere else, so the rates for the other towns want replacing with
  whatever his father actually quotes.
"""
import json, os, re, sys, unicodedata, urllib.request, zipfile
from collections import defaultdict
from xml.etree import ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# ---------------------------------------------------------------- xlsx ------
NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
RID = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"


def _colnum(ref):
    n = 0
    for ch in re.match(r"([A-Z]+)", ref).group(1):
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def read_xlsx(path):
    z = zipfile.ZipFile(path)
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")):
            shared.append("".join(t.text or "" for t in si.iter(NS + "t")))
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    rels = {r.get("Id"): r.get("Target")
            for r in ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))}
    out = {}
    for sh in wb.find(NS + "sheets"):
        part = "xl/" + rels[sh.get(RID + "id")].lstrip("/").replace("xl/", "", 1)
        rows = []
        for row in ET.fromstring(z.read(part)).iter(NS + "row"):
            cells = {}
            for c in row.iter(NS + "c"):
                v, t = c.find(NS + "v"), c.get("t")
                if t == "inlineStr":
                    isn = c.find(NS + "is")
                    val = "".join(x.text or "" for x in isn.iter(NS + "t")) if isn is not None else ""
                elif v is None:
                    continue
                elif t == "s":
                    val = shared[int(v.text)]
                else:
                    val = v.text
                cells[_colnum(c.get("r"))] = val
            rows.append([cells.get(i, "") for i in range(max(cells) + 1 if cells else 0)])
        out[sh.get("name")] = rows
    return out


# ------------------------------------------------------------ normalising ---
LIGHT = {"BL": "backlit", "FL": "frontlit", "NL": "none"}

# Saurashtra, generously. Anything outside is a typo, not a board.
BBOX = (20.4, 23.4, 68.6, 72.6)


def parse_size(raw):
    """"20X10 BL" -> (20, 10, 'backlit'). The suffix is the only lighting
    information the survey carries, so it is read rather than ignored."""
    s = str(raw).upper().replace(" ", "")
    m = re.match(r"^(\d+(?:\.\d+)?)X(\d+(?:\.\d+)?)(BL|FL|NL)?$", s)
    if not m:
        return None
    w, h, suffix = float(m.group(1)), float(m.group(2)), m.group(3)
    return w, h, LIGHT.get(suffix or "", "none")


def size_category(sqft):
    """Matched to the bands the generated set used: 96 small, 240-288 medium,
    800+ large. The real survey is finer-grained, so the cuts sit between."""
    return "small" if sqft < 220 else "medium" if sqft < 500 else "large"


def clean_city(c):
    c = unicodedata.normalize("NFKC", str(c)).strip()
    c = re.sub(r"\s+", " ", c)
    c = re.sub(r"\s*\(\s*", " (", c)          # "BHANVAD(TRAN PATIYA)" -> " ("
    return " ".join(w.capitalize() if w[:1].isalpha() else w for w in c.split()).strip()


def fix_coord(lat, lng, city, loc, problems):
    """One row in the survey has longitude 70596165 — a lost decimal point.
    Repair the obvious case and refuse anything else rather than placing a
    board in the sea."""
    def repair(v):
        v = float(v)
        while abs(v) > 180:
            v /= 10.0
        return v
    lat, lng = repair(lat), repair(lng)
    lo, hi, wlo, whi = BBOX
    if not (lo <= lat <= hi and wlo <= lng <= whi):
        problems.append(f"out of Saurashtra after repair: {city} / {loc} -> {lat}, {lng}")
        return None
    return round(lat, 7), round(lng, 7)


def code_prefixes(cities):
    """Three letters, extended only where two towns would collide. Sorted so
    the mapping is stable across runs — a board's code must not move because
    a new town was surveyed."""
    taken, out = {}, {}
    for city in sorted(cities):
        base = re.sub(r"[^A-Z]", "", city.upper()) or "XXX"
        for n in (3, 4, 5, 6):
            p = base[:n].ljust(3, "X")
            if taken.get(p) in (None, city):
                taken[p] = city
                out[city] = p
                break
        else:
            raise SystemExit(f"could not find a free prefix for {city}")
    return out


# --------------------------------------------------------------- the deck ---
def deck_matches(rows, deck):
    """Carry the deck's photographs, rates and lighting onto the surveyed
    sites, but only where it is certain.

    A fuzzy name match alone produced false positives — "TALAV DARWAJA ROAD,
    NR. RAILWAY CROSSING" matched "Chobari Railway Crossing" on the words
    they share. Showing a client a photograph of a different board is worse
    than showing none, so a match needs the normalised location AND the exact
    dimensions to agree, and the surveyed candidate to be the only one that
    does.
    """
    def words(s):
        s = re.sub(r"\bNO\.?\s*\d+(/\d+)?\b", " ", str(s).upper())
        s = re.sub(r"\b(NR|OPP|FTF|RHS|LHS|THE|AND)\b\.?", " ", s)
        s = re.sub(r"\bRD\b", "ROAD", s)
        s = re.sub(r"\bSTOP\b", "STAND", s)     # "bus stop" / "bus stand"
        s = re.sub(r"MAJEVADI", "MAJEWADI", s)   # one letter apart in the two files
        s = re.sub(r"SAKKARBAUG", "SAKKAR BAUG", s)
        s = re.sub(r"[^A-Z0-9]+", " ", s)
        return set(w for w in s.split() if len(w) > 1)

    pool = [i for i, r in enumerate(rows) if r["city"].lower() == "junagadh"]
    got, ambiguous, used = {}, [], set()

    # Strongest candidates first, so a confident pairing claims its row before
    # a weaker one can take it.
    scored = []
    for b in deck:
        try:
            w, h = float(b["widthFt"]), float(b["heightFt"])
        except (TypeError, ValueError):
            continue
        dw = words(b["location"])
        best = []
        for i in pool:
            r = rows[i]
            if (r["w"], r["h"]) != (w, h):
                continue              # the dimensions must agree exactly
            # Where both files state the lighting, they have to agree. Without
            # this the two Axis Bank boards came out swapped: the deck calls
            # No. 1 backlit, the survey marks No. 2 "BL".
            deck_lit = b["lighting"] if b["lighting"] not in (None, "None") else "none"
            stated = re.search(r"(BL|FL|NL)$", str(r["size"]).upper().replace(" ", ""))
            if stated and r["lighting"] != deck_lit:
                continue
            sw = words(r["loc"])
            overlap = len(dw & sw) / max(1, len(dw))
            if overlap >= 0.7:
                # A row that states the same lighting is the better match, not
                # merely an allowed one: of the two "Jay Shree Cinema Road"
                # rows at 20x10, the one marked BL belongs to the deck board
                # the deck calls backlit.
                bonus = 1 if (stated and r["lighting"] == deck_lit) else 0
                # Then the closest name, not row order: "Town Hall Circle
                # No. 3" and "Kalwa Chowk FTF; Town Hall circle" both contain
                # every word the deck uses, and the first is the match.
                best.append((overlap, bonus, -len(sw - dw), i))
        best.sort(reverse=True)
        scored.append((max([x[0] for x in best], default=0), b, best))
    scored.sort(key=lambda t: -t[0])

    for score, b, best in scored:
        pick = next((i for *_, i in best if i not in used), None)
        if pick is None:
            ambiguous.append((b["code"], str(b["location"])[:38], len(best)))
            continue
        used.add(pick)
        got[pick] = b
        print(f"   photo {b['code']} -> {rows[pick]['loc'][:42]:44} "
              f"{int(b['widthFt'])}x{int(b['heightFt'])} {rows[pick]['lighting'][:4]:5} "
              f"match {score:.0%}")
    return got, ambiguous


# ------------------------------------------------------------------ build ---
def build(xlsx, deck):
    sheets = read_xlsx(xlsx)
    problems, rows = [], []
    for name, rr in sheets.items():
        for r in rr[1:]:
            if len(r) < 6 or not str(r[1]).strip():
                continue
            city, loc, size = clean_city(r[1]), str(r[2]).strip(), str(r[3]).strip()
            spec = parse_size(size)
            if not spec:
                problems.append(f"unreadable size: {city} / {loc} / {size!r}")
                continue
            try:
                coord = fix_coord(r[4], r[5], city, loc, problems)
            except (TypeError, ValueError):
                problems.append(f"unreadable coordinates: {city} / {loc}")
                continue
            if not coord:
                continue
            w, h, lighting = spec
            rows.append({"sheet": name, "city": city, "loc": loc, "size": size,
                         "w": w, "h": h, "lighting": lighting,
                         "lat": coord[0], "lng": coord[1]})

    matched, ambiguous = deck_matches(rows, deck)

    pre = code_prefixes({r["city"] for r in rows})
    seq = defaultdict(int)
    out = []
    # Codes are assigned over the survey's own order, so the indices held in
    # `matched` still line up. The survey is already grouped by town.
    for i, r in enumerate(rows):
        p = pre[r["city"]]
        seq[p] += 1
        d = matched.get(i)
        sqft = r["w"] * r["h"]
        lighting = r["lighting"]
        rate = None
        if d:
            # the deck knows these two things better than the survey does
            if d["lighting"] not in (None, "None"):
                lighting = d["lighting"]
            try:
                rate = float(d["askingRate"])
            except (TypeError, ValueError):
                rate = None
        if rate is None:
            rate = sqft * (175 if lighting == "backlit" else 90)
        out.append({
            "code": f"{p}-{seq[p]:03d}",
            "name": r["loc"],
            "lat": r["lat"], "lng": r["lng"],
            "area": r["loc"], "city": r["city"], "region": "Saurashtra",
            "board_type": "hoarding",
            "lighting_type": lighting,
            "size_category": size_category(sqft),
            "width_ft": r["w"], "height_ft": r["h"],
            "size_label": r["size"],
            "asking_rate": round(rate),
            "asking_rate_period": "per_month",
            "status": "available",
            "is_published": True,
            "notes": None,
            "_photo_from": d["code"] if d else None,
        })
    return out, problems, matched, ambiguous


# ------------------------------------------------------------------- http ---
def env():
    e = {}
    for line in open(os.path.join(ROOT, ".env.local")):
        if "=" in line and not line.strip().startswith("#"):
            k, _, v = line.partition("=")
            e[k.strip()] = v.strip()
    return e


def rest(method, path, body=None, extra=None):
    e = env()
    url = e["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/") + "/rest/v1/" + path
    key = e["SUPABASE_SERVICE_ROLE_KEY"]
    hdr = {"apikey": key, "Authorization": "Bearer " + key,
           "Content-Type": "application/json", "Prefer": "return=minimal"}
    hdr.update(extra or {})
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=hdr, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read().decode()
            return r.status, (json.loads(raw) if raw.strip() else None)
    except urllib.error.HTTPError as ex:
        raise SystemExit(f"{method} {path} -> {ex.code} {ex.read().decode()[:400]}")


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    xlsx = sys.argv[1]
    write = "--write" in sys.argv

    deck_url = (env()["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
                + "/storage/v1/object/public/dv-assets/deck/parsed.json")
    with urllib.request.urlopen(deck_url) as r:
        deck = json.load(r)["boards"]

    boards, problems, matched, ambiguous = build(xlsx, deck)

    print(f"surveyed sites read .......... {len(boards)}")
    print(f"towns ........................ {len({b['city'] for b in boards})}")
    print(f"rows rejected ................ {len(problems)}")
    for p in problems:
        print("   !", p)
    print(f"deck photographs attached .... {len(matched)} of {len(deck)}")
    if ambiguous:
        print("   not attached (no unique location+size match):")
        for code, loc, n in ambiguous:
            print(f"     {code}  {loc:40} candidates={n}")
    lit = defaultdict(int)
    for b in boards:
        lit[b["lighting_type"]] += 1
    print("lighting ..................... " + ", ".join(f"{k} {v}" for k, v in sorted(lit.items())))
    cat = defaultdict(int)
    for b in boards:
        cat[b["size_category"]] += 1
    print("size ......................... " + ", ".join(f"{k} {v}" for k, v in sorted(cat.items())))
    rates = sorted(b["asking_rate"] for b in boards)
    print(f"rate ......................... Rs {rates[0]:,} .. {rates[-1]:,} "
          f"(median {rates[len(rates)//2]:,})")
    print("codes ........................ " + ", ".join(
        b["code"] for b in boards[:4]) + " ... " + boards[-1]["code"])

    if not write:
        print("\n--dry: nothing written. Re-run with --write to replace the inventory.")
        return

    # ---- delete, in an order the foreign keys allow -----------------------
    print("\nclearing what hung off the generated boards:")
    for table in ("board_visibility", "rental_events", "rentals",
                  "maintenance_requests", "board_status_history",
                  "board_price_history", "board_photos"):
        try:
            code, _ = rest("DELETE", f"{table}?id=not.is.null")
        except SystemExit:
            code, _ = rest("DELETE", f"{table}?board_id=not.is.null")
        print(f"   {table:24} {code}")
    code, _ = rest("DELETE", "boards?id=not.is.null")
    print(f"   {'boards':24} {code}")

    payload = [{k: v for k, v in b.items() if not k.startswith("_")} for b in boards]
    for i in range(0, len(payload), 200):
        code, _ = rest("POST", "boards", payload[i:i + 200])
        sys.stdout.write(f"\r   inserted {min(i + 200, len(payload))}/{len(payload)}")
    print()

    photos = [(b["code"], b["_photo_from"]) for b in boards if b["_photo_from"]]
    json.dump(dict(photos), open(os.path.join(HERE, ".photo-map.json"), "w"), indent=1)
    print(f"wrote scripts/.photo-map.json — {len(photos)} photographs to re-key")


if __name__ == "__main__":
    main()
