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
    <div className="mx-auto max-w-md px-4 pb-24 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="wash-heading">{t("training_title")}</h1>
        <LangToggle />
      </div>

      <div className="flex flex-col gap-2.5">
        {CATEGORIES.map((c) => (
          <div key={c.key} className="wash-card flex items-center gap-4 px-4 py-4">
            <span className="text-3xl">{c.icon}</span>
            <span className="text-base text-chalk">{t(c.key)}</span>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
