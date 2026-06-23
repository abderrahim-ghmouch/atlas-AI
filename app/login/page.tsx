"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/LanguageContext";
import { getTranslation } from "@/lib/translations";
import { LanguageSwitcher } from "@/app/components/LanguageSwitcher";
import { saveStudyContext } from "@/lib/study-context";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const { language } = useLanguage();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        throw new Error("Identifiants de connexion invalides.");
      }

      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();

      if (meData.studyContext) {
        saveStudyContext(meData.studyContext);
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-primary flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* BRAND PANEL: Linear Gradient & Illustration (visible on desktop) */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 text-white relative overflow-hidden bg-gradient-to-br from-[#0D4E56] via-[#165E67] to-[#25A194] flex-shrink-0">
        {/* Decorative ambient blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        {/* Top brand header */}
        <div className="flex items-center gap-3.5 z-10">
          <img
            src="/logo.png"
            alt="atlasai Logo"
            className="w-11 h-11 object-contain rounded-xl bg-white/10 p-1.5 border border-white/20"
          />
          <span className="font-chelsea text-2xl tracking-wide text-white drop-shadow-sm select-none">
            atlasai
          </span>
        </div>

        {/* Middle illustration */}
        <div className="my-auto flex flex-col items-center justify-center z-10 max-w-sm mx-auto">
          <img
            src="/illustration.png"
            alt="Study Illustration"
            className="w-full max-h-[400px] object-contain rounded-2xl shadow-large border border-white/10 transform hover:scale-[1.01] transition-transform duration-300"
          />
          <h2 className="font-serif text-base font-bold text-center mt-6 text-white drop-shadow-sm leading-relaxed">
            {getTranslation(language, "joinPlatform")}
          </h2>
        </div>

        {/* Bottom copyright/footer */}
        <div className="text-[10px] text-white/60 font-medium z-10">
          &copy; {new Date().getFullYear()} atlasai. Tous droits réservés.
        </div>
      </div>

      {/* FORM PANEL: Spacious forms aligned to the side */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-20 bg-background relative overflow-y-auto">
        {/* Language switcher & signup toggle at the top right */}
        <div className="absolute top-6 right-6 flex items-center gap-4 z-10">
          <LanguageSwitcher />
          <Link
            href="/signup"
            className="rounded-xl border border-brand-mint/25 bg-surface text-primary px-4 py-2 text-xs font-semibold hover:bg-brand-mint/5 transition-all duration-200"
          >
            {getTranslation(language, "signUp")}
          </Link>
        </div>

        {/* Form container centered in the right pane, but set to comfortable side width */}
        <div className="max-w-md w-full mx-auto lg:mx-0 lg:ml-8 flex flex-col justify-center min-h-[500px]">
          {/* Mobile Brand Header */}
          <div className="lg:hidden flex items-center gap-3.5 mb-8 pb-4 border-b border-brand-mint/10">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-10 h-10 object-contain rounded-xl bg-brand-mint/5 p-1 border border-brand-mint/10"
            />
            <span className="font-chelsea text-xl tracking-wide text-primary">
              atlasai
            </span>
          </div>

          <div className="mb-8">
            <h1 className="font-chelsea text-3xl font-bold tracking-tight text-primary">
              {getTranslation(language, "welcomeBack")}
            </h1>
            <p className="mt-2 text-sm text-secondary font-medium leading-relaxed">
              {getTranslation(language, "loginDescription")}
            </p>
          </div>

          <form
            className="flex flex-col gap-4.5 bg-surface border border-brand-mint/10 p-8 rounded-2xl animate-in fade-in zoom-in-95 duration-200"
            onSubmit={handleSubmit}
          >
            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-xs text-accent-coral border border-red-200 font-medium">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="mb-2 block text-xs font-semibold text-primary">
                {getTranslation(language, "email")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder={getTranslation(language, "emailPlaceholder")}
                className="w-full rounded-xl border border-brand-mint/20 bg-surface px-3.5 py-2.5 text-xs text-primary placeholder:text-primary/30 outline-none hover:border-brand-mint/40 focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/15 transition-all duration-200"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-xs font-semibold text-primary">
                {getTranslation(language, "password")}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder={getTranslation(language, "passwordPlaceholder")}
                className="w-full rounded-xl border border-brand-mint/20 bg-surface px-3.5 py-2.5 text-xs text-primary placeholder:text-primary/30 outline-none hover:border-brand-mint/40 focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/15 transition-all duration-200"
              />
            </div>

            <div className="flex items-center justify-between mt-1 mb-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="remember"
                  className="w-4 h-4 rounded border border-brand-mint/30 bg-surface text-brand-mint focus:ring-2 focus:ring-brand-mint/20 cursor-pointer"
                />
                <span className="text-secondary text-xs font-medium">{getTranslation(language, "rememberMe")}</span>
              </label>
              <Link
                href="/forgot-password"
                className="font-semibold text-brand-mint underline hover:text-primary transition-colors"
              >
                {getTranslation(language, "forgotPassword")}
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-accent-coral py-3 text-xs font-semibold text-white hover:bg-[#E0503C]/95 transition-colors duration-200 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? "Connexion..." : getTranslation(language, "login")}
            </button>
          </form>

          <p className="mt-8 text-center lg:text-left text-xs text-secondary font-medium">
            {getTranslation(language, "haveAccount")}{" "}
            <Link
              href="/signup"
              className="font-semibold text-brand-mint underline hover:text-primary transition-colors"
            >
              {getTranslation(language, "signUpLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
