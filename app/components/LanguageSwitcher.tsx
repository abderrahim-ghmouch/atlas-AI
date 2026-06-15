"use client";

import { useLanguage } from "@/app/LanguageContext";
import { Language } from "@/lib/translations";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex gap-2">
      {(["ar", "fr", "en"] as Language[]).map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            language === lang
              ? "bg-[#0F172A] text-white"
              : "bg-[#0F172A]/10 text-[#0F172A] hover:bg-[#0F172A]/20"
          }`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
