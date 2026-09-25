"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PublicMap } from "@/components/site/PublicMap";
import { MapsProvider } from "@/components/map/MapsProvider";
import type { PublicBoard } from "@/lib/publicBoards";

/**
 * The filter rail and the map, the last band of the frame.
 *
 * The artwork shows Junagadh / Rajkot / Dwarka repeated across three rows,
 * which is placeholder — the real city list goes in. Size and Lighting are
 * drawn collapsed and open here, because a closed section that never opens
 * is a picture of a control rather than a control.
 */

type Size = PublicBoard["sizeCategory"];
type Light = PublicBoard["lighting"];

const SIZES: { id: Size; label: string }[] = [
  { id: "small", label: "Small" },
  { id: "medium", label: "Medium" },
  { id: "large", label: "Large" },
];
const LIGHTS: { id: Light; label: string }[] = [
  { id: "backlit", label: "Back-lit" },
  { id: "frontlit", label: "Front-lit" },
  { id: "none", label: "Non-lit" },
];

function Pill({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="tm-pill"
      aria-pressed={on}
      onClick={onClick}
    >
      <span>{children}</span>
      <span className="tm-plus" aria-hidden>
        +
      </span>
    </button>
  );
}

function Band({
  label,
  children,
}: {
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="tm-finder__band tm-rb">
      <p className="tm-finder__label">{label}</p>
      {children}
    </div>
  );
}

export function TimesFinder({
  boards,
  cities,
}: {
  boards: PublicBoard[];
  cities: string[];
}) {
  const [q, setQ] = useState("");
  const [regions, setRegions] = useState<string[]>([]);
  const [free, setFree] = useState(false);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [lights, setLights] = useState<Light[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  function toggle<T>(list: T[], set: (v: T[]) => void, v: T) {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return boards.filter((b) => {
      if (regions.length && !regions.includes(b.city)) return false;
      if (free && b.availability !== "available") return false;
      if (sizes.length && !sizes.includes(b.sizeCategory)) return false;
      if (lights.length && !lights.includes(b.lighting)) return false;
      if (!needle) return true;
      return (
        b.name.toLowerCase().includes(needle) ||
        b.area.toLowerCase().includes(needle) ||
        b.city.toLowerCase().includes(needle) ||
        b.pincode.includes(needle)
      );
    });
  }, [boards, q, regions, free, sizes, lights]);

  const open = shown.find((b) => b.code === selected) ?? null;

  return (
    <MapsProvider>
      <section className="tm-finder tm-rb">
        <div className="tm-finder__panel">
          <Band label="Filters" />

          <div className="tm-finder__band tm-rb">
            <input
              className="tm-field"
              placeholder="Search by road, area, city"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search by road, area or city"
            />
            <p
              className="tm-finder__label"
              style={{ marginTop: "calc(48 * var(--u))" }}
            >
              Regions
            </p>
            <div className="tm-finder__pills">
              {cities.map((c) => (
                <Pill
                  key={c}
                  on={regions.includes(c)}
                  onClick={() => toggle(regions, setRegions, c)}
                >
                  {c}
                </Pill>
              ))}
            </div>
          </div>

          <div className="tm-finder__band tm-rb">
            <p className="tm-finder__label">Availability</p>
            <div className="tm-finder__pills">
              <Pill on={free} onClick={() => setFree(!free)}>
                Available now
              </Pill>
            </div>
          </div>

          <div className="tm-finder__band tm-rb">
            <p className="tm-finder__label">Size</p>
            <div className="tm-finder__pills">
              {SIZES.map((s) => (
                <Pill
                  key={s.id}
                  on={sizes.includes(s.id)}
                  onClick={() => toggle(sizes, setSizes, s.id)}
                >
                  {s.label}
                </Pill>
              ))}
            </div>
          </div>

          <div className="tm-finder__band">
            <p className="tm-finder__label">Lighting</p>
            <div className="tm-finder__pills">
              {LIGHTS.map((l) => (
                <Pill
                  key={l.id}
                  on={lights.includes(l.id)}
                  onClick={() => toggle(lights, setLights, l.id)}
                >
                  {l.label}
                </Pill>
              ))}
            </div>
            <p
              className="tm-t31"
              style={{ marginTop: "calc(40 * var(--u))", lineHeight: 1.25 }}
            >
              {shown.length} of {boards.length} boards
              {open ? (
                <>
                  {" "}
                  · <span className="tm-red">{open.name}</span>
                </>
              ) : null}
              {" · "}
              <Link href="/boards" style={{ textDecoration: "underline" }}>
                open the full browser
              </Link>
            </p>
          </div>
        </div>

        <div className="tm-finder__map">
          <PublicMap
            boards={shown}
            selected={selected}
            onSelect={setSelected}
          />
        </div>
      </section>
    </MapsProvider>
  );
}
