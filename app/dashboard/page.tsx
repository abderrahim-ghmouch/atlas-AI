"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStudyContext, StudyContext, saveStudyContext } from "@/lib/study-context";
import { signOut } from "next-auth/react";
import { getSubjectById, universities } from "@/lib/academic-data";
import { getTranslation, TranslationKey } from "@/lib/translations";
import { useLanguage } from "@/app/LanguageContext";

interface Message {
  role: "user" | "model";
  content: string;
}

interface Discussion {
  id: string;
  title: string;
  subjectId: string;
  messages: Message[];
}

interface PolycopieFile {
  id: string;
  name: string;
  size: string;
  toggled: boolean;
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

  // Layout states
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<"profile" | "settings" | null>(null);
  const [chatFontSize, setChatFontSize] = useState<"text-[11px]" | "text-[13px]" | "text-[15px]">("text-[13px]");
  const [chatLineHeight, setChatLineHeight] = useState<"leading-tight" | "leading-normal" | "leading-relaxed">("leading-normal");

  const handleUpdateFontSize = (size: "text-[11px]" | "text-[13px]" | "text-[15px]") => {
    setChatFontSize(size);
    localStorage.setItem("mgscholar-settings-font-size", size);
  };

  const handleUpdateLineHeight = (height: "leading-tight" | "leading-normal" | "leading-relaxed") => {
    setChatLineHeight(height);
    localStorage.setItem("mgscholar-settings-line-height", height);
  };

  // Discussions & Files states
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [activeDiscussionId, setActiveDiscussionId] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<PolycopieFile[]>([]);
  
  // Drag over state
  const [isDragging, setIsDragging] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load initial context and populate backend data
  useEffect(() => {
    const savedSize = localStorage.getItem("mgscholar-settings-font-size");
    const savedHeight = localStorage.getItem("mgscholar-settings-line-height");
    if (savedSize) setChatFontSize(savedSize as any);
    if (savedHeight) setChatLineHeight(savedHeight as any);

    async function loadDashboardData() {
      try {
        const resMe = await fetch("/api/auth/me");
        if (resMe.status === 401) {
          router.replace("/login");
          return;
        }
        const meData = await resMe.json();
        if (!meData.success || !meData.studyContext) {
          const localContext = getStudyContext();
          if (localContext) {
            setStudyContext(localContext);
            await fetch("/api/auth/me", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ studyContext: localContext }),
            });
          } else {
            router.replace("/onboarding");
            return;
          }
        } else {
          setStudyContext(meData.studyContext);
          saveStudyContext(meData.studyContext);
        }

        const activeContext = meData.studyContext || getStudyContext();
        if (!activeContext) return;

        const resDisc = await fetch("/api/discussions");
        const discData = await resDisc.json();
        if (discData.success && discData.discussions.length > 0) {
          setDiscussions(discData.discussions);
          const filtered = discData.discussions.filter((d: any) => d.subjectId === activeContext.subjectId);
          if (filtered.length > 0) {
            setActiveDiscussionId(filtered[0].id);
            setMessages(filtered[0].messages);
          } else {
            // Create welcome msg for the active subject
            const welcomeMsg: Message = {
              role: "model",
              content: `Bonjour ! Je suis votre assistant d'études intelligent pour la matière **${activeContext.subjectLabel}** à l'**${activeContext.universityLabel}** (${activeContext.branchLabel}). \n\nComment puis-je vous aider aujourd'hui à réviser vos cours, comprendre des concepts clés ou préparer vos examens ?`,
            };
            const initDisc: Discussion = {
              id: `disc-init-${Date.now()}`,
              title: "Introduction et notions",
              subjectId: activeContext.subjectId,
              messages: [welcomeMsg],
            };
            setDiscussions((prev) => [initDisc, ...prev]);
            setActiveDiscussionId(initDisc.id);
            setMessages(initDisc.messages);
            await fetch("/api/discussions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(initDisc),
            });
          }
        } else {
          const welcomeMsg: Message = {
            role: "model",
            content: `Bonjour ! Je suis votre assistant d'études intelligent pour la matière **${activeContext.subjectLabel}** à l'**${activeContext.universityLabel}** (${activeContext.branchLabel}). \n\nComment puis-je vous aider aujourd'hui à réviser vos cours, comprendre des concepts clés ou préparer vos examens ?`,
          };
          const initDisc: Discussion = {
            id: `disc-init-${Date.now()}`,
            title: "Introduction et notions",
            subjectId: activeContext.subjectId,
            messages: [welcomeMsg],
          };
          setDiscussions([initDisc]);
          setActiveDiscussionId(initDisc.id);
          setMessages(initDisc.messages);
          await fetch("/api/discussions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(initDisc),
          });
        }

        const resDocs = await fetch("/api/documents");
        const docsData = await resDocs.json();
        if (docsData.success) {
          setUploadedFiles(docsData.files);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      }
    }

    loadDashboardData();
  }, [router]);

  // Sync active messages when changing active discussion
  const handleSelectDiscussion = (id: string) => {
    const disc = discussions.find((d) => d.id === id);
    if (disc) {
      setActiveDiscussionId(id);
      setMessages(disc.messages);
    }
    setLeftSidebarOpen(false);
  };

  // Scroll to bottom when messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (!studyContext) {
    return null;
  }

  const selectedUniv = universities.find((u) => u.id === studyContext.universityId);

  async function handleSendMessage(textToSend: string) {
    if (!textToSend.trim() || isLoading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: textToSend }];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    setDiscussions((prev) =>
      prev.map((d) => (d.id === activeDiscussionId ? { ...d, messages: newMessages } : d))
    );

    try {
      const currentDisc = discussions.find((d) => d.id === activeDiscussionId);
      if (currentDisc) {
        await fetch("/api/discussions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...currentDisc,
            messages: newMessages,
          }),
        });
      }

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

      const updatedMessages: Message[] = [...newMessages, { role: "model", content: data.text }];
      setMessages(updatedMessages);
      
      setDiscussions((prev) =>
        prev.map((d) => (d.id === activeDiscussionId ? { ...d, messages: updatedMessages } : d))
      );

      if (currentDisc) {
        await fetch("/api/discussions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...currentDisc,
            messages: updatedMessages,
          }),
        });
      }
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

  // Handle Switch Subject (resets file catalog and discussions list for the new subject)
  async function handleSwitchSubject(subjectId: string) {
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

    try {
      await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studyContext: updatedContext }),
      });

      const resDisc = await fetch("/api/discussions");
      const discData = await resDisc.json();
      if (discData.success) {
        const filtered = discData.discussions.filter((d: any) => d.subjectId === subjectId);
        if (filtered.length > 0) {
          setDiscussions(discData.discussions);
          setActiveDiscussionId(filtered[0].id);
          setMessages(filtered[0].messages);
        } else {
          const welcomeMsg: Message = {
            role: "model",
            content: `Bonjour ! Je suis votre assistant d'études intelligent pour la matière **${newLabel}** à l'**${studyContext.universityLabel}** (${studyContext.branchLabel}). \n\nComment puis-je vous aider aujourd'hui à réviser vos cours, comprendre des concepts clés ou préparer vos examens ?`,
          };
          const newDisc: Discussion = {
            id: `disc-${Date.now()}`,
            title: "Introduction et notions",
            subjectId,
            messages: [welcomeMsg],
          };
          setDiscussions((prev) => [newDisc, ...prev.filter(d => d.subjectId !== subjectId)]);
          setActiveDiscussionId(newDisc.id);
          setMessages(newDisc.messages);

          await fetch("/api/discussions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newDisc),
          });
        }
      }

      const resDocs = await fetch("/api/documents");
      const docsData = await resDocs.json();
      if (docsData.success) {
        setUploadedFiles(docsData.files);
      }
    } catch (err) {
      console.error("Failed to switch subject:", err);
    }
  }

  // Handle "New Chat" button
  async function handleNewChat() {
    if (!studyContext) return;
    const welcomeMsg: Message = {
      role: "model",
      content: `Nouvelle discussion ouverte pour la matière **${studyContext.subjectLabel}**. \n\nPosez-moi votre question sur ce cours !`,
    };

    const newDisc: Discussion = {
      id: `disc-${Date.now()}`,
      title: `Discussion #${discussions.filter(d => d.subjectId === studyContext.subjectId).length + 1}`,
      subjectId: studyContext.subjectId,
      messages: [welcomeMsg],
    };

    setDiscussions((prev) => [newDisc, ...prev]);
    setActiveDiscussionId(newDisc.id);
    setMessages(newDisc.messages);
    setLeftSidebarOpen(false);

    try {
      await fetch("/api/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDisc),
      });
    } catch (err) {
      console.error("Failed to save new discussion:", err);
    }
  }

  // File Upload handling
  async function handleFileUpload(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setUploadedFiles((prev) => [data.file, ...prev]);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error("File upload failed:", err);
      alert("Erreur lors de l'upload du fichier : " + err.message);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }

  function handleFileDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }

  const handleToggleFile = async (id: string) => {
    const fileItem = uploadedFiles.find((f) => f.id === id);
    if (!fileItem) return;

    const newToggled = !fileItem.toggled;
    setUploadedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, toggled: newToggled } : f))
    );

    try {
      await fetch("/api/documents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, toggled: newToggled }),
      });
    } catch (err) {
      console.error("Failed to toggle file:", err);
    }
  };

  const handleDeleteFile = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
    try {
      await fetch(`/api/documents?id=${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to delete file:", err);
    }
  };

  const handleDeleteDiscussion = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!studyContext) return;
    
    let nextActiveId = activeDiscussionId;
    const filtered = discussions.filter((d) => d.subjectId === studyContext.subjectId);
    if (id === activeDiscussionId) {
      const idx = filtered.findIndex((d) => d.id === id);
      const nextActive = filtered[idx + 1] || filtered[idx - 1];
      nextActiveId = nextActive ? nextActive.id : "";
    }

    setDiscussions((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      if (nextActiveId) {
        const nextDisc = updated.find((d) => d.id === nextActiveId);
        if (nextDisc) {
          setMessages(nextDisc.messages);
        }
      } else {
        setMessages([]);
      }
      return updated;
    });
    setActiveDiscussionId(nextActiveId);

    try {
      await fetch(`/api/discussions/${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to delete discussion:", err);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const suggestions = [
    {
      label: `Axes principaux de ${studyContext.subjectLabel}`,
      text: `Quels sont les axes principaux de la matière ${studyContext.subjectLabel} et comment puis-je me préparer pour l'examen ?`,
    },
    {
      label: `Résumer le cours`,
      text: `Veuillez me fournir un résumé clair et concis des concepts clés du cours de ${studyContext.subjectLabel}.`,
    }
  ];

  return (
    <div className="h-screen bg-background text-primary flex overflow-hidden font-sans relative">
      {/* Mobile Backdrops */}
      {(leftSidebarOpen || rightSidebarOpen) && (
        <div
          onClick={() => {
            setLeftSidebarOpen(false);
            setRightSidebarOpen(false);
          }}
          className="fixed inset-0 bg-[#0F172A]/20 z-30 lg:hidden"
        />
      )}

      {/* LEFT ASIDE: Chat History Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-surface border-r border-[#E2E8F0] flex flex-col justify-between h-full transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
          leftSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } shadow-subtle`}
      >
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Sidebar Header */}
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <span className="font-serif text-lg font-bold tracking-tight text-primary">mgscholar.ai</span>
            <button
              onClick={() => setLeftSidebarOpen(false)}
              className="lg:hidden text-secondary hover:text-primary text-xs font-semibold"
            >
              Fermer
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-4 border-b border-[#E2E8F0]/50">
            <button
              onClick={handleNewChat}
              className="w-full rounded-md bg-primary py-2 text-xs font-semibold text-white hover:bg-[#162D4A] transition-colors shadow-subtle cursor-pointer text-center"
            >
              + Nouvelle discussion
            </button>
          </div>

          {/* Discussions List */}
          <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-secondary/60 mb-2">
              Discussions récentes
            </p>
            {discussions
              .filter((d) => d.subjectId === studyContext.subjectId)
              .map((d) => {
                const isActive = d.id === activeDiscussionId;
                return (
                  <div
                    key={d.id}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-sm border-l-2 transition-colors ${
                      isActive
                        ? "bg-[#EFF6FF] text-primary border-primary"
                        : "bg-transparent text-primary/80 border-transparent hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <button
                      onClick={() => handleSelectDiscussion(d.id)}
                      className="text-left text-xs font-medium truncate flex-1 cursor-pointer flex items-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5 text-primary/70 fill-none stroke-current flex-shrink-0" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="truncate">{d.title}</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteDiscussion(e, d.id)}
                      className="w-4 h-4 flex items-center justify-center rounded-sm text-secondary hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                );
              })}
          </div>
        </div>

        {/* User Session Footer */}
        <div className="border-t border-[#E2E8F0] p-4 bg-[#F8FAFC] flex flex-col gap-2">
          <div className="flex items-center gap-2.5 px-1 py-1.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary border border-primary/20">
              U
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-bold text-primary truncate">Étudiant</span>
              <span className="text-[10px] text-secondary truncate">Semestre {studyContext.semester}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => setActiveModal("profile")}
              className="text-center rounded-sm border border-[#CBD5E1] bg-surface py-1 text-[11px] font-semibold text-primary hover:bg-[#EFF6FF]/40 cursor-pointer"
            >
              Profil
            </button>
            <button
              onClick={() => setActiveModal("settings")}
              className="text-center rounded-sm border border-[#CBD5E1] bg-surface py-1 text-[11px] font-semibold text-primary hover:bg-[#EFF6FF]/40 cursor-pointer"
            >
              Réglages
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full text-center rounded-sm border border-red-200 bg-red-50 py-1.5 text-xs font-semibold text-error hover:bg-red-100 transition-colors cursor-pointer mt-1"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* CENTER PANE: Conversational Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-surface border-b border-[#E2E8F0] shadow-subtle z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Toggle Left Sidebar on Mobile */}
            <button
              onClick={() => setLeftSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-md border border-[#CBD5E1] text-primary hover:bg-[#F1F5F9] cursor-pointer flex items-center justify-center"
              aria-label="Menu"
            >
              <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2.5">
              {selectedUniv?.logo && (
                <img
                  src={`/univ-logos/${selectedUniv.logo}`}
                  alt=""
                  className="w-8 h-8 object-contain bg-white p-0.5 border border-[#E2E8F0] rounded-sm flex-shrink-0"
                />
              )}
              <div className="flex flex-col">
                <span className="font-serif text-sm font-bold tracking-tight text-primary">
                  {studyContext.subjectLabel}
                </span>
                <span className="text-[10px] text-secondary font-medium uppercase tracking-wide">
                  {studyContext.universityLabel} — S{studyContext.semester}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Right Drawer on Mobile */}
            <button
              onClick={() => setRightSidebarOpen(true)}
              className="lg:hidden rounded-md border border-[#CBD5E1] px-3 py-1.5 text-xs font-semibold text-primary hover:bg-[#F1F5F9] cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Polycopiés
            </button>
            <Link
              href="/onboarding"
              className="rounded-md border border-[#CBD5E1] px-3 py-1.5 text-xs font-semibold text-primary hover:bg-[#F1F5F9] transition-colors"
            >
              Matières
            </Link>
          </div>
        </header>

        {/* Scrollable conversation thread */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-background flex flex-col justify-between">
          <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-between">
            
            {/* Subject Tabs Switcher */}
            <div className="flex flex-wrap gap-1.5 mb-6 border-b border-[#E2E8F0]/60 pb-3">
              {(studyContext.selectedSubjectIds || [studyContext.subjectId]).map((subId) => {
                const isActive = studyContext.subjectId === subId;
                const subData = getSubjectById(studyContext.universityId, studyContext.branchId, subId);
                const label = subData ? getTranslation(language, subData.labelKey as TranslationKey) : subId;
                return (
                  <button
                    key={subId}
                    onClick={() => handleSwitchSubject(subId)}
                    className={`px-3 py-1 rounded-sm text-[10px] font-bold border transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#EFF6FF] border-primary text-primary"
                        : "bg-surface border-[#CBD5E1]/70 text-secondary hover:bg-[#F8FAFC]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mb-4 rounded-md border border-error bg-red-50 p-3.5 text-error text-xs shadow-subtle">
                <p className="font-bold mb-1">⚠️ Erreur de configuration</p>
                <p className="mb-2 font-medium">{error}</p>
                <p className="text-[10px] opacity-90 leading-relaxed">
                  Veuillez spécifier votre clé <code>GEMINI_API_KEY</code> dans le fichier <code>.env.local</code> et relancer le serveur.
                </p>
              </div>
            )}

            {/* Message Cards */}
            <div className="space-y-4 mb-6 flex-1">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[90%] rounded-md border px-4 py-3 shadow-subtle ${chatFontSize} ${chatLineHeight} ${
                      msg.role === "user"
                        ? "bg-[#EFF6FF] border-[#CBD5E1] text-primary"
                        : "bg-surface border-[#E2E8F0] text-primary"
                    }`}
                  >
                    {msg.role === "model" ? (
                      <div className="whitespace-pre-line text-primary opacity-95">
                        {parseMarkdown(msg.content)}
                      </div>
                    ) : (
                      <p className="font-semibold">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading dots */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-md border border-[#E2E8F0] bg-surface shadow-subtle px-4 py-3">
                    <div className="flex items-center gap-1.5 py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Chips */}
            {messages.length === 1 && !isLoading && (
              <div className="grid grid-cols-1 gap-2 mb-6">
                {suggestions.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendMessage(sug.text)}
                    className="w-full text-left rounded-md border border-[#CBD5E1] bg-surface hover:bg-[#F8FAFC] px-3.5 py-3 text-xs font-semibold text-primary transition-all cursor-pointer shadow-subtle hover:border-primary/50 flex items-center gap-2.5"
                  >
                    {i === 0 ? (
                      <svg className="w-4 h-4 text-primary/70 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8M12 3a7 7 0 00-7 7c0 2.4 1.2 4.5 3 5.8V17a1 1 0 001 1h6a1 1 0 001-1v-1.2c1.8-1.3 3-3.4 3-5.8a7 7 0 00-7-7z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-primary/70 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    <span>{sug.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Input Box */}
            <form onSubmit={handleSubmit} className="relative sticky bottom-0 bg-background pt-2 flex-shrink-0">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                placeholder="Posez votre question sur ce cours..."
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
          </div>
        </div>
      </div>

      {/* RIGHT ASIDE: Documents & Polycopiés Drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 w-64 bg-surface border-l border-[#E2E8F0] flex flex-col p-4 h-full transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
          rightSidebarOpen ? "translate-x-0" : "translate-x-full"
        } shadow-subtle flex-shrink-0`}
      >
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4">
          <span className="font-serif text-sm font-bold text-primary flex items-center gap-1.5">
            <svg className="w-4 h-4 text-primary fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Polycopiés du cours
          </span>
          <button
            onClick={() => setRightSidebarOpen(false)}
            className="lg:hidden text-secondary hover:text-primary text-xs font-semibold"
          >
            Fermer
          </button>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragging
              ? "border-primary bg-[#EFF6FF]/40"
              : "border-[#CBD5E1] hover:border-primary/60 bg-background/40"
          }`}
        >
          <svg className="w-6 h-6 text-secondary mb-1.5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-xs font-semibold text-primary mb-0.5">Importer un cours</p>
          <p className="text-[10px] text-secondary">Glissez un PDF ou cliquez ici</p>
          <input
            type="file"
            accept=".pdf,.txt,.docx"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {/* Uploaded Files list */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-secondary/60 mb-2">
            Documents actifs ({uploadedFiles.filter((f) => f.toggled).length})
          </p>
          
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              onClick={() => handleToggleFile(file.id)}
              className={`border rounded-md p-2.5 cursor-pointer transition-all flex items-start justify-between ${
                file.toggled
                  ? "bg-surface border-primary shadow-subtle opacity-100"
                  : "bg-surface border-[#E2E8F0] opacity-50 shadow-subtle hover:opacity-75"
              }`}
            >
              <div className="flex items-start gap-2 max-w-[70%]">
                <svg className="w-3.5 h-3.5 text-primary mt-0.5 fill-none stroke-current flex-shrink-0" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="flex flex-col truncate">
                  <span className="text-xs font-medium text-primary truncate leading-tight">
                    {file.name}
                  </span>
                  <span className="text-[9px] text-secondary mt-0.5">
                    {file.size}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                <button
                  onClick={(e) => handleDeleteFile(e, file.id)}
                  className="w-4 h-4 flex items-center justify-center rounded-sm text-secondary hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Supprimer"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <div
                  className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center text-[8px] ${
                    file.toggled
                      ? "bg-primary border-primary text-white font-bold"
                      : "bg-transparent border-[#CBD5E1]"
                  }`}
                >
                  {file.toggled && "✓"}
                </div>
              </div>
            </div>
          ))}
          {uploadedFiles.length === 0 && (
            <p className="text-[11px] text-secondary text-center py-6 leading-relaxed">
              Aucun polycopié importé. Vos questions recevront des réponses génériques de la matière.
            </p>
          )}
        </div>
      </aside>

      {/* MODALS: Profile & Settings */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-4">
          <div className="bg-surface border border-[#E2E8F0] rounded-md shadow-overlay max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start border-b border-[#E2E8F0] pb-3 mb-4">
              <h3 className="font-serif text-sm font-bold text-primary">
                {activeModal === "profile" ? "Profil Étudiant" : "Réglages de la plateforme"}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-xs font-bold text-secondary hover:text-primary cursor-pointer"
              >
                Fermer
              </button>
            </div>

            {activeModal === "profile" ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-3 bg-[#F8FAFC] p-3 rounded-md border border-[#E2E8F0]">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-sm text-primary">
                    U
                  </div>
                  <div>
                    <h4 className="font-bold text-primary">Étudiant</h4>
                    <p className="text-secondary text-[10px]">{studyContext.universityLabel}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p><strong>Filière :</strong> {studyContext.branchLabel}</p>
                  <p><strong>Niveau d'études :</strong> Semestre {studyContext.semester}</p>
                  <p><strong>Matières configurées :</strong> {(studyContext.selectedSubjectIds || []).length} modules actifs</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <span className="block font-bold text-primary">Langue de l'interface</span>
                  <div className="flex gap-2">
                    <span className="px-2.5 py-1 rounded-sm text-[10px] font-bold bg-[#EFF6FF] text-primary border border-primary">
                      FRANÇAIS (FR)
                    </span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-[#E2E8F0] pt-3">
                  <span className="block font-bold text-primary">Taille du texte</span>
                  <div className="flex gap-2">
                    {[
                      { label: "Petit", value: "text-[11px]" },
                      { label: "Moyen", value: "text-[13px]" },
                      { label: "Grand", value: "text-[15px]" }
                    ].map((sz) => (
                      <button
                        key={sz.value}
                        onClick={() => handleUpdateFontSize(sz.value as any)}
                        className={`px-2.5 py-1 rounded-sm border text-[10px] font-medium transition-colors cursor-pointer ${
                          chatFontSize === sz.value
                            ? "bg-primary text-white border-primary"
                            : "bg-transparent border-[#CBD5E1] text-secondary hover:border-primary hover:text-primary"
                        }`}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 border-t border-[#E2E8F0] pt-3">
                  <span className="block font-bold text-primary">Espacement des lignes</span>
                  <div className="flex gap-2">
                    {[
                      { label: "Compact", value: "leading-tight" },
                      { label: "Normal", value: "leading-normal" },
                      { label: "Aéré", value: "leading-relaxed" }
                    ].map((lh) => (
                      <button
                        key={lh.value}
                        onClick={() => handleUpdateLineHeight(lh.value as any)}
                        className={`px-2.5 py-1 rounded-sm border text-[10px] font-medium transition-colors cursor-pointer ${
                          chatLineHeight === lh.value
                            ? "bg-primary text-white border-primary"
                            : "bg-transparent border-[#CBD5E1] text-secondary hover:border-primary hover:text-primary"
                        }`}
                      >
                        {lh.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 border-t border-[#E2E8F0] pt-3">
                  <span className="block font-bold text-primary">Paramètres d'étude</span>
                  <p className="text-secondary text-[10px] leading-relaxed">
                    Les explications d'étude et les corrections d'examens générées par l'IA tutorielle sont configurées spécifiquement pour le programme officiel de votre établissement.
                  </p>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setActiveModal(null)}
              className="mt-6 w-full rounded-md bg-primary py-2 text-xs font-semibold text-white hover:bg-[#162D4A] cursor-pointer text-center"
            >
              D'accord
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
