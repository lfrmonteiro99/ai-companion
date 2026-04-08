import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  userId: z.string().uuid(),
  showMilestones: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ showMilestones: user.showMilestones });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, ...settings } = updateSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: userId },
      data: settings,
    });

    return NextResponse.json({ showMilestones: user.showMilestones });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
