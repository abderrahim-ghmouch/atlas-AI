"use client";

import Link from "next/link";
import { useLanguage } from "@/app/LanguageContext";
import { getTranslation } from "@/lib/translations";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface AuthHeaderProps {
  authLink: "login" | "signup";
}

export function AuthHeader({ authLink }: AuthHeaderProps) {
  const { language } = useLanguage();
  const isRtl = language === "ar";

  return (
    <header className={`flex items-center justify-between px-6 py-5 ${isRtl ? "flex-row-reverse" : ""}`}>
      <Link href="/" className="text-xl font-bold tracking-tight">
        {getTranslation(language, "appName")}
      </Link>
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <Link
          href={authLink === "login" ? "/signup" : "/login"}
          className={`rounded-full border border-[#0F172A] px-5 py-2 text-sm font-medium hover:bg-[#0F172A]/5 transition-colors ${
            isRtl ? "" : ""
          }`}
        >
          {authLink === "login" ? getTranslation(language, "signUp") : getTranslation(language, "login")}
        </Link>
      </div>
    </header>
  );
}
