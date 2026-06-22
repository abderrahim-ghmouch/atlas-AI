"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/LanguageContext";
import { getTranslation } from "@/lib/translations";
import { AuthHeader } from "@/app/components/AuthHeader";
import { AcademicSelectionForm } from "@/app/components/AcademicSelectionForm";

export default function OnboardingPage() {
  const { language } = useLanguage();
  const router = useRouter();

  return (
    <div className="min-h-full bg-background text-primary">
      <AuthHeader authLink="login" />

      <main className="mx-auto flex max-w-md flex-col px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-headline font-bold text-primary">
            {getTranslation(language, "setupYourStudies")}
          </h1>
          <p className="mt-2 text-xs text-secondary leading-relaxed">
            {getTranslation(language, "setupYourStudiesDescription")}
          </p>
        </div>

        <div className="bg-surface border border-[#E2E8F0] p-6 rounded-md shadow-subtle">
          <AcademicSelectionForm onComplete={() => router.push("/dashboard")} />
        </div>
      </main>
    </div>
  );
}
