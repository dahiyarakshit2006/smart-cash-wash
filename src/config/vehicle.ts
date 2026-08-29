/**
 * VEHICLE — how the hero car is rendered.
 *
 * The procedural car is honest but has a ceiling: it is built from extruded
 * profiles, so it will read as a clean stylised saloon and never as a
 * photographed one. When you want photoreal, drop in a GLB and set modelUrl.
 *
 * WHERE TO GET A MODEL
 * Any of these will work. Check the licence covers commercial use, and avoid
 * anything carrying a real manufacturer's badge or model name — a licensed
 * geometry file does not give you the right to use the trademark on a
 * commercial site for an unrelated company.
 *
 *   · Sketchfab           — filter to CC-BY or CC0, "downloadable", "car"
 *   · Quaternius          — CC0 vehicle packs, low-poly but very clean
 *   · Poly Haven          — CC0, small vehicle selection
 *   · TurboSquid / CGTrader — paid, royalty-free, genuinely photoreal
 *   · A commissioned model — the right answer if this becomes the brand asset
 *
 * PREPARING IT
 *   1. Export or convert to .glb (single file, embedded textures).
 *   2. Compress it:  npx gltf-transform optimize in.glb out.glb --texture-size 2048
 *      Target under ~4 MB. A 40 MB model will destroy the page on Indian mobile.
 *   3. Drop it in  public/models/  and set modelUrl below.
 *   4. Orient it so the car points down −X and sits on y = 0. Use the
 *      transform values here to correct it rather than re-exporting.
 */

export const vehicle = {
  /** Set to e.g. '/models/sedan.glb' to use a real model. null = procedural. */
  modelUrl: null as string | null,

  /** Corrections applied to the loaded model, so you never re-export to fix orientation. */
  transform: {
    scale: 1,
    rotationY: 0,
    position: [0, 0, 0] as [number, number, number],
  },

  /**
   * Names of the mesh materials in your GLB that represent body paint. These
   * get driven by the dirt/wetness/plan-colour animation. Leave empty and the
   * loader will treat the largest material as paint.
   */
  paintMaterialNames: [] as string[],
};
