# DHRUVA — car-care operating system for residential societies

Scroll-driven marketing site. One WebGL canvas is fixed behind the page; the
scroll position inside `#journey` drives a 9-keyframe timeline that moves the
camera, the lighting and the state of the vehicle.

## Run it

Requires Node 18.17+ (Node 20 or 22 recommended).

```bash
npm install
npm run dev          # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

Useful during development: append `?lowq=1` to the URL to force the
low-quality render path (no shadows, no reflective floor, lower pixel ratio).
That's how the site already renders on phones and low-core machines.

## Where to change things

| You want to change            | Edit                                  |
|-------------------------------|---------------------------------------|
| Brand name, contact, nav      | `src/config/brand.ts`                 |
| Plan names and prices         | `src/config/pricing.ts`               |
| Water assumptions, disclaimer | `src/config/water.ts`                 |
| Dashboard + RWA copy          | `src/config/society.ts`               |
| Camera, lighting, car motion  | `src/lib/journey.ts` (the 9 keyframes)|
| The vehicle itself            | `src/components/vehicle/Sedan.tsx`    |

The brand name is one string. Changing `brand.name` updates the nav, hero,
footer and page metadata.

## The vehicle

Two modes, switched in `src/config/vehicle.ts`.

**Procedural (default).** Built from extruded side profiles — a lower body
with the wheel arches cut as open arcs, and a narrower greenhouse extrusion
that produces the tumblehome. Honest, tiny, and never a licensing problem,
but it has a ceiling: it reads as a clean stylised saloon, not a photographed
one.

**A real GLB.** Set `vehicle.modelUrl` to `/models/your-car.glb` and the site
loads it instead. The dirt, wetness, plan-colour and idle animation all bind
to the loaded model automatically, so nothing else changes. Read the comments
in `src/config/vehicle.ts` for sourcing, licensing and compression — the short
version is: keep it under ~4 MB, and don't use a model carrying a real
manufacturer's badge on a commercial site for an unrelated company.

## Enquiry form

`POST /api/enquiries` currently logs to the server console. Replace the body of
`src/app/api/enquiries/route.ts` with your CRM, Google Sheet (Apps Script) or
WhatsApp Business webhook. Keep it server-side so no credential reaches the
browser.

## Fonts

Loaded from Google Fonts via `<link>` in `src/app/layout.tsx` (Archivo,
Inter, JetBrains Mono). If you want them self-hosted and preloaded, swap to
`next/font/google` — it needs network access at build time, which is why the
link tag is used here.

## Accessibility and performance notes

- `prefers-reduced-motion` disables smooth scrolling and freezes the car;
  the lighting arc still plays.
- A WebGL capability probe plus an error boundary means the page still works
  with no GPU — you lose the atmosphere, not the argument.
- Quality auto-drops on viewports under 900px or machines with ≤4 cores.
