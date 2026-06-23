import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getStudyContext, saveStudyContext } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const studyContext = await getStudyContext(user.id);

    return NextResponse.json({
      success: true,
      user,
      studyContext,
    });
  } catch (error: any) {
    console.error("Fetch profile error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la récupération du profil." },
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

    const body = await req.json();
    const { studyContext } = body;

    if (!studyContext) {
      return NextResponse.json({ error: "Contexte d'études manquant" }, { status: 400 });
    }

    await saveStudyContext(user.id, studyContext);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Save study context error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la sauvegarde du contexte d'études." },
      { status: 500 }
    );
  }
}
