import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteDiscussion } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    await deleteDiscussion(id, user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete discussion error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la suppression de la discussion." },
      { status: 500 }
    );
  }
}
