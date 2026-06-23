"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useLanguage } from "@/app/LanguageContext";
import { getTranslation } from "@/lib/translations";
import { AuthHeader } from "@/app/components/AuthHeader";

export default function ResetPasswordPage() {
  const { language } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    if (!password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setValidationError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitted(true);
  }

  return (
    <div className="min-h-full bg-background text-primary">
      <AuthHeader authLink="login" />

      <main className="mx-auto flex max-w-sm flex-col px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-headline font-bold text-primary">
            {getTranslation(language, "resetPasswordTitle")}
          </h1>
          <p className="mt-2 text-xs font-normal text-secondary leading-relaxed">
            {getTranslation(language, "resetPasswordDescription")}
          </p>
        </div>

        <div className="bg-surface border border-[#E2E8F0] p-6 rounded-md shadow-subtle">
          {validationError && (
            <div className="mb-4 rounded-md border border-error bg-red-50 p-3 text-error text-[11px] font-medium">
              ⚠️ {validationError}
            </div>
          )}

          {!isSubmitted ? (
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="password" className="mb-1 block text-xs font-semibold text-primary">
                  {getTranslation(language, "newPassword")}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={getTranslation(language, "newPasswordPlaceholder")}
                  className="w-full rounded-md border border-[#CBD5E1] bg-surface px-3 py-2 text-xs text-primary placeholder:text-primary/30 outline-none hover:border-[#94A3B8] focus:border-primary focus:ring-2 focus:ring-primary/12 transition-all"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-1 block text-xs font-semibold text-primary">
                  {getTranslation(language, "confirmNewPassword")}
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={getTranslation(language, "confirmNewPasswordPlaceholder")}
                  className="w-full rounded-md border border-[#CBD5E1] bg-surface px-3 py-2 text-xs text-primary placeholder:text-primary/30 outline-none hover:border-[#94A3B8] focus:border-primary focus:ring-2 focus:ring-primary/12 transition-all"
                />
              </div>

              <button
                type="submit"
                className="mt-2 w-full rounded-md bg-primary py-2.5 text-xs font-semibold text-white hover:bg-[#162D4A] transition-colors cursor-pointer"
              >
                {getTranslation(language, "resetPasswordButton")}
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center text-center gap-4 py-2">
              <div className="w-10 h-10 rounded-full bg-green-50 text-success border border-green-200 flex items-center justify-center text-lg">
                ✓
              </div>
              <p className="text-xs font-medium text-primary">
                {getTranslation(language, "passwordResetSuccess")}
              </p>
              
              <Link
                href="/login"
                className="w-full rounded-md bg-primary py-2.5 text-center text-xs font-semibold text-white hover:bg-[#162D4A] transition-colors mt-2"
              >
                {getTranslation(language, "backToLogin")}
              </Link>
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
