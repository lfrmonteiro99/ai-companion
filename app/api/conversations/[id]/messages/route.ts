import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const before = searchParams.get("before"); // message ID — fetch older than this

    if (before) {
      // Fetch messages OLDER than the cursor (for infinite scroll up)
      const messages = await prisma.message.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: "desc" },
        take: limit,
        cursor: { id: before },
        skip: 1,
      });

      // Reverse to chronological order
      messages.reverse();

      return NextResponse.json({
        messages: messages.map((m) => ({
          id: m.id,
          senderRole: m.senderRole,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
        })),
        hasMore: messages.length === limit,
      });
    }

    // Default: fetch latest messages
    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    messages.reverse();

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        senderRole: m.senderRole,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
      hasMore: messages.length === limit,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
