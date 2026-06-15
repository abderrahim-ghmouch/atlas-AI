"use client";

import { useLanguage } from "@/app/LanguageContext";
import { getTranslation } from "@/lib/translations";
import { AuthHeader } from "@/app/components/AuthHeader";

export default function SignUpPage() {
  const { language } = useLanguage();
  const isRtl = language === "ar";

  return (
    <div className="min-h-full bg-[#FFFBF5] text-[#0F172A]">
      <AuthHeader authLink="signup" />

      <main className={`mx-auto flex max-w-md flex-col px-6 py-10 ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold">{getTranslation(language, "createAccount")}</h1>
          <p className="mt-2 text-[#0F172A]/70">
            {getTranslation(language, "joinPlatform")}
          </p>
        </div>

        <form className="flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
              {getTranslation(language, "fullName")}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder={getTranslation(language, "fullNamePlaceholder")}
              className="w-full rounded-2xl border border-[#0F172A] bg-[#FFFBF5] px-4 py-3 text-[#0F172A] placeholder:text-[#0F172A]/40 outline-none focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/20 transition-all"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              {getTranslation(language, "email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
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
              placeholder={getTranslation(language, "passwordPlaceholder")}
              dir="ltr"
              className="w-full rounded-2xl border border-[#0F172A] bg-[#FFFBF5] px-4 py-3 text-[#0F172A] placeholder:text-[#0F172A]/40 outline-none focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/20 transition-all"
            />
          </div>

          <div>
            <label htmlFor="subject" className="mb-1.5 block text-sm font-medium">
              {getTranslation(language, "subject")}
            </label>
            <select
              id="subject"
              name="subject"
              className="w-full rounded-2xl border border-[#0F172A] bg-[#FFE4E8] px-4 py-3 text-[#0F172A] outline-none focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/20 transition-all"
            >
              <option value="">{getTranslation(language, "selectSubject")}</option>
              <option value="commercial-law">{getTranslation(language, "commercialLaw")}</option>
              <option value="civil-law">{getTranslation(language, "civilLaw")}</option>
              <option value="constitutional-law">{getTranslation(language, "constitutionalLaw")}</option>
            </select>
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-full bg-[#0F172A] py-3 text-sm font-medium text-white hover:bg-[#0F172A]/90 transition-colors"
          >
            {getTranslation(language, "createAccountButton")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#0F172A]/70">
          {getTranslation(language, "alreadyHaveAccount")}{" "}
          <a href="/login" className="font-medium text-[#0F172A] underline hover:text-[#0F172A]/80 transition-colors">
            {getTranslation(language, "loginLink")}
          </a>
        </p>
      </main>
    </div>
  );
}
