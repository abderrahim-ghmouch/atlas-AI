"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useLanguage } from "@/app/LanguageContext";
import { getTranslation } from "@/lib/translations";
import { AuthHeader } from "@/app/components/AuthHeader";

export default function ForgotPasswordPage() {
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) return;
    setIsSubmitted(true);
  }

  return (
    <div className="min-h-full bg-background text-primary">
      <AuthHeader authLink="login" />

      <main className="mx-auto flex max-w-sm flex-col px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-headline font-bold text-primary">
            {getTranslation(language, "forgotPasswordTitle")}
          </h1>
          <p className="mt-2 text-xs font-normal text-secondary leading-relaxed">
            {getTranslation(language, "forgotPasswordDescription")}
          </p>
        </div>

        <div className="bg-surface border border-[#E2E8F0] p-6 rounded-md shadow-subtle">
          {!isSubmitted ? (
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="mb-1 block text-xs font-semibold text-primary">
                  {getTranslation(language, "email")}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={getTranslation(language, "emailPlaceholder")}
                  className="w-full rounded-md border border-[#CBD5E1] bg-surface px-3 py-2 text-xs text-primary placeholder:text-primary/30 outline-none hover:border-[#94A3B8] focus:border-primary focus:ring-2 focus:ring-primary/12 transition-all"
                />
              </div>

              <button
                type="submit"
                className="mt-2 w-full rounded-md bg-primary py-2.5 text-xs font-semibold text-white hover:bg-[#162D4A] transition-colors cursor-pointer"
              >
                {getTranslation(language, "sendResetLink")}
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center text-center gap-4 py-2">
              <div className="w-10 h-10 rounded-full bg-green-50 text-success border border-green-200 flex items-center justify-center text-lg">
                ✓
              </div>
              <p className="text-xs font-medium text-primary">
                {getTranslation(language, "emailSentSuccess")}
              </p>
              
              {/* Simulation link for mockup testing */}
              <div className="mt-4 p-3 bg-[#EFF6FF] border border-[#CBD5E1] rounded-md w-full">
                <p className="text-[10px] text-secondary uppercase font-bold tracking-wider mb-1">
                  Simulation de l'E-mail
                </p>
                <Link
                  href="/reset-password"
                  className="text-xs font-semibold text-tertiary underline hover:text-primary"
                >
                  Accéder à la page de réinitialisation →
                </Link>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-secondary">
          <Link href="/login" className="font-semibold text-tertiary underline hover:text-primary transition-colors">
            {getTranslation(language, "backToLogin")}
          </Link>
        </p>
      </main>
    </div>
  );
}
