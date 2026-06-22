export type StudyContext = {
  universityId: string;
  branchId: string;
  selectedSubjectIds: string[];
  subjectId: string;
  universityLabel: string;
  branchLabel: string;
  subjectLabel: string;
};

const STORAGE_KEY = "mgscholar-study-context";

export function saveStudyContext(context: StudyContext): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
}

export function getStudyContext(): StudyContext | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StudyContext;
  } catch {
    return null;
  }
}

export function hasStudyContext(): boolean {
  return getStudyContext() !== null;
}

export function buildAiStudyPrompt(context: StudyContext): string {
  return [
    "Student profile:",
    `- University: ${context.universityLabel}`,
    `- Branch / major: ${context.branchLabel}`,
    `- Subject to learn: ${context.subjectLabel}`,
    "",
    "Provide study resources, explanations, and exam-oriented answers tailored to this curriculum.",
  ].join("\n");
}
