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
  const [semester, setSemester] = useState<number>(1);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  const selectedUniversity = universities.find((u) => u.id === universityId);
  const selectedBranch = selectedUniversity?.branches.find((b) => b.id === branchId);
  
  // Filter subjects based on selected branch and selected semester
  const availableSubjects = selectedBranch
    ? selectedBranch.subjects.filter((s) => s.semester === semester)
    : [];

  // GSAP animation for the sliding steps and progress bar
  useGSAP(() => {
    // Animate the sliding track (now 4 steps, each takes 25% of width)
    gsap.to(".steps-track", {
      xPercent: -(step - 1) * 25,
      duration: 0.35,
      ease: "power2.out",
    });

    // Animate the progress bar fill
    gsap.to(".progress-bar-fill", {
      width: `${(step / 4) * 100}%`,
      duration: 0.25,
      ease: "power1.out",
    });
  }, { scope: containerRef, dependencies: [step] });

  function handleSelectUniversity(id: string) {
    setUniversityId(id);
    setBranchId("");
    setStep(2);
  }

  function handleSelectBranch(id: string) {
    setBranchId(id);
    setStep(3);
  }

  function handleSelectSemester(semId: number) {
    setSemester(semId);
    
    // Automatically pre-select all subjects of the newly selected semester
    if (selectedBranch) {
      const filtered = selectedBranch.subjects.filter((s) => s.semester === semId);
      setSelectedSubjectIds(filtered.map((s) => s.id));
    }
    
    setStep(4);
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

    const activeSubjectId = selectedSubjectIds[0];
    const activeSubject = selectedBranch.subjects.find((s) => s.id === activeSubjectId);
    if (!activeSubject) return;

    saveStudyContext({
      universityId,
      branchId,
      semester,
      selectedSubjectIds,
      subjectId: activeSubjectId,
      universityLabel: getTranslation(language, selectedUniversity.labelKey as TranslationKey),
      branchLabel: getTranslation(language, selectedBranch.labelKey as TranslationKey),
      subjectLabel: getTranslation(language, activeSubject.labelKey as TranslationKey),
    });

    onComplete?.();
  }

  const getBranchIcon = (id: string) => {
    switch (id) {
      case "droit-prive":
        return "⚖️";
      case "droit-public":
        return "🏛️";
      case "economie-gestion":
        return "📊";
      case "sciences-maths-info":
        return "💻";
      default:
        return "📚";
    }
  };

  const semestersList = [
    { id: 1, label: "Semestre 1 (S1)", num: "❶" },
    { id: 2, label: "Semestre 2 (S2)", num: "❷" },
    { id: 3, label: "Semestre 3 (S3)", num: "❸" },
    { id: 4, label: "Semestre 4 (S4)", num: "❹" },
    { id: 5, label: "Semestre 5 (S5)", num: "❺" },
    { id: 6, label: "Semestre 6 (S6)", num: "❻" },
  ];

  return (
    <div ref={containerRef} className="w-full">
      {/* Progress Indicator */}
      <div className="mb-6 flex flex-col gap-1.5">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-secondary">
          <span>Univ</span>
          <span>Filière</span>
          <span>Semestre</span>
          <span>Matières</span>
        </div>
        <div className="h-1.5 w-full rounded-sm bg-[#E2E8F0] overflow-hidden">
          <div className="progress-bar-fill h-full w-1/4 rounded-sm bg-primary" />
        </div>
      </div>

      {/* Navigation Header */}
      {step > 1 && (
        <button
          type="button"
          onClick={handleBack}
          className="mb-4 flex items-center gap-1 text-xs font-semibold text-secondary hover:text-primary transition-colors cursor-pointer"
        >
          ← Retour
        </button>
      )}

      {/* Outer Slider Container */}
      <div className="w-full overflow-hidden">
        <form onSubmit={handleSubmit} className="steps-track flex w-[400%]">
          {/* STEP 1: University Selection */}
          <div className="w-1/4 px-1 flex flex-col gap-3">
            <h2 className="font-serif text-sm font-semibold text-primary mb-1">
              Choisissez votre université :
            </h2>
            <div className="grid grid-cols-1 gap-2 max-h-[320px] overflow-y-auto pr-1">
              {universities.map((univ) => (
                <button
                  key={univ.id}
                  type="button"
                  onClick={() => handleSelectUniversity(univ.id)}
                  className={`w-full text-left border rounded-md p-3 cursor-pointer transition-all flex items-center gap-3 ${
                    universityId === univ.id
                      ? "bg-[#F1F5F9] border-2 border-primary shadow-medium"
                      : "bg-surface border-[#E2E8F0] shadow-subtle hover:border-primary/50"
                  }`}
                >
                  {univ.logo ? (
                    <img
                      src={`/univ-logos/${univ.logo}`}
                      alt=""
                      className="w-6 h-6 object-contain rounded-sm"
                    />
                  ) : (
                    <span className="text-base">🎓</span>
                  )}
                  <span className="font-sans font-medium text-xs text-primary">
                    {getTranslation(language, univ.labelKey as TranslationKey)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: Branch/Major Selection */}
          <div className="w-1/4 px-1 flex flex-col gap-3">
            <h2 className="font-serif text-sm font-semibold text-primary mb-1">
              Choisissez votre filière :
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {selectedUniversity?.branches.map((branch) => (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => handleSelectBranch(branch.id)}
                  className={`w-full text-left border rounded-md p-3.5 cursor-pointer transition-all flex items-center gap-3 ${
                    branchId === branch.id
                      ? "bg-[#F1F5F9] border-2 border-primary shadow-medium"
                      : "bg-surface border-[#E2E8F0] shadow-subtle hover:border-primary/50"
                  }`}
                >
                  <span className="text-lg">{getBranchIcon(branch.id)}</span>
                  <span className="font-sans font-medium text-xs text-primary">
                    {getTranslation(language, branch.labelKey as TranslationKey)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 3: Semester Selection */}
          <div className="w-1/4 px-1 flex flex-col gap-3">
            <h2 className="font-serif text-sm font-semibold text-primary mb-1">
              Choisissez votre semestre :
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {semestersList.map((sem) => (
                <button
                  key={sem.id}
                  type="button"
                  onClick={() => handleSelectSemester(sem.id)}
                  className={`text-center border rounded-md p-4 cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                    semester === sem.id
                      ? "bg-[#F1F5F9] border-2 border-primary shadow-medium"
                      : "bg-surface border-[#E2E8F0] shadow-subtle hover:border-primary/50"
                  }`}
                >
                  <span className="text-lg text-primary">{sem.num}</span>
                  <span className="font-sans font-semibold text-[11px] text-primary">
                    S{sem.id}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 4: Subjects Customization */}
          <div className="w-1/4 px-1 flex flex-col gap-3">
            <h2 className="font-serif text-sm font-semibold text-primary mb-1">
              Personnalisez vos matières (S{semester}) :
            </h2>
            <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-1">
              {availableSubjects.map((subject) => {
                const isSelected = selectedSubjectIds.includes(subject.id);
                return (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => handleToggleSubject(subject.id)}
                    className={`w-full text-left border rounded-md px-3.5 py-2.5 cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-surface border-2 border-primary shadow-subtle opacity-100"
                        : "bg-surface border-[#E2E8F0] opacity-50 shadow-subtle"
                    }`}
                  >
                    <span className="font-sans font-medium text-xs text-primary pr-2">
                      {getTranslation(language, subject.labelKey as TranslationKey)}
                    </span>
                    <div
                      className={`w-4 h-4 rounded-sm border flex items-center justify-center text-[9px] flex-shrink-0 ${
                        isSelected
                          ? "bg-primary border-primary text-white font-bold"
                          : "bg-transparent border-[#CBD5E1]"
                      }`}
                    >
                      {isSelected && "✓"}
                    </div>
                  </button>
                );
              })}
              {availableSubjects.length === 0 && (
                <p className="text-xs text-secondary text-center py-4">
                  Aucune matière disponible pour ce semestre.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={selectedSubjectIds.length === 0}
              className="mt-4 w-full rounded-md bg-primary py-3 text-xs font-semibold text-white hover:bg-[#162D4A] transition-colors disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
            >
              {getTranslation(language, submitLabelKey)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
