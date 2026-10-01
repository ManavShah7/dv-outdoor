"""
Draw Saurashtra from our own data instead of using a stock photograph.

Roads are OpenStreetMap (ODbL), clipped to the peninsula. Board positions are
ours. Nothing here is a Google tile, so the band costs no map loads and the
picture matches the page: light lines on black, hairline weights by road
class, our sites as dots on top.
"""
import json, math

# Inputs: the simplified road extract that the map layer also uses, and the
# board coordinates. Both are pulled by scripts/fetch-map-inputs.sh into a
# working directory given as the first argument.
#
#   python3 scripts/draw-saurashtra.py <dir>
#
# Writes <dir>/saurashtra.svg. Rasterise it at 1319x948 (the band is
# 659.5x474 design px) and upload to site/saurashtra.png.
import sys
S = sys.argv[1] if len(sys.argv) > 1 else "."
roads  = json.load(open(f"{S}/roads-saurashtra.json"))["ways"]
boards = json.load(open(f"{S}/boards.json"))

# The extract runs east to Surat; Saurashtra proper stops around 72.2.
# Clipped to the peninsula. 23.15 let a disconnected strip of the Kachchh
# shore float in the top right, which read as a rendering fault rather than
# as geography; our northernmost board is at 22.84, so 22.95 loses nothing.
LAT0, LAT1 = 20.70, 22.92
LNG0, LNG1 = 68.90, 72.26

W, H = 1319, 948          # 659.5 x 474 design px at 2x
PAD  = 26

def merc(lat):
    return math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))

# Both axes have to be in the same units or the aspect is wrong: the
# mercator y above is in radians, so x is radians too, not degrees.
mx0, mx1 = math.radians(LNG0), math.radians(LNG1)
my0, my1 = merc(LAT1), merc(LAT0)          # y grows downward
sx = (W - 2 * PAD) / (mx1 - mx0)
sy = (H - 2 * PAD) / (my1 - my0)
k  = min(sx, sy)                            # keep it geographically square
ox = PAD + ((W - 2 * PAD) - (mx1 - mx0) * k) / 2
oy = PAD + ((H - 2 * PAD) - (my1 - my0) * k) / 2

def proj(lat, lng):
    return (ox + (math.radians(lng) - mx0) * k, oy + (merc(lat) - my0) * k)

def inside(lat, lng):
    return LAT0 <= lat <= LAT1 and LNG0 <= lng <= LNG1

# Monochrome, because the page is. motorway, trunk, primary, secondary —
# the network carries the shape of the peninsula on its own, so the roads
# sit back and the sites are the only bright thing.
# The band renders this at half its pixel size, so values that looked right
# at 1:1 fell away to nothing at 660px wide. Brightened to carry there.
STROKE = ["#c8c8c8", "#c8c8c8", "#9a9a9a", "#7a7a7a"]
WIDTH  = [2.4, 2.1, 1.3, 0.85]
OPACITY= [0.95, 0.9, 0.62, 0.42]

layers = [[], [], [], []]
for cls, flat in roads:
    pts, run = [], []
    for i in range(0, len(flat), 2):
        la, lo = flat[i], flat[i + 1]
        if inside(la, lo):
            run.append(proj(la, lo))
        else:
            if len(run) > 1: pts.append(run)
            run = []
    if len(run) > 1: pts.append(run)
    for run in pts:
        d = "M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in run)
        layers[cls].append(d)

out = [
    f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
    f'<rect width="{W}" height="{H}" fill="#000000"/>',
]
# secondary first so the big roads sit on top of the capillaries
for cls in (3, 2, 1, 0):
    if not layers[cls]: continue
    out.append(
        f'<g fill="none" stroke="{STROKE[cls]}" stroke-width="{WIDTH[cls]}" '
        f'stroke-opacity="{OPACITY[cls]}" stroke-linecap="round" stroke-linejoin="round">'
    )
    out += [f'<path d="{d}"/>' for d in layers[cls]]
    out.append("</g>")

# Our sites. A wide, very faint halo first so a city reads as one mass of
# light rather than as splatter, then a small hard dot per board on top.
out.append('<g>')
for b in boards:
    if not inside(b["lat"], b["lng"]): continue
    x, y = proj(b["lat"], b["lng"])
    out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="16" fill="#ffffff" fill-opacity="0.045"/>')
for b in boards:
    if not inside(b["lat"], b["lng"]): continue
    x, y = proj(b["lat"], b["lng"])
    out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="1.9" fill="#ffffff" fill-opacity="0.92"/>')
out.append("</g>")
out.append("</svg>")

open(f"{S}/saurashtra.svg", "w").write("\n".join(out))
n = sum(1 for b in boards if inside(b["lat"], b["lng"]))
print(f"ways drawn {sum(len(l) for l in layers)}  boards drawn {n}/{len(boards)}  svg {len(''.join(out))/1024:.0f} kB")
