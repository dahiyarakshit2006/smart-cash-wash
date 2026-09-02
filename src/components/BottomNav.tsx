"use client";

import { useRouter, usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";

const items = [
  { href: "/wash/today", icon: "🗺️", key: "nav_today" as const },
  { href: "/wash/shift", icon: "⏱️", key: "nav_shift" as const },
  { href: "/wash/training", icon: "🎓", key: "nav_training" as const },
  { href: "/wash/profile", icon: "👤", key: "nav_profile" as const },
];

export function BottomNav() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        borderTop: "1px solid #2a2a2c",
        background: "#111113",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {items.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "10px 0",
              background: "transparent",
              border: "none",
              color: active ? "#3b82f6" : "#999",
              fontSize: 11,
            }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            {t(item.key)}
          </button>
        );
      })}
    </nav>
  );
}
