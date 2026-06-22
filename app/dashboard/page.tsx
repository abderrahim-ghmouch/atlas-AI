"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStudyContext, StudyContext, saveStudyContext } from "@/lib/study-context";
import { getSubjectById } from "@/lib/academic-data";
import { getTranslation, TranslationKey } from "@/lib/translations";
import { useLanguage } from "@/app/LanguageContext";

interface Message {
  role: "user" | "model";
  content: string;
}

// Custom simple markdown parser to render bullet points, numbers, and bold text nicely
function parseMarkdown(text: string) {
  const parseBold = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-bold text-[#0F172A]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = (key: number) => {
    if (currentList.length > 0) {
      if (listType === "ol") {
        elements.push(
          <ol key={`list-${key}`} className="list-decimal space-y-1.5 pl-6 my-2 text-left">
            {currentList}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`list-${key}`} className="list-disc space-y-1.5 pl-6 my-2 text-left">
            {currentList}
          </ul>
        );
      }
      currentList = [];
      listType = null;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (listType !== "ul") {
        flushList(index);
        listType = "ul";
      }
      const content = trimmed.substring(2);
      currentList.push(<li key={index} className="leading-relaxed">{parseBold(content)}</li>);
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (listType !== "ol") {
        flushList(index);
        listType = "ol";
      }
      const match = trimmed.match(/^\d+\.\s(.*)/);
      const content = match ? match[1] : trimmed;
      currentList.push(<li key={index} className="leading-relaxed">{parseBold(content)}</li>);
    } else {
      flushList(index);
      if (trimmed === "") {
        elements.push(<div key={index} className="h-2" />);
      } else {
        elements.push(
          <p key={index} className="leading-relaxed mb-1.5">
            {parseBold(line)}
          </p>
        );
      }
    }
  });
  flushList(lines.length);

  return elements;
}

export default function DashboardPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [studyContext, setStudyContext] = useState<StudyContext | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const context = getStudyContext();
    if (!context) {
      router.replace("/onboarding");
      return;
    }
    setStudyContext(context);
    
    // Set initial friendly welcome message in French
    setMessages([
      {
        role: "model",
        content: `Bonjour ! Je suis votre assistant d'études intelligent pour la matière **${context.subjectLabel}** à l'**${context.universityLabel}** (${context.branchLabel}). \n\nComment puis-je vous aider aujourd'hui à réviser vos cours, comprendre des concepts clés ou préparer vos examens ?`,
      },
    ]);
  }, [router]);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (!studyContext) {
    return null;
  }

  async function handleSendMessage(textToSend: string) {
    if (!textToSend.trim() || isLoading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: textToSend }];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages,
          studyContext,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response from AI");
      }

      setMessages((prev) => [...prev, { role: "model", content: data.text }]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setError(err.message || "Désolé, une erreur est survenue lors de la connexion au serveur.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleSendMessage(inputValue);
  }

  function handleSwitchSubject(subjectId: string) {
    if (!studyContext) return;

    const subjectData = getSubjectById(studyContext.universityId, studyContext.branchId, subjectId);
    if (!subjectData) return;

    const newLabel = getTranslation(language, subjectData.labelKey as TranslationKey);

    const updatedContext: StudyContext = {
      ...studyContext,
      subjectId,
      subjectLabel: newLabel,
    };

    setStudyContext(updatedContext);
    saveStudyContext(updatedContext);

    // Reset messages for the newly active subject
    setMessages([
      {
        role: "model",
        content: `Bonjour ! Je suis votre assistant d'études intelligent pour la matière **${newLabel}** à l'**${studyContext.universityLabel}** (${studyContext.branchLabel}). \n\nComment puis-je vous aider aujourd'hui à réviser vos cours, comprendre des concepts clés ou préparer vos examens ?`,
      },
    ]);
    setError(null);
  }

  // Common quick question suggestions tailored based on the module
  const suggestions = [
    {
      label: `💡 Quels sont les axes principaux de la matière ${studyContext.subjectLabel} ?`,
      text: `Quels sont les axes principaux de la matière ${studyContext.subjectLabel} et comment puis-je me préparer pour l'examen ?`,
      color: "bg-[#FFF3C4]"
    },
    {
      label: `📄 Résumer le cours en quelques lignes`,
      text: `Veuillez me fournir un résumé clair et concis des concepts clés du cours de ${studyContext.subjectLabel}.`,
      color: "bg-[#FFE4E8]"
    }
  ];

  return (
    <div className="min-h-full bg-[#FFFBF5] text-[#0F172A] flex flex-col justify-between">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-[#0F172A]/10 bg-[#FFFBF5] sticky top-0 z-10">
        <span className="text-xl font-bold tracking-tight">mgscholar.ai</span>
        <button
          type="button"
          className="rounded-full bg-[#0F172A] px-5 py-2 text-sm font-medium text-white hover:bg-[#0F172A]/90 transition-colors"
        >
          S'abonner
        </button>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-8 flex flex-col justify-between">
        {/* Info Banner & Subject Switcher */}
        <div className="mb-6 border-b border-[#0F172A]/10 pb-4 flex flex-col gap-3">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-semibold">Bienvenue</h1>
              <p className="mt-0.5 text-xs text-[#0F172A]/50">
                {studyContext.universityLabel} — {studyContext.branchLabel}
              </p>
            </div>
            <Link
              href="/onboarding"
              className="text-xs font-medium text-[#0F172A] underline hover:text-[#0F172A]/80 transition-colors"
            >
              Modifier les choix
            </Link>
          </div>

          {/* Horizontal Subject Switcher Tabs */}
          <div className="flex flex-wrap gap-2 mt-1">
            {(studyContext.selectedSubjectIds || [studyContext.subjectId]).map((subId) => {
              const isActive = studyContext.subjectId === subId;
              const subData = getSubjectById(studyContext.universityId, studyContext.branchId, subId);
              const label = subData ? getTranslation(language, subData.labelKey as TranslationKey) : subId;
              
              return (
                <button
                  key={subId}
                  type="button"
                  onClick={() => handleSwitchSubject(subId)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border border-[#0F172A] cursor-pointer transition-all active:scale-[0.98] ${
                    isActive
                      ? "bg-[#0F172A] text-white"
                      : "bg-white/60 text-[#0F172A]/80 hover:bg-[#0F172A]/5 border-[#0F172A]/15"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
            <p className="font-semibold mb-1">⚠️ Alerte / Error</p>
            <p className="mb-2">{error}</p>
            <p className="text-xs text-red-700 leading-relaxed">
              Veuillez vous assurer d'ajouter votre clé API Gemini dans le fichier <code>.env.local</code> sous le nom <code>GEMINI_API_KEY</code>, puis redémarrez le serveur de développement.
            </p>
          </div>
        )}

        {/* Message Thread */}
        <div className="space-y-4 mb-6 flex-1 min-h-[300px]">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl border border-[#0F172A] px-4 py-3 text-left leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#E0EFFF]"
                    : "bg-[#FFFBF5]"
                }`}
              >
                {msg.role === "model" ? (
                  <div className="whitespace-pre-line text-[#0F172A]/90">
                    {parseMarkdown(msg.content)}
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl border border-[#0F172A] bg-[#FFFBF5] px-4 py-3">
                <div className="flex items-center gap-1.5 py-1">
                  <div className="w-2 h-2 rounded-full bg-[#0F172A] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-[#0F172A] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-[#0F172A] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {messages.length === 1 && !isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {suggestions.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(sug.text)}
                className={`w-full text-left rounded-2xl border border-[#0F172A] ${sug.color} px-4 py-3 text-sm hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer`}
              >
                {sug.label}
              </button>
            ))}
          </div>
        )}

        {/* Chat Input Box */}
        <form onSubmit={handleSubmit} className="relative sticky bottom-4 bg-[#FFFBF5] pt-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder="Posez votre question ici..."
            className="w-full rounded-full border border-[#0F172A] bg-[#FFFBF5] py-3.5 pl-14 pr-5 text-[#0F172A] placeholder:text-[#0F172A]/40 outline-none focus:ring-2 focus:ring-[#0F172A]/10 transition-all disabled:opacity-70"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            aria-label="Envoyer"
            className="absolute left-2 top-[58%] -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-[#0F172A] text-white hover:bg-[#0F172A]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ↑
          </button>
        </form>
      </main>
    </div>
  );
}
