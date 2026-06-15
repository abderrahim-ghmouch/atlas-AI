"use client";

import Link from "next/link";
import { useLanguage } from "@/app/LanguageContext";
import { getTranslation } from "@/lib/translations";
import { LanguageSwitcher } from "@/app/components/LanguageSwitcher";

export default function Home() {
  const { language } = useLanguage();
  const isRtl = language === "ar";

  return (
    <div className={`min-h-screen bg-[#FFFBF5] text-[#0F172A] font-sans ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-8">
        <header className={`flex items-center justify-between rounded-3xl border border-[#0F172A] bg-[#FFFBF5] px-6 py-5 ${isRtl ? "flex-row-reverse" : ""}`}>
          <div className="text-xl font-semibold tracking-tight">
            {getTranslation(language, "appName")}
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href="/signup" className="rounded-full bg-[#0F172A] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0F172A]/90 transition-colors">
              {getTranslation(language, "signUpNow")}
            </Link>
          </div>
        </header>

        <main className="mt-8 space-y-8">
          <section className="rounded-3xl border border-[#0F172A] bg-[#FFFBF5] p-6">
            <h1 className="text-3xl font-semibold">{getTranslation(language, "welcome")}</h1>
            <p className="mt-3 text-base leading-7 text-[#0F172A]/90">
              {getTranslation(language, "todaySubject")}
            </p>
          </section>

          <section className="space-y-4">
            <div className={`flex ${isRtl ? "justify-end" : "justify-start"}`}>
              <div className="max-w-xl rounded-2xl border border-[#0F172A] bg-[#E0EFFF] px-5 py-4 text-[#0F172A]">
                <p className="text-sm leading-7">
                  {language === "ar" && "هل يمكنك شرح الفرق بين عقد البيع والإيجار؟"}
                  {language === "fr" && "Pouvez-vous expliquer la différence entre un contrat de vente et de location?"}
                  {language === "en" && "Can you explain the difference between a sales contract and a rental contract?"}
                </p>
              </div>
            </div>

            <div className={`flex ${isRtl ? "justify-start" : "justify-start"}`}>
              <div className="max-w-xl rounded-2xl border border-[#0F172A] bg-[#FFFBF5] px-5 py-5 text-[#0F172A]">
                <p className="mb-3 text-sm leading-7">
                  {language === "ar" && "بالتأكيد، دعنا نراجع النقاط الرئيسية:"}
                  {language === "fr" && "Bien sûr, examinons les points clés:"}
                  {language === "en" && "Of course, let's review the key points:"}
                </p>
                <ol className="space-y-2 pl-5 text-sm leading-7 list-decimal">
                  {language === "ar" && (
                    <>
                      <li>عقد البيع ينقل ملكية المال بالكامل للمشتري.</li>
                      <li>عقد الإيجار يمنح حق الانتفاع بالمكان دون نقله.</li>
                      <li>البيع يعتمد على الثمن، والإيجار يعتمد على الأجرة الدورية.</li>
                    </>
                  )}
                  {language === "fr" && (
                    <>
                      <li>Un contrat de vente transfère la propriété complète au client.</li>
                      <li>Un contrat de location accorde le droit d'utiliser sans transférer la propriété.</li>
                      <li>La vente est basée sur le prix, la location sur les paiements périodiques.</li>
                    </>
                  )}
                  {language === "en" && (
                    <>
                      <li>A sales contract transfers full ownership to the buyer.</li>
                      <li>A rental contract grants the right to use without transferring ownership.</li>
                      <li>Sales are based on price, rental on periodic payments.</li>
                    </>
                  )}
                </ol>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#0F172A] bg-[#FFF3C4] p-5 text-sm leading-7">
                <span className="text-base">💡</span>
                <p className="mt-3">
                  {language === "ar" && "ملاحظة الأستاذ: هذا السؤال تكرر في امتحان 2024"}
                  {language === "fr" && "Remarque du professeur: Cette question est revenue à l'examen 2024"}
                  {language === "en" && "Professor's Note: This question repeated on the 2024 exam"}
                </p>
              </div>
              <div className="rounded-2xl border border-[#0F172A] bg-[#FFE4E8] p-5 text-sm leading-7">
                <span className="text-base">⚖️</span>
                <p className="mt-3">
                  {language === "ar" && "قانون: تنظم هذه المسائل القوانين التجارية والمدنية المختلفة"}
                  {language === "fr" && "Loi: Ces questions sont régies par les lois commerciales et civiles"}
                  {language === "en" && "Law: These matters are governed by various commercial and civil laws"}
                </p>
              </div>
            </div>
          </section>
        </main>

        <footer className="mt-auto rounded-full border border-[#0F172A] bg-[#FFFBF5] px-4 py-3">
          <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
            <input
              type="text"
              placeholder={language === "ar" ? "اكتب سؤالك هنا..." : language === "fr" ? "Écrivez votre question ici..." : "Write your question here..."}
              className="flex-1 rounded-full border border-[#0F172A] bg-[#FFFBF5] px-5 py-3 text-[#0F172A] outline-none placeholder:text-[#0F172A]/50 focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/20 transition-all"
            />
            <button className="rounded-full bg-[#0F172A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0F172A]/90 transition-colors">
              {language === "ar" ? "إرسال" : language === "fr" ? "Envoyer" : "Send"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
