"use client";

import { useT, LangToggle, DictKey } from "@/lib/i18n";
import { BottomNav } from "@/components/BottomNav";

const CATEGORIES: { key: DictKey; icon: string }[] = [
  { key: "training_exterior_wash", icon: "🚿" },
  { key: "training_waterless", icon: "💧" },
  { key: "training_microfiber", icon: "🧽" },
  { key: "training_wheels", icon: "🛞" },
  { key: "training_luxury", icon: "🚘" },
  { key: "training_damage", icon: "🔍" },
  { key: "training_property", icon: "🛡️" },
];

export default function TrainingPage() {
  const t = useT();

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: "0 auto", paddingBottom: 90 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20 }}>{t("training_title")}</h1>
        <LangToggle />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {CATEGORIES.map((c) => (
          <div
            key={c.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: 16,
              borderRadius: 12,
              border: "1px solid #2a2a2c",
              background: "#1a1a1c",
            }}
          >
            <span style={{ fontSize: 28 }}>{c.icon}</span>
            <span style={{ fontSize: 16 }}>{t(c.key)}</span>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
