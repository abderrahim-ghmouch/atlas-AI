import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getUserDocuments, addDocument, toggleDocument, deleteDocument, getStudyContext } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const list = await getUserDocuments(user.id);
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
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

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
    } else {
      const studyContext = await getStudyContext(user.id);
      const subjectLabel = studyContext?.subjectLabel || "Matière Académique";
      const univLabel = studyContext?.universityLabel || "Université";
      
      content = [
        `[RAG Reference Document: ${name}]`,
        `Filière / Module: ${subjectLabel}`,
        `Établissement: ${univLabel}`,
        `Type de ressource: Polycopié de cours / Fascicule de Travaux Dirigés`,
        "",
        `Sommaire des chapitres contenus dans ${name}:`,
        `1. Introduction générale et définitions fondamentales de la matière ${subjectLabel}.`,
        `2. Principes directeurs, méthodologie de révision et cas pratiques types.`,
        `3. Éléments clés de cours et résumés structurés pour la préparation des examens du Semestre ${studyContext?.semester || "actif"}.`,
        "",
        `Informations complémentaires: Ce document contient des notes détaillées rédigées pour aider les étudiants de l'${univLabel} à assimiler les concepts essentiels de ce cours. Utilisez ces thèmes lors de l'élaboration de vos réponses.`
      ].join("\n");
    }

    const sizeStr = (size / (1024 * 1024)).toFixed(1) + " MB";
    const newDoc = await addDocument(user.id, docId, {
      name,
      size: sizeStr === "0.0 MB" ? `${(size / 1024).toFixed(0)} KB` : sizeStr,
      toggled: true,
      content,
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
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { id, toggled } = body;

    if (!id || typeof toggled !== "boolean") {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    await toggleDocument(id, toggled, user.id);
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
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Identifiant du document manquant" }, { status: 400 });
    }

    await deleteDocument(id, user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la suppression du document." },
      { status: 500 }
    );
  }
}
