"use client";

import { useState } from "react";
import { APIProvider, Map as GoogleMap, Marker } from "@vis.gl/react-google-maps";
import { X, MapPin } from "lucide-react";
import type { Board, Lighting, SizeCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Primitives";
import { Label, Select, TextInput } from "@/components/ui/FormControls";

const SAURASHTRA = { lat: 21.98, lng: 70.55 };

function sizeFor(w: number, h: number): SizeCategory {
  const sqft = w * h;
  return sqft < 160 ? "small" : sqft < 600 ? "medium" : "large";
}

export function BoardCreate({
  existingCodes,
  onCancel,
  onCreate,
}: {
  existingCodes: Set<string>;
  onCancel: () => void;
  onCreate: (b: Board) => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [pincode, setPincode] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [widthFt, setWidthFt] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [lighting, setLighting] = useState<"" | Lighting>("");
  const [rate, setRate] = useState("");

  const latN = Number(lat);
  const lngN = Number(lng);
  const coordsValid =
    lat !== "" && lng !== "" &&
    Number.isFinite(latN) && Number.isFinite(lngN) &&
    latN >= -90 && latN <= 90 && lngN >= -180 && lngN <= 180;

  const codeTaken = code.trim() !== "" && existingCodes.has(code.trim().toUpperCase());

  const valid =
    name.trim() && code.trim() && !codeTaken && city.trim() &&
    coordsValid && Number(widthFt) > 0 && Number(heightFt) > 0 &&
    lighting !== "" && Number(rate) > 0;

  function submit() {
    if (!valid) return;
    const w = Number(widthFt);
    const h = Number(heightFt);
    onCreate({
      id: `new-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      lat: latN,
      lng: lngN,
      address: `${area.trim() ? area.trim() + ", " : ""}${city.trim()} ${pincode.trim()}`.trim(),
      area: area.trim() || city.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      status: "available",
      lighting: lighting as Lighting,
      sizeCategory: sizeFor(w, h),
      widthFt: w,
      heightFt: h,
      askingRate: Number(rate),
      availableSince: new Date().toISOString().slice(0, 10),
    });
  }

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-black/55 p-8">
      <div className="flex max-h-full w-full max-w-[1000px] overflow-hidden rounded-[var(--radius-panel)] material-thick shadow-[var(--shadow-pop)] ring-1 ring-white/[0.08]">
        {/* map picker */}
        <div className="relative hidden min-h-[560px] flex-1 lg:block">
          {key ? (
            <APIProvider apiKey={key}>
              <GoogleMap
                defaultCenter={SAURASHTRA}
                defaultZoom={8}
                gestureHandling="greedy"
                disableDefaultUI
                zoomControl
                clickableIcons={false}
                onClick={(e) => {
                  const ll = e.detail.latLng;
                  if (!ll) return;
                  setLat(ll.lat.toFixed(6));
                  setLng(ll.lng.toFixed(6));
                }}
                style={{ width: "100%", height: "100%" }}
              >
                {coordsValid && <Marker position={{ lat: latN, lng: lngN }} />}
              </GoogleMap>
            </APIProvider>
          ) : (
            <div className="grid size-full place-items-center bg-ink-900 text-footnote text-ink-500">
              Map key not set
            </div>
          )}

          <div className="pointer-events-none absolute left-5 top-5 rounded-[var(--radius-pill)] material-regular px-4 py-2">
            <span className="inline-flex items-center gap-2 text-footnote text-ink-100">
              <MapPin className="size-3.5" strokeWidth={2.2} />
              {coordsValid ? `${latN.toFixed(6)}, ${lngN.toFixed(6)}` : "Click the map to drop a pin"}
            </span>
          </div>
        </div>

        {/* form */}
        <div className="flex w-full flex-col overflow-y-auto lg:w-[420px] lg:border-l lg:border-white/[0.08]">
          <div className="flex items-start justify-between px-7 pb-5 pt-7">
            <div>
              <h2 className="text-title2 font-[680] text-ink-0">New board</h2>
              <p className="mt-1 text-footnote text-ink-400">
                Drop a pin, or type coordinates directly.
              </p>
            </div>
            <button
              onClick={onCancel}
              aria-label="Cancel"
              className="grid size-8 shrink-0 place-items-center rounded-full bg-black/30 text-ink-400 hover:text-ink-0"
            >
              <X className="size-4" strokeWidth={2.2} />
            </button>
          </div>

          <div className="flex flex-col gap-4 px-7 pb-7">
            <div>
              <Label>Board name</Label>
              <TextInput value={name} onChange={setName} placeholder="Kalawad Road Unipole" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <Label>Code</Label>
                <TextInput value={code} onChange={setCode} placeholder="RJK-176" />
                {codeTaken && (
                  <p className="mt-1.5 text-caption" style={{ color: "var(--color-damaged)" }}>
                    Code already in use
                  </p>
                )}
              </div>
              <div className="min-w-0">
                <Label>Pincode</Label>
                <TextInput value={pincode} onChange={setPincode} placeholder="360001" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <Label>City</Label>
                <TextInput value={city} onChange={setCity} placeholder="Rajkot" />
              </div>
              <div className="min-w-0">
                <Label>Area / road</Label>
                <TextInput value={area} onChange={setArea} placeholder="Kalawad Road" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <Label>Latitude</Label>
                <TextInput value={lat} onChange={setLat} placeholder="22.3039" />
              </div>
              <div className="min-w-0">
                <Label>Longitude</Label>
                <TextInput value={lng} onChange={setLng} placeholder="70.8022" />
              </div>
            </div>
            {lat !== "" && lng !== "" && !coordsValid && (
              <p className="-mt-2 text-caption" style={{ color: "var(--color-damaged)" }}>
                Those coordinates are not valid.
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <Label>Width (ft)</Label>
                <TextInput type="number" value={widthFt} onChange={setWidthFt} placeholder="40" />
              </div>
              <div className="min-w-0">
                <Label>Height (ft)</Label>
                <TextInput type="number" value={heightFt} onChange={setHeightFt} placeholder="20" />
              </div>
            </div>
            {Number(widthFt) > 0 && Number(heightFt) > 0 && (
              <p className="-mt-2 text-caption text-ink-500">
                {Number(widthFt) * Number(heightFt)} sq ft — classed{" "}
                <span className="capitalize text-ink-300">{sizeFor(Number(widthFt), Number(heightFt))}</span>
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <Label>Lighting</Label>
                <Select
                  value={lighting}
                  onChange={(v) => setLighting(v as Lighting)}
                  options={[
                    { value: "backlit", label: "Back-lit" },
                    { value: "frontlit", label: "Front-lit" },
                    { value: "none", label: "Non-lit" },
                  ]}
                />
              </div>
              <div className="min-w-0">
                <Label>Asking rate / month</Label>
                <TextInput type="number" prefix="₹" value={rate} onChange={setRate} />
              </div>
            </div>
          </div>

          <div className={cn("sticky bottom-0 mt-auto border-t border-white/[0.07] material-thick px-7 py-5")}>
            <Button variant="primary" disabled={!valid} onClick={submit}>
              Create board
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
