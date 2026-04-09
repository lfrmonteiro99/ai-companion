import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const userId = req.nextUrl.searchParams.get("userId");

  if (!id || !userId) {
    return NextResponse.json({ error: "id and userId required" }, { status: 400 });
  }

  // Verify ownership
  const memory = await prisma.memory.findUnique({ where: { id } });
  if (!memory || memory.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.memory.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
