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
    <div className="min-h-full bg-[#FFFBF5] text-[#0F172A]">
      <AuthHeader authLink="login" />

      <main className="mx-auto flex max-w-md flex-col px-6 py-10" dir="ltr">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold">
            {getTranslation(language, "setupYourStudies")}
          </h1>
          <p className="mt-2 text-[#0F172A]/70">
            {getTranslation(language, "setupYourStudiesDescription")}
          </p>
        </div>

        <AcademicSelectionForm onComplete={() => router.push("/dashboard")} />
      </main>
    </div>
  );
}
