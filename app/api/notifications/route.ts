import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId, read: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}

const markReadSchema = z.object({
  notificationId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  markAll: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const body = markReadSchema.parse(await req.json());

    if (body.markAll && body.userId) {
      await prisma.notification.updateMany({
        where: { userId: body.userId, read: false },
        data: { read: true },
      });
    } else if (body.notificationId) {
      await prisma.notification.update({
        where: { id: body.notificationId },
        data: { read: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
