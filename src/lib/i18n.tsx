"use client";

// Minimal Hindi/English dictionary for all worker-facing text. Kept as a
// flat key->{hi,en} map rather than a full i18n library — the worker-facing
// surface is small and fixed (no free text, no dynamic content), so a full
// library would be more machinery than the problem needs.

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "hi" | "en";

const LANG_KEY = "wash_lang";

const dict = {
  login_title: { hi: "फोन नंबर डालें", en: "Enter phone number" },
  login_phone_placeholder: { hi: "फोन नंबर", en: "Phone number" },
  login_send_otp: { hi: "OTP भेजें", en: "Send OTP" },
  login_enter_otp: { hi: "OTP डालें", en: "Enter OTP" },
  login_verify: { hi: "पुष्टि करें", en: "Verify" },
  login_not_registered: { hi: "यह नंबर पंजीकृत नहीं है", en: "This number is not registered" },
  login_invalid_code: { hi: "गलत कोड", en: "Invalid code" },
  consent_title: { hi: "सहमति", en: "Consent" },
  consent_body_1: {
    hi: "काम के दौरान गाड़ी की फोटो ली जाएगी। यह आपके फोन के डेटा कनेक्शन का उपयोग करेगा।",
    en: "Photos of vehicles will be taken during your shift. This uses your phone's data connection.",
  },
  consent_body_2: {
    hi: "आप बाहर निकलते समय फोन की सेटिंग से पहुंच वापस ले सकते हैं।",
    en: "You can revoke access anytime from your phone's app settings when you exit.",
  },
  consent_geo_toggle: {
    hi: "शिफ्ट शुरू और खत्म होने पर स्थान साझा करें",
    en: "Share location at shift start and end",
  },
  consent_accept: { hi: "स्वीकार करें और जारी रखें", en: "Accept and continue" },

  route_no_route: { hi: "आज कोई रूट नहीं है", en: "No route assigned today" },
  route_flat: { hi: "फ्लैट", en: "Flat" },

  car_photo_before: { hi: "पहले की फोटो", en: "Before photo" },
  car_photo_after: { hi: "बाद की फोटो", en: "After photo" },
  car_done: { hi: "पूरा हुआ", en: "Done" },
  car_back: { hi: "वापस", en: "Back" },
  car_exception_title: { hi: "अपवाद", en: "Exceptions" },
  car_not_in_slot: { hi: "जगह में नहीं", en: "Not in slot" },
  car_declined: { hi: "मना किया", en: "Declined" },
  car_blocked: { hi: "रास्ता बंद", en: "Blocked" },
  car_already_clean: { hi: "पहले से साफ", en: "Already clean" },
  car_damage_flag: { hi: "नुकसान", en: "Damage" },
  car_damage_pre_existing: { hi: "पहले से मौजूद", en: "Pre-existing" },
  car_damage_new: { hi: "नया नुकसान", en: "New damage" },
  car_damage_photo: { hi: "नुकसान की फोटो लें", en: "Take damage photo" },
} as const;

export type DictKey = keyof typeof dict;

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "hi",
  setLang: () => {},
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("hi");

  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY) as Lang | null;
    if (stored === "hi" || stored === "en") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
  };

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

export function useT() {
  const { lang } = useLang();
  return (key: DictKey) => dict[key][lang];
}

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        onClick={() => setLang("hi")}
        aria-pressed={lang === "hi"}
        style={{ fontWeight: lang === "hi" ? 700 : 400 }}
      >
        हिं
      </button>
      <button
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        style={{ fontWeight: lang === "en" ? 700 : 400 }}
      >
        EN
      </button>
    </div>
  );
}
