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
  const { language, setLanguage } = useLanguage();
  const [studyContext, setStudyContext] = useState<StudyContext | null>(null);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Layout & Customization states
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeModal, setActiveModal] = useState<"profile" | "settings" | null>(null);
  const [chatFontSize, setChatFontSize] = useState<"text-[11px]" | "text-[13px]" | "text-[15px]">("text-[13px]");
  const [chatLineHeight, setChatLineHeight] = useState<"leading-tight" | "leading-normal" | "leading-relaxed">("leading-normal");
  const [theme, setTheme] = useState("cream");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const profileImageInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleUpdateFontSize = (size: "text-[11px]" | "text-[13px]" | "text-[15px]") => {
    setChatFontSize(size);
    localStorage.setItem("mgscholar-settings-font-size", size);
  };

  const handleUpdateLineHeight = (height: "leading-tight" | "leading-normal" | "leading-relaxed") => {
    setChatLineHeight(height);
    localStorage.setItem("mgscholar-settings-line-height", height);
  };

  const handleUpdateTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("mgscholar-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileImage(base64String);
        localStorage.setItem("mgscholar-profile-image", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(36, Math.min(textarea.scrollHeight, 200))}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
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

    const savedTheme = localStorage.getItem("mgscholar-theme") || "cream";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    const savedImage = localStorage.getItem("mgscholar-profile-image");
    if (savedImage) setProfileImage(savedImage);

    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }

    async function loadDashboardData() {
      try {
        const resMe = await fetch("/api/auth/me");
        if (resMe.status === 401) {
          router.replace("/login");
          return;
        }
        const meData = await resMe.json();
        if (meData.success) {
          setUserProfile(meData.user);
        }

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
    if (window.innerWidth < 1024) setSidebarOpen(false);
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
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
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
    if (window.innerWidth < 1024) setSidebarOpen(false);

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

  const renderInputArea = () => {
    return (
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative border border-brand-mint/20 rounded-xl bg-surface flex items-end p-1.5 focus-within:border-brand-mint transition-colors">
          {/* Integrated file upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg text-secondary hover:bg-brand-mint/10 hover:text-primary transition-colors flex-shrink-0 cursor-pointer"
            title={language === "fr" ? "Importer un cours" : "Import a course"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>

          {/* Auto-expanding textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={language === "fr" ? "Posez votre question sur ce cours..." : "Ask your question about this course..."}
            className="flex-1 resize-none bg-transparent outline-none py-2 px-3 text-xs text-primary placeholder:text-primary/30 max-h-[200px] min-h-[36px]"
          />

          {/* Send button inside the right side */}
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            aria-label="Envoyer"
            className="p-2 rounded-lg bg-accent-coral text-white hover:bg-[#E0503C]/95 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 cursor-pointer"
          >
            <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
            </svg>
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="h-screen bg-background text-primary flex overflow-hidden font-sans relative">
      {/* Mobile Backdrops */}
      {sidebarOpen && (
        <div
          onClick={() => {
            setSidebarOpen(false);
          }}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        />
      )}

      {/* LEFT ASIDE: Chat History Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-sidebar-bg border-r border-brand-mint/15 flex flex-col justify-between h-full transform transition-all duration-300 ease-in-out ${
          sidebarOpen
            ? "translate-x-0 w-64 lg:relative"
            : "-translate-x-full w-64 lg:w-0 lg:relative lg:translate-x-0 lg:border-r-0 lg:overflow-hidden"
        }`}
      >
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Sidebar Header */}
          <div className="px-5 py-4 border-b border-brand-mint/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="atlasai Logo"
                className="w-7 h-7 object-contain"
              />
              <span className="font-chelsea text-xl font-bold tracking-tight text-primary select-none">
                {getTranslation(language, "appName")}
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-secondary hover:text-primary text-xs font-semibold transition-colors duration-200"
            >
              {getTranslation(language, "close")}
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-4 border-b border-brand-mint/10">
            <button
              onClick={handleNewChat}
              className="w-full rounded-xl bg-brand-mint py-2 text-xs font-semibold text-white hover:bg-[#1B8074]/95 transition-colors cursor-pointer text-center"
            >
              {getTranslation(language, "newChat")}
            </button>
          </div>

          {/* Discussions List */}
          <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1.5">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-secondary/60 mb-2">
              {getTranslation(language, "recentDiscussions")}
            </p>
            {discussions
              .filter((d) => d.subjectId === studyContext.subjectId)
              .map((d) => {
                const isActive = d.id === activeDiscussionId;
                return (
                  <div
                    key={d.id}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl border-l-2 transition-colors ${
                      isActive
                        ? "bg-surface text-primary border-brand-mint"
                        : "bg-transparent text-primary/80 border-transparent hover:bg-surface/40"
                    }`}
                  >
                    <button
                      onClick={() => handleSelectDiscussion(d.id)}
                      className="text-left text-xs font-medium truncate flex-1 cursor-pointer flex items-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5 text-brand-mint fill-none stroke-current flex-shrink-0" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="truncate">{d.title}</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteDiscussion(e, d.id)}
                      className="w-4 h-4 flex items-center justify-center rounded-md text-secondary hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                );
              })}
          </div>
        </div>

        {/* User Session Footer */}
        <div className="border-t border-brand-mint/15 p-4 bg-sidebar-bg/60 flex flex-col gap-2">
          <div className="flex items-center gap-2.5 px-1 py-1.5">
            {profileImage ? (
              <img
                src={profileImage}
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover border border-brand-mint/20 flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-mint/10 flex items-center justify-center font-bold text-xs text-brand-mint border border-brand-mint/20 flex-shrink-0">
                U
              </div>
            )}
            <div className="flex flex-col truncate">
              <span className="text-xs font-bold text-primary truncate">
                {userProfile?.name || "Étudiant"}
              </span>
              <span className="text-[10px] text-secondary truncate">
                {getTranslation(language, "semester")} {studyContext.semester}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => setActiveModal("profile")}
              className="text-center rounded-xl border border-brand-mint/25 bg-surface py-1.5 text-[11px] font-semibold text-primary hover:bg-brand-mint/10 transition-colors cursor-pointer"
            >
              {getTranslation(language, "profile")}
            </button>
            <button
              onClick={() => setActiveModal("settings")}
              className="text-center rounded-xl border border-brand-mint/25 bg-surface py-1.5 text-[11px] font-semibold text-primary hover:bg-brand-mint/10 transition-colors cursor-pointer"
            >
              {getTranslation(language, "settings")}
            </button>
          </div>

          <Link
            href="/onboarding"
            className="text-center rounded-xl border border-brand-mint/25 bg-surface py-1.5 text-[11px] font-semibold text-brand-mint hover:bg-brand-mint/10 transition-colors block"
          >
            {getTranslation(language, "changeStudyContext")}
          </Link>

          <button
            onClick={handleLogout}
            className="w-full text-center rounded-xl border border-red-200 bg-red-50 py-1.5 text-xs font-semibold text-error hover:bg-red-100 transition-colors cursor-pointer"
          >
            {getTranslation(language, "logout")}
          </button>
        </div>
      </aside>

      {/* Floating mobile menu toggle button when sidebar is closed */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-xl border border-brand-mint/20 bg-surface text-primary hover:bg-brand-mint/5 cursor-pointer flex items-center justify-center transition-colors"
          aria-label="Open Menu"
        >
          <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      )}

      {/* CENTER PANE: Conversational Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Scrollable conversation thread or Empty Centered State */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background relative">
          {messages.length <= 1 ? (
            /* EMPTY STATE: Centered welcome query and input bar */
            <div className="flex-1 overflow-y-auto flex flex-col justify-center items-center px-6 py-12 max-w-2xl mx-auto w-full">
              <div className="text-center mb-8 flex flex-col items-center select-none">
                <img
                  src="/logo.png"
                  alt="atlasai Logo"
                  className="w-20 h-20 object-contain mb-5"
                />
                <h1 className="font-chelsea text-3xl font-bold tracking-wide text-primary mb-2">
                  atlasai
                </h1>
                <p className="text-base font-semibold text-secondary leading-relaxed">
                  {language === "fr" ? "Que souhaitez-vous étudier aujourd'hui ?" : "What would you like to study today?"}
                </p>
              </div>

              <div className="w-full">
                {renderInputArea()}
              </div>

              {messages.length === 1 && !isLoading && (
                <div className="grid grid-cols-1 gap-2 mt-6 w-full">
                  {suggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendMessage(sug.text)}
                      className="w-full text-left rounded-xl border border-brand-mint/20 bg-surface hover:bg-brand-mint/5 px-4 py-3 text-xs font-semibold text-primary transition-colors cursor-pointer"
                    >
                      <span className="truncate">{sug.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ACTIVE STATE: Scrollable history pane and sticky bottom input overlay */
            <div className="flex-1 flex flex-col overflow-hidden relative h-full">
              {/* Messages list */}
              <div className="flex-1 overflow-y-auto px-6 py-6 pb-28">
                <div className="max-w-2xl mx-auto w-full space-y-4">
                  {/* Subject Tabs Switcher */}
                  <div className="flex flex-wrap gap-1.5 mb-6 border-b border-brand-mint/10 pb-3">
                    {(studyContext.selectedSubjectIds || [studyContext.subjectId]).map((subId) => {
                      const isActive = studyContext.subjectId === subId;
                      const subData = getSubjectById(studyContext.universityId, studyContext.branchId, subId);
                      const label = subData ? getTranslation(language, subData.labelKey as TranslationKey) : subId;
                      return (
                        <button
                          key={subId}
                          onClick={() => handleSwitchSubject(subId)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-colors cursor-pointer ${
                            isActive
                              ? "bg-brand-mint/10 border-brand-mint text-brand-mint font-extrabold"
                              : "bg-surface border-brand-mint/10 text-secondary hover:bg-brand-mint/5 hover:text-primary"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Error Notification */}
                  {error && (
                    <div className="mb-4 rounded-2xl border border-accent-coral bg-red-50 p-4 text-accent-coral text-xs">
                      <p className="font-bold mb-1">⚠️ Erreur de configuration</p>
                      <p className="mb-2 font-medium">{error}</p>
                      <p className="text-[10px] opacity-90 leading-relaxed">
                        Veuillez spécifier votre clé <code>GEMINI_API_KEY</code> dans le fichier <code>.env.local</code> et relancer le serveur.
                      </p>
                    </div>
                  )}

                  {/* Conversation cards */}
                  <div className="space-y-4 mb-6">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl border px-4 py-3 ${chatFontSize} ${chatLineHeight} ${
                            msg.role === "user"
                              ? "bg-brand-mint/10 border-brand-mint/20 text-primary rounded-tr-none"
                              : "bg-surface border-brand-mint/10 text-primary rounded-tl-none"
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

                    {/* Skeleton Loader */}
                    {isLoading && (
                      <div className="flex justify-start w-full animate-pulse">
                        <div className="max-w-[80%] w-full rounded-2xl rounded-tl-none border border-brand-mint/10 bg-surface px-4 py-3.5 space-y-2">
                          <div className="h-2 bg-secondary/30 rounded-full w-2/3" />
                          <div className="h-2 bg-secondary/20 rounded-full w-5/6" />
                          <div className="h-2 bg-secondary/10 rounded-full w-1/2" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </div>

              {/* Bottom fixed input overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-6 pb-4 px-6 z-10 flex justify-center border-t border-brand-mint/5">
                <div className="max-w-2xl w-full">
                  {renderInputArea()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* MODALS: Profile & Settings */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface border border-brand-mint/15 rounded-2xl shadow-overlay max-w-lg w-full p-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start border-b border-brand-mint/10 pb-3 mb-4">
              <h3 className="font-serif text-sm font-bold text-primary">
                {activeModal === "profile" 
                  ? getTranslation(language, "studentProfile") 
                  : getTranslation(language, "platformSettings")}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-xs font-bold text-secondary hover:text-primary transition-colors duration-200 cursor-pointer"
              >
                {getTranslation(language, "close")}
              </button>
            </div>

            {activeModal === "profile" ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-3 bg-sidebar-bg/40 p-3.5 rounded-xl border border-brand-mint/10">
                  <div
                    onClick={() => profileImageInputRef.current?.click()}
                    className="relative w-12 h-12 rounded-full cursor-pointer overflow-hidden border border-brand-mint/20 group flex-shrink-0"
                  >
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-brand-mint/10 flex items-center justify-center font-bold text-base text-brand-mint">
                        U
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                      <span className="text-[8px] text-white font-extrabold select-none">
                        Modifier
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-primary">{userProfile?.name || "Étudiant"}</h4>
                    <p className="text-secondary text-[10px]">{studyContext.universityLabel}</p>
                  </div>
                </div>
                <div className="space-y-2 text-primary/80">
                  <p><strong>{getTranslation(language, "profileMajor")} :</strong> {studyContext.branchLabel}</p>
                  <p><strong>{getTranslation(language, "profileLevel")} :</strong> {getTranslation(language, "semester")} {studyContext.semester}</p>
                  <p><strong>{getTranslation(language, "profileActiveModules")} :</strong> {(studyContext.selectedSubjectIds || []).length} {getTranslation(language, "profileActiveModulesSuffix")}</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={profileImageInputRef}
                  onChange={handleProfileImageChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Language Switcher */}
                <div className="space-y-1.5">
                  <span className="block font-bold text-primary">{getTranslation(language, "interfaceLanguage")}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setLanguage("fr")}
                      className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-colors cursor-pointer ${
                        language === "fr"
                          ? "bg-brand-mint text-white border-brand-mint"
                          : "bg-transparent border-brand-mint/20 text-secondary hover:border-brand-mint hover:text-primary hover:bg-brand-mint/5"
                      }`}
                    >
                      FRANÇAIS (FR)
                    </button>
                    <button
                      onClick={() => setLanguage("en")}
                      className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-colors cursor-pointer ${
                        language === "en"
                          ? "bg-brand-mint text-white border-brand-mint"
                          : "bg-transparent border-brand-mint/20 text-secondary hover:border-brand-mint hover:text-primary hover:bg-brand-mint/5"
                      }`}
                    >
                      ENGLISH (EN)
                    </button>
                  </div>
                </div>

                {/* Theme Switcher */}
                <div className="space-y-2.5 border-t border-brand-mint/10 pt-3.5">
                  <span className="block font-bold text-primary">{getTranslation(language, "themeSelector")}</span>
                  <div className="flex gap-2">
                    {[
                      { label: "Cream", value: "cream" },
                      { label: "Dark Elephant", value: "dark" },
                      { label: "Nordic Ice", value: "nordic" }
                    ].map((t) => (
                      <button
                        key={t.value}
                        onClick={() => handleUpdateTheme(t.value)}
                        className={`px-3 py-1.5 rounded-xl border text-[10px] font-medium transition-colors cursor-pointer ${
                          theme === t.value
                            ? "bg-brand-mint text-white border-brand-mint"
                            : "bg-transparent border-brand-mint/20 text-secondary hover:border-brand-mint hover:text-primary hover:bg-brand-mint/5"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Size Switcher */}
                <div className="space-y-2.5 border-t border-brand-mint/10 pt-3.5">
                  <span className="block font-bold text-primary">{getTranslation(language, "textSize")}</span>
                  <div className="flex gap-2">
                    {[
                      { label: getTranslation(language, "textSmall"), value: "text-[11px]" },
                      { label: getTranslation(language, "textMedium"), value: "text-[13px]" },
                      { label: getTranslation(language, "textLarge"), value: "text-[15px]" }
                    ].map((sz) => (
                      <button
                        key={sz.value}
                        onClick={() => handleUpdateFontSize(sz.value as any)}
                        className={`px-3 py-1.5 rounded-xl border text-[10px] font-medium transition-colors cursor-pointer ${
                          chatFontSize === sz.value
                            ? "bg-brand-mint text-white border-brand-mint"
                            : "bg-transparent border-brand-mint/20 text-secondary hover:border-brand-mint hover:text-primary hover:bg-brand-mint/5"
                        }`}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Line Spacing Switcher */}
                <div className="space-y-2.5 border-t border-brand-mint/10 pt-3.5">
                  <span className="block font-bold text-primary">{getTranslation(language, "lineSpacing")}</span>
                  <div className="flex gap-2">
                    {[
                      { label: getTranslation(language, "spacingCompact"), value: "leading-tight" },
                      { label: getTranslation(language, "spacingNormal"), value: "leading-normal" },
                      { label: getTranslation(language, "spacingRelaxed"), value: "leading-relaxed" }
                    ].map((lh) => (
                      <button
                        key={lh.value}
                        onClick={() => handleUpdateLineHeight(lh.value as any)}
                        className={`px-3 py-1.5 rounded-xl border text-[10px] font-medium transition-colors cursor-pointer ${
                          chatLineHeight === lh.value
                            ? "bg-brand-mint text-white border-brand-mint"
                            : "bg-transparent border-brand-mint/20 text-secondary hover:border-brand-mint hover:text-primary hover:bg-brand-mint/5"
                        }`}
                      >
                        {lh.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-brand-mint/10 pt-3.5">
                  <span className="block font-bold text-primary">{getTranslation(language, "studySettings")}</span>
                  <p className="text-secondary text-[10px] leading-relaxed">
                    {getTranslation(language, "studySettingsDesc")}
                  </p>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setActiveModal(null)}
              className="mt-6 w-full rounded-xl bg-accent-coral py-2.5 text-xs font-semibold text-white hover:bg-[#E0503C]/95 transition-colors duration-200 cursor-pointer text-center"
            >
              {getTranslation(language, "okButton")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
