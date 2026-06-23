import { NextRequest } from "next/server";
import crypto from "crypto";
import { getSession, findUserById } from "./db";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return hash === testHash;
  } catch {
    return false;
  }
}

export async function getAuthenticatedUser(req: NextRequest) {
  const token = req.cookies.get("mgscholar_session")?.value;
  if (!token) return null;

  const session = await getSession(token);
  if (!session) return null;

  const user = await findUserById(session.userId);
  if (!user) return null;

  const { passwordHash, ...cleanUser } = user;
  return cleanUser;
}
