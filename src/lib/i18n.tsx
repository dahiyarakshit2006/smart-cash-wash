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

  sync_all_saved: { hi: "सब सेव हो गया", en: "All saved" },
  sync_saving: { hi: "सेव हो रहा है", en: "Saving" },
  sync_offline_saved: { hi: "ऑफ़लाइन — काम सेव है", en: "Offline — work saved locally" },

  today_greeting: { hi: "नमस्ते", en: "Good morning" },
  today_progress: { hi: "आज की प्रगति", en: "Today's progress" },
  today_cars_completed: { hi: "गाड़ियाँ पूरी हुईं", en: "Cars completed" },
  today_next_car: { hi: "अगली गाड़ी", en: "Next car" },
  today_start_car: { hi: "शुरू करें", en: "Start car" },
  today_your_route: { hi: "आपका रूट", en: "Your route" },
  today_all_done: { hi: "आज का काम पूरा हुआ 🎉", en: "All cars done for today 🎉" },

  car_parking: { hi: "पार्किंग", en: "Parking" },
  car_start_service: { hi: "सर्विस शुरू करें", en: "Start service" },
  car_step_1: { hi: "चरण 1 / 3", en: "Step 1 of 3" },
  car_step_2: { hi: "चरण 2 / 3", en: "Step 2 of 3" },
  car_step_3: { hi: "चरण 3 / 3", en: "Step 3 of 3" },
  car_capture_before_title: { hi: "पहले की फोटो लें", en: "Capture before photo" },
  car_capture_before_body: { hi: "गाड़ी की साफ फोटो लें।", en: "Take a clear photo of the car." },
  car_before_saved: { hi: "✓ पहले की फोटो सेव हुई", en: "✓ Before photo saved" },
  car_continue: { hi: "आगे बढ़ें", en: "Continue" },
  car_wash_in_progress: { hi: "धुलाई जारी है", en: "Wash in progress" },
  car_wash_body: { hi: "सामान्य सफाई प्रक्रिया अपनाएं।", en: "Follow the standard cleaning process." },
  car_view_sop: { hi: "तरीका देखें", en: "View SOP" },
  car_washed: { hi: "गाड़ी धुल गई", en: "Car washed" },
  car_capture_after_title: { hi: "बाद की फोटो लें", en: "Capture after photo" },
  car_complete_service: { hi: "सर्विस पूरी करें ✓", en: "Complete service ✓" },
  car_completed_title: { hi: "✓ सर्विस पूरी हुई", en: "✓ Service completed" },
  car_next_car: { hi: "अगली गाड़ी →", en: "Next car →" },

  car_report_issue: { hi: "⚠ समस्या बताएं", en: "⚠ Report issue" },
  car_exception_prompt: { hi: "धुलाई क्यों नहीं हुई?", en: "Why couldn't you complete the wash?" },
  car_add_another_photo: { hi: "एक और फोटो जोड़ें", en: "Add another photo" },
  car_flag_damage_action: { hi: "नुकसान दर्ज करें", en: "Flag damage" },
  car_damage_flagged_title: { hi: "⚠ नुकसान दर्ज हुआ", en: "⚠ Damage flagged" },
  car_damage_flagged_body: {
    hi: "सुपरवाइज़र को सूचित कर दिया गया है। निर्देश मिलने तक आगे न बढ़ें।",
    en: "Supervisor has been notified. Do not continue until instructed.",
  },

  shift_title: { hi: "आपकी शिफ्ट", en: "Your shift" },
  shift_assigned_cars: { hi: "गाड़ियाँ सौंपी गईं", en: "Assigned cars" },
  shift_start: { hi: "शिफ्ट शुरू करें", en: "Start shift" },
  shift_progress: { hi: "शिफ्ट प्रगति", en: "Shift progress" },
  shift_completed: { hi: "पूरी हुईं", en: "Completed" },
  shift_pending: { hi: "बाकी", en: "Pending" },
  shift_issues: { hi: "समस्याएं", en: "Issues" },
  shift_end: { hi: "शिफ्ट खत्म करें", en: "Finish shift" },
  shift_complete_title: { hi: "शिफ्ट पूरी हुई 🎉", en: "Shift complete 🎉" },
  shift_exceptions: { hi: "अपवाद", en: "Exceptions" },

  training_title: { hi: "प्रशिक्षण", en: "Training" },
  training_exterior_wash: { hi: "बाहरी धुलाई", en: "Exterior Wash" },
  training_waterless: { hi: "बिना पानी की सफाई", en: "Waterless Cleaning" },
  training_microfiber: { hi: "माइक्रोफाइबर का उपयोग", en: "Microfiber Usage" },
  training_wheels: { hi: "पहिए और टायर", en: "Wheels & Tyres" },
  training_luxury: { hi: "लक्ज़री कार हैंडलिंग", en: "Luxury Car Handling" },
  training_damage: { hi: "नुकसान पहचान", en: "Damage Detection" },
  training_property: { hi: "ग्राहक की संपत्ति की सुरक्षा", en: "Customer Property Safety" },

  profile_title: { hi: "प्रोफ़ाइल", en: "Profile" },
  profile_worker_id: { hi: "वर्कर आईडी", en: "Worker ID" },
  profile_cluster: { hi: "क्लस्टर", en: "Cluster" },
  profile_this_month: { hi: "इस महीने", en: "This month" },
  profile_cars_completed: { hi: "गाड़ियाँ पूरी हुईं", en: "Cars completed" },
  profile_working_days: { hi: "कार्य दिवस", en: "Working days" },
  profile_logout: { hi: "लॉग आउट", en: "Log out" },

  nav_today: { hi: "आज", en: "Today" },
  nav_shift: { hi: "शिफ्ट", en: "Shift" },
  nav_training: { hi: "प्रशिक्षण", en: "Training" },
  nav_profile: { hi: "प्रोफ़ाइल", en: "Profile" },
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
  const base = "font-mono text-xs uppercase tracking-widest2 px-2 py-1 rounded-md transition-colors duration-150";
  return (
    <div className="flex items-center gap-1 rounded-lg border border-line p-1">
      <button
        onClick={() => setLang("hi")}
        aria-pressed={lang === "hi"}
        className={`${base} ${lang === "hi" ? "bg-accent text-ink" : "text-muted"}`}
      >
        हिं
      </button>
      <button
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`${base} ${lang === "en" ? "bg-accent text-ink" : "text-muted"}`}
      >
        EN
      </button>
    </div>
  );
}
