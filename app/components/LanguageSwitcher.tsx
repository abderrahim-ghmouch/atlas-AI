"use client";

import { useLanguage } from "@/app/LanguageContext";
import { Language } from "@/lib/translations";

export function LanguageSwitcher() {
  const { language } = useLanguage();

  return (
    <div className="flex gap-2">
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#0F172A] text-white">{language.toUpperCase()}</span>
    </div>
  );
}
