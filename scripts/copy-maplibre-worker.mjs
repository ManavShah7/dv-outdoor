// MapLibre GL v6 loads its tile-parsing worker as a separate module file
// rather than an inlined blob, and that worker module itself has a relative
// import ("./maplibre-gl-shared.mjs") that must sit alongside it. Next.js's
// bundler doesn't pick either file up automatically, so without this the
// worker 404s (or, worse, loads but fails on its own nested import) and
// MapLibre's tile pipeline hangs forever with no error surfaced anywhere —
// see BoardMap.tsx's setWorkerUrl() call, which points at this copy.
// Re-run automatically via the postinstall hook so it stays in sync when
// maplibre-gl is upgraded.
import { copyFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, "..", "node_modules", "maplibre-gl", "dist");
const destDir = join(here, "..", "public");

for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(join(srcDir, file), join(destDir, file));
  console.log(`Copied maplibre-gl worker dependency to public/${file}`);
}
