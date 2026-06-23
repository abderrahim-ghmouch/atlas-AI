import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStudyContext, saveStudyContext } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = (user as any).id;
    const studyContext = await getStudyContext(userId);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
      },
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
    const session = await auth();
    const user = session?.user;
    if (!user || !user.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = (user as any).id;
    const body = await req.json();
    const { studyContext } = body;

    if (!studyContext) {
      return NextResponse.json({ error: "Contexte d'études manquant" }, { status: 400 });
    }

    await saveStudyContext(userId, studyContext);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Save study context error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la sauvegarde du contexte d'études." },
      { status: 500 }
    );
  }
}
