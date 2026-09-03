import type { Metadata, Viewport } from "next";
import WashLayoutClient from "./WashLayoutClient";

// All /wash pages are worker-session/live-data screens, never static content —
// force-dynamic keeps Next from prerendering them at build time (which fails
// if Supabase env vars aren't present in the build environment).
export const dynamic = "force-dynamic";

// Scoped to /wash only (manifest "scope" is "/wash") — installing this PWA
// does not affect or represent the rest of the marketing site.
export const metadata: Metadata = {
  title: "Dhruva Wash",
  manifest: "/wash-manifest.json",
  icons: {
    icon: [
      { url: "/wash-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/wash-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/wash-icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Wash",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function WashLayout({ children }: { children: React.ReactNode }) {
  return <WashLayoutClient>{children}</WashLayoutClient>;
}
