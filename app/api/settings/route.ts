import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  interests: z.array(z.string().max(50)).max(10).optional(),
  showMilestones: z.boolean().optional(),
  enableInitiative: z.boolean().optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const authId = req.nextUrl.searchParams.get("authId");

  let user;
  if (authId) {
    user = await prisma.user.findUnique({ where: { authId } });
  } else if (userId) {
    user = await prisma.user.findUnique({ where: { id: userId } });
  } else {
    return NextResponse.json({ error: "userId or authId required" }, { status: 400 });
  }

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    userId: user.id,
    displayName: user.displayName,
    bio: user.bio,
    interests: user.interests,
    showMilestones: user.showMilestones,
    enableInitiative: user.enableInitiative,
    quietHoursStart: user.quietHoursStart,
    quietHoursEnd: user.quietHoursEnd,
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, ...settings } = updateSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: userId },
      data: settings,
    });

    return NextResponse.json({
      showMilestones: user.showMilestones,
      enableInitiative: user.enableInitiative,
      quietHoursStart: user.quietHoursStart,
      quietHoursEnd: user.quietHoursEnd,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
