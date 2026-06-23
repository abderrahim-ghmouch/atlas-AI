import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, createUser } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Veuillez remplir tous les champs obligatoires." },
        { status: 400 }
      );
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "Cet e-mail est déjà associé à un compte." },
        { status: 400 }
      );
    }

    const userId = `user-${Date.now()}`;
    const passwordHash = hashPassword(password);
    await createUser(userId, name, email, passwordHash);

    return NextResponse.json({ success: true, user: { id: userId, name, email } });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne du serveur lors de l'inscription." },
      { status: 500 }
    );
  }
}
