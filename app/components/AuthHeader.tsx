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

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-surface border-b border-[#E2E8F0] shadow-subtle">
      <Link href="/" className="font-serif text-xl font-bold tracking-tight text-primary">
        {getTranslation(language, "appName")}
      </Link>
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <Link
          href={authLink === "login" ? "/signup" : "/login"}
          className="rounded-md border border-[#CBD5E1] bg-surface text-primary px-4 py-1.5 text-xs font-semibold hover:bg-[#F1F5F9] transition-colors"
        >
          {authLink === "login" ? getTranslation(language, "signUp") : getTranslation(language, "login")}
        </Link>
      </div>
    </header>
  );
}
