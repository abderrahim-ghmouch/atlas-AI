import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserDiscussions, saveDiscussion } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const list = await getUserDiscussions(user.id);
    return NextResponse.json({ success: true, discussions: list });
  } catch (error: any) {
    console.error("Fetch discussions error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la récupération des discussions." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { id, title, subjectId, messages } = body;

    if (!id || !title || !subjectId || !messages) {
      return NextResponse.json(
        { error: "Paramètres de discussion manquants dans le corps de la requête." },
        { status: 400 }
      );
    }

    const saved = await saveDiscussion(user.id, id, { title, subjectId, messages });
    return NextResponse.json({ success: true, discussion: saved });
  } catch (error: any) {
    console.error("Save discussion error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la sauvegarde de la discussion." },
      { status: 500 }
    );
  }
}
