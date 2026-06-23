import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("mgscholar_session")?.value;
    if (token) {
      await deleteSession(token);
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set("mgscholar_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne du serveur lors de la déconnexion." },
      { status: 500 }
    );
  }
}
