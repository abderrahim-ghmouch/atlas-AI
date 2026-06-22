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
          <strong key={index} className="font-bold text-primary">
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
          <ol key={`list-${key}`} className="list-decimal space-y-1.5 pl-6 my-2 text-left text-xs">
            {currentList}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`list-${key}`} className="list-disc space-y-1.5 pl-6 my-2 text-left text-xs">
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
          <p key={index} className="leading-relaxed mb-1.5 text-xs">
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

  // Common quick question suggestions tailored based on the module (CorpScale styled cards)
  const suggestions = [
    {
      label: `💡 Quels sont les axes principaux de la matière ${studyContext.subjectLabel} ?`,
      text: `Quels sont les axes principaux de la matière ${studyContext.subjectLabel} et comment puis-je me préparer pour l'examen ?`,
    },
    {
      label: `📄 Résumer le cours en quelques lignes`,
      text: `Veuillez me fournir un résumé clair et concis des concepts clés du cours de ${studyContext.subjectLabel}.`,
    }
  ];

  return (
    <div className="min-h-full bg-background text-primary flex flex-col justify-between">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-surface border-b border-[#E2E8F0] shadow-subtle sticky top-0 z-10">
        <span className="font-serif text-xl font-bold tracking-tight text-primary">mgscholar.ai</span>
        <button
          type="button"
          className="rounded-md bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#162D4A] transition-colors cursor-pointer"
        >
          S'abonner
        </button>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-8 flex flex-col justify-between">
        {/* Info Banner & Subject Switcher */}
        <div className="mb-6 border-b border-[#E2E8F0] pb-4 flex flex-col gap-3">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="font-serif text-headline font-bold text-primary">Bienvenue</h1>
              <p className="mt-1 text-xs text-secondary font-medium">
                {studyContext.universityLabel} — {studyContext.branchLabel}
              </p>
            </div>
            <Link
              href="/onboarding"
              className="text-xs font-semibold text-tertiary underline hover:text-primary transition-colors"
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
                  className={`px-3.5 py-1.5 rounded-md text-[11px] font-semibold border cursor-pointer transition-all active:scale-[0.98] ${
                    isActive
                      ? "bg-primary border-primary text-white shadow-subtle"
                      : "bg-surface border-[#CBD5E1] text-primary hover:bg-[#F1F5F9]"
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
          <div className="mb-6 rounded-md border border-error bg-red-50 p-4 text-error text-xs">
            <p className="font-bold mb-1">⚠️ Alerte / Error</p>
            <p className="mb-2 font-medium">{error}</p>
            <p className="text-[11px] opacity-90 leading-relaxed">
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
                className={`max-w-[85%] rounded-md border px-4 py-3 leading-relaxed text-xs ${
                  msg.role === "user"
                    ? "bg-[#EFF6FF] border-[#CBD5E1] text-primary"
                    : "bg-surface border-[#E2E8F0] shadow-subtle text-primary"
                }`}
              >
                {msg.role === "model" ? (
                  <div className="whitespace-pre-line text-primary opacity-90">
                    {parseMarkdown(msg.content)}
                  </div>
                ) : (
                  <p className="font-medium">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-md border border-[#E2E8F0] bg-surface shadow-subtle px-4 py-3">
                <div className="flex items-center gap-1 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {messages.length === 1 && !isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-6">
            {suggestions.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(sug.text)}
                className="w-full text-left rounded-md border border-[#CBD5E1] bg-surface hover:bg-[#F1F5F9] px-4 py-3 text-xs font-semibold text-primary transition-all cursor-pointer shadow-subtle hover:border-primary/50"
              >
                {sug.label}
              </button>
            ))}
          </div>
        )}

        {/* Chat Input Box */}
        <form onSubmit={handleSubmit} className="relative sticky bottom-4 bg-background pt-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder="Posez votre question ici..."
            className="w-full rounded-md border border-[#CBD5E1] bg-surface py-3 pl-12 pr-4 text-xs text-primary placeholder:text-primary/30 outline-none hover:border-[#94A3B8] focus:border-primary focus:ring-2 focus:ring-primary/12 transition-all disabled:opacity-70"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            aria-label="Envoyer"
            className="absolute left-1.5 top-[58%] -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white hover:bg-[#162D4A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            ↑
          </button>
        </form>
      </main>
    </div>
  );
}
