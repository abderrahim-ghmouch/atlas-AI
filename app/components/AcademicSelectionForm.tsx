"use client";

import { FormEvent, useState, useRef } from "react";
import { useLanguage } from "@/app/LanguageContext";
import { universities } from "@/lib/academic-data";
import { getTranslation, TranslationKey } from "@/lib/translations";
import { saveStudyContext } from "@/lib/study-context";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

interface AcademicSelectionFormProps {
  onComplete?: () => void;
  submitLabelKey?: TranslationKey;
}

export function AcademicSelectionForm({
  onComplete,
  submitLabelKey = "continueToDashboard",
}: AcademicSelectionFormProps) {
  const { language } = useLanguage();
  const [step, setStep] = useState(1);
  const [universityId, setUniversityId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  const selectedUniversity = universities.find((u) => u.id === universityId);
  const selectedBranch = selectedUniversity?.branches.find((b) => b.id === branchId);

  // GSAP animation for the sliding steps and progress bar
  useGSAP(() => {
    // Animate the sliding track
    gsap.to(".steps-track", {
      xPercent: -(step - 1) * 33.333,
      duration: 0.5,
      ease: "power2.out",
    });

    // Animate the progress bar fill
    gsap.to(".progress-bar-fill", {
      width: `${(step / 3) * 100}%`,
      duration: 0.3,
      ease: "power1.out",
    });
  }, { scope: containerRef, dependencies: [step] });

  function handleSelectUniversity(id: string) {
    setUniversityId(id);
    setBranchId("");
    setSelectedSubjectIds([]);
    setStep(2);
  }

  function handleSelectBranch(id: string) {
    setBranchId(id);
    const branch = selectedUniversity?.branches.find((b) => b.id === id);
    if (branch) {
      // Pre-select all subjects by default
      setSelectedSubjectIds(branch.subjects.map((s) => s.id));
    }
    setStep(3);
  }

  function handleToggleSubject(id: string) {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function handleBack() {
    if (step > 1) {
      setStep(step - 1);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUniversity || !selectedBranch || selectedSubjectIds.length === 0) return;

    // Default active subject is the first selected subject
    const activeSubjectId = selectedSubjectIds[0];
    const activeSubject = selectedBranch.subjects.find((s) => s.id === activeSubjectId);
    if (!activeSubject) return;

    saveStudyContext({
      universityId,
      branchId,
      selectedSubjectIds,
      subjectId: activeSubjectId,
      universityLabel: getTranslation(language, selectedUniversity.labelKey as TranslationKey),
      branchLabel: getTranslation(language, selectedBranch.labelKey as TranslationKey),
      subjectLabel: getTranslation(language, activeSubject.labelKey as TranslationKey),
    });

    onComplete?.();
  }

  // Get icons/emojis for majors/branches
  const getBranchIcon = (id: string) => {
    switch (id) {
      case "droit-prive":
        return "⚖️";
      case "droit-public":
        return "🏛️";
      case "economie-gestion":
        return "📊";
      default:
        return "📚";
    }
  };

  return (
    <div ref={containerRef} className="w-full">
      {/* Progress Indicator */}
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex justify-between text-xs font-semibold text-[#0F172A]/50">
          <span>{getTranslation(language, "university")}</span>
          <span>{getTranslation(language, "branch")}</span>
          <span>{getTranslation(language, "subject")}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[#0F172A]/10 overflow-hidden">
          <div className="progress-bar-fill h-full w-1/3 rounded-full bg-[#0F172A]" />
        </div>
      </div>

      {/* Navigation Header */}
      {step > 1 && (
        <button
          type="button"
          onClick={handleBack}
          className="mb-4 flex items-center gap-1 text-sm font-medium text-[#0F172A] hover:underline cursor-pointer"
        >
          ← Retour
        </button>
      )}

      {/* Outer Slider Container */}
      <div className="w-full overflow-hidden">
        <form onSubmit={handleSubmit} className="steps-track flex w-[300%]">
          {/* STEP 1: University Selection */}
          <div className="w-1/3 px-1 flex flex-col gap-3">
            <h2 className="text-sm font-semibold mb-1 text-[#0F172A]/60">
              Choisissez votre université :
            </h2>
            <div className="grid grid-cols-1 gap-2.5">
              {universities.map((univ) => (
                <button
                  key={univ.id}
                  type="button"
                  onClick={() => handleSelectUniversity(univ.id)}
                  className={`w-full text-left border border-[#0F172A] rounded-2xl p-4 cursor-pointer transition-all flex items-center gap-3.5 ${
                    universityId === univ.id
                      ? "bg-[#E0EFFF] ring-2 ring-[#0F172A]"
                      : "bg-[#E0EFFF]/40 hover:bg-[#E0EFFF]/75"
                  }`}
                >
                  <span className="text-xl">🎓</span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-[#0F172A]">
                      {getTranslation(language, univ.labelKey as TranslationKey)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: Branch/Major Selection */}
          <div className="w-1/3 px-1 flex flex-col gap-3">
            <h2 className="text-sm font-semibold mb-1 text-[#0F172A]/60">
              Choisissez votre filière :
            </h2>
            <div className="grid grid-cols-1 gap-2.5">
              {selectedUniversity?.branches.map((branch) => (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => handleSelectBranch(branch.id)}
                  className={`w-full text-left border border-[#0F172A] rounded-2xl p-4 cursor-pointer transition-all flex items-center gap-3.5 ${
                    branchId === branch.id
                      ? "bg-[#FFF3C4] ring-2 ring-[#0F172A]"
                      : "bg-[#FFF3C4]/40 hover:bg-[#FFF3C4]/70"
                  }`}
                >
                  <span className="text-xl">{getBranchIcon(branch.id)}</span>
                  <span className="font-semibold text-sm text-[#0F172A]">
                    {getTranslation(language, branch.labelKey as TranslationKey)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 3: Subjects Customization */}
          <div className="w-1/3 px-1 flex flex-col gap-3">
            <h2 className="text-sm font-semibold mb-1 text-[#0F172A]/60">
              Personnalisez vos matières pour ce semestre :
            </h2>
            <div className="flex flex-col gap-2">
              {selectedBranch?.subjects.map((subject) => {
                const isSelected = selectedSubjectIds.includes(subject.id);
                return (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => handleToggleSubject(subject.id)}
                    className={`w-full text-left border border-[#0F172A] rounded-2xl px-4 py-3 cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-[#FFE4E8] opacity-100"
                        : "bg-white opacity-50 border-dashed border-[#0F172A]/50"
                    }`}
                  >
                    <span className="font-medium text-sm text-[#0F172A]">
                      {getTranslation(language, subject.labelKey as TranslationKey)}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full border border-[#0F172A] flex items-center justify-center text-[10px] ${
                        isSelected ? "bg-[#0F172A] text-white" : "bg-transparent"
                      }`}
                    >
                      {isSelected && "✓"}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={selectedSubjectIds.length === 0}
              className="mt-4 w-full rounded-full bg-[#0F172A] py-3.5 text-sm font-semibold text-white hover:bg-[#0F172A]/90 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {getTranslation(language, submitLabelKey)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
