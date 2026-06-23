import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { findUserByEmail, createUser, createSession } from "@/lib/db";
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

    const sessionToken = `sess-${crypto.randomBytes(24).toString("hex")}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await createSession(sessionToken, userId, expiresAt.toISOString());

    const response = NextResponse.json({ success: true, user: { id: userId, name, email } });

    response.cookies.set("mgscholar_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne du serveur lors de l'inscription." },
      { status: 500 }
    );
  }
}
