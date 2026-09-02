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
      className="fixed inset-x-0 bottom-0 flex border-t border-line bg-surface"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 font-mono text-[0.68rem] uppercase tracking-widest2 transition-colors duration-150 ${
              active ? "text-accent" : "text-muted"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            {t(item.key)}
          </button>
        );
      })}
    </nav>
  );
}
