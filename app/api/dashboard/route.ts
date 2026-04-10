import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/services/auth";
import { getDashboardViewModel } from "@/lib/services/dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getOrCreateUser(authUser);
    const dashboard = await getDashboardViewModel(user.id);

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error("[api/dashboard] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
