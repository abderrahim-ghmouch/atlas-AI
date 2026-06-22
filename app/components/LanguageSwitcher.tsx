"use client";

import { useLanguage } from "@/app/LanguageContext";
import { Language } from "@/lib/translations";

export function LanguageSwitcher() {
  const { language } = useLanguage();

  return (
    <div className="flex gap-2">
      <span className="px-2.5 py-1 rounded-sm text-[11px] font-semibold bg-[#F1F5F9] text-[#1E3A5F] border border-[#CBD5E1] tracking-wider">
        {language.toUpperCase()}
      </span>
    </div>
  );
}
