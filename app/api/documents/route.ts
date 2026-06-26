import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserDocuments, addDocument, toggleDocument, deleteDocument, getStudyContext } from "@/lib/db";
import { vectorStore } from "@/lib/vector-store";
import { GoogleGenAI } from "@google/genai";

function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  // Clean whitespace/newlines for cleaner embeddings
  const cleanText = text.replace(/\s+/g, " ").trim();
  while (start < cleanText.length) {
    const end = Math.min(start + chunkSize, cleanText.length);
    chunks.push(cleanText.slice(start, end));
    start += chunkSize - overlap;
  }
  return chunks;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = (user as any).id;
    const list = await getUserDocuments(userId);
    return NextResponse.json({ success: true, files: list });
  } catch (error: any) {
    console.error("Fetch documents error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la récupération des documents." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = (user as any).id;
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    const docId = `file-${Date.now()}`;
    const name = file.name;
    const size = file.size;

    let content = "";
    const isTextFile = name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".json");

    if (isTextFile) {
      content = await file.text();
    } else if (name.endsWith(".pdf")) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const pdfImport = require("pdf-parse");
      const pdf = pdfImport.default || pdfImport;
      const parsed = await pdf(buffer);
      content = parsed.text;
    } else {
      return NextResponse.json(
        { error: "Format de fichier non pris en charge. Veuillez importer un fichier .pdf, .txt, ou .md." },
        { status: 400 }
      );
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Le fichier est vide ou n'a pas pu être lu." },
        { status: 400 }
      );
    }

    // 1. Chunk Text
    const chunks = chunkText(content, 1000, 200);

    // 2. Generate embeddings via Gemini SDK
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in .env.local");
    }
    const ai = new GoogleGenAI({ apiKey });

    const embeddings: number[][] = [];
    for (const chunk of chunks) {
      try {
        const response = await ai.models.embedContent({
          model: "text-embedding-004",
          contents: chunk,
        });
        const values = response.embeddings?.[0]?.values;
        if (values) {
          embeddings.push(values);
        }
      } catch (err) {
        console.error("Failed to generate embedding for chunk:", err);
      }
    }

    if (embeddings.length === 0) {
      throw new Error("Impossible de générer des embeddings vectoriels pour ce document.");
    }

    // 3. Upsert Chunks into the active Vector Database
    const vectorChunks = chunks.map((text, idx) => ({
      docId,
      userId,
      text,
      embedding: embeddings[idx],
      metadata: {
        fileName: name,
        chunkIndex: idx,
      },
    })).filter((vc) => vc.embedding && vc.embedding.length > 0);

    await vectorStore.upsertChunks(vectorChunks);

    // 4. Save metadata for listing in UI
    const sizeStr = (size / (1024 * 1024)).toFixed(1) + " MB";
    const newDoc = await addDocument(userId, docId, {
      name,
      size: sizeStr === "0.0 MB" ? `${(size / 1024).toFixed(0)} KB` : sizeStr,
      toggled: true,
      // Store a brief preview/header context rather than full raw text in primary DB
      content: content.slice(0, 1000) + (content.length > 1000 ? "..." : ""),
    });

    return NextResponse.json({ success: true, file: newDoc });
  } catch (error: any) {
    console.error("Upload document error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors du traitement du fichier." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = (user as any).id;
    const body = await req.json();
    const { id, toggled } = body;

    if (!id || typeof toggled !== "boolean") {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    await toggleDocument(id, toggled, userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Toggle document error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la modification de l'état du document." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = (user as any).id;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Identifiant du document manquant" }, { status: 400 });
    }

    // 1. Delete metadata from primary DB
    await deleteDocument(id, userId);

    // 2. Delete chunks from Vector Store
    await vectorStore.deleteDocumentChunks(id, userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la suppression du document." },
      { status: 500 }
    );
  }
}
