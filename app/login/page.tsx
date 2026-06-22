"use client";

import { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/LanguageContext";
import { getTranslation } from "@/lib/translations";
import { AuthHeader } from "@/app/components/AuthHeader";
import { hasStudyContext } from "@/lib/study-context";

export default function LoginPage() {
  const { language } = useLanguage();
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(hasStudyContext() ? "/dashboard" : "/onboarding");
  }

  return (
    <div className="min-h-full bg-[#FFFBF5] text-[#0F172A]">
      <AuthHeader authLink="login" />

      <main className="mx-auto flex max-w-md flex-col px-6 py-10" dir="ltr">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold">{getTranslation(language, "welcomeBack")}</h1>
          <p className="mt-2 text-[#0F172A]/70">{getTranslation(language, "loginDescription")}</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              {getTranslation(language, "email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder={getTranslation(language, "emailPlaceholder")}
              dir="ltr"
              className="w-full rounded-2xl border border-[#0F172A] bg-[#E0EFFF] px-4 py-3 text-[#0F172A] placeholder:text-[#0F172A]/40 outline-none focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/20 transition-all"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
              {getTranslation(language, "password")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder={getTranslation(language, "passwordPlaceholder")}
              dir="ltr"
              className="w-full rounded-2xl border border-[#0F172A] bg-[#FFFBF5] px-4 py-3 text-[#0F172A] placeholder:text-[#0F172A]/40 outline-none focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/20 transition-all"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="remember" className="w-4 h-4 rounded border border-[#0F172A] cursor-pointer" />
              {getTranslation(language, "rememberMe")}
            </label>
            <a href="#" className="text-sm font-medium text-[#0F172A] underline hover:text-[#0F172A]/80 transition-colors">
              {getTranslation(language, "forgotPassword")}
            </a>
          </div>

          <button type="submit" className="mt-2 w-full rounded-full bg-[#0F172A] py-3 text-sm font-medium text-white hover:bg-[#0F172A]/90 transition-colors">
            {getTranslation(language, "login")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#0F172A]/70">
          {getTranslation(language, "haveAccount")}{" "}
          <a href="/signup" className="font-medium text-[#0F172A] underline hover:text-[#0F172A]/80 transition-colors">
            {getTranslation(language, "signUpLink")}
          </a>
        </p>
      </main>
    </div>
  );
}
