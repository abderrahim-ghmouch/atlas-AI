"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent } from "react";
import { useLanguage } from "@/app/LanguageContext";
import { getTranslation } from "@/lib/translations";
import { AuthHeader } from "@/app/components/AuthHeader";

export default function SignUpPage() {
  const { language } = useLanguage();
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/onboarding");
  }

  return (
    <div className="min-h-full bg-background text-primary">
      <AuthHeader authLink="signup" />

      <main className="mx-auto flex max-w-sm flex-col px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-headline font-bold text-primary">
            {getTranslation(language, "createAccount")}
          </h1>
          <p className="mt-2 text-xs font-normal text-secondary">
            {getTranslation(language, "joinPlatform")}
          </p>
        </div>

        <form className="flex flex-col gap-4 bg-surface border border-[#E2E8F0] p-6 rounded-md shadow-subtle" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="mb-1 block text-xs font-semibold text-primary">
              {getTranslation(language, "fullName")}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder={getTranslation(language, "fullNamePlaceholder")}
              className="w-full rounded-md border border-[#CBD5E1] bg-surface px-3 py-2 text-xs text-primary placeholder:text-primary/30 outline-none hover:border-[#94A3B8] focus:border-primary focus:ring-2 focus:ring-primary/12 transition-all"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-semibold text-primary">
              {getTranslation(language, "email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder={getTranslation(language, "emailPlaceholder")}
              className="w-full rounded-md border border-[#CBD5E1] bg-surface px-3 py-2 text-xs text-primary placeholder:text-primary/30 outline-none hover:border-[#94A3B8] focus:border-primary focus:ring-2 focus:ring-primary/12 transition-all"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-semibold text-primary">
              {getTranslation(language, "password")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder={getTranslation(language, "passwordPlaceholder")}
              className="w-full rounded-md border border-[#CBD5E1] bg-surface px-3 py-2 text-xs text-primary placeholder:text-primary/30 outline-none hover:border-[#94A3B8] focus:border-primary focus:ring-2 focus:ring-primary/12 transition-all"
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-md bg-primary py-2.5 text-xs font-semibold text-white hover:bg-[#162D4A] transition-colors cursor-pointer"
          >
            {getTranslation(language, "createAccountButton")}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-secondary">
          {getTranslation(language, "alreadyHaveAccount")}{" "}
          <Link href="/login" className="font-semibold text-tertiary underline hover:text-primary transition-colors">
            {getTranslation(language, "loginLink")}
          </Link>
        </p>
      </main>
    </div>
  );
}
