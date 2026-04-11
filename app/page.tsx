import { getAuthUser } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/services/auth";
import { getDashboardViewModel } from "@/lib/services/dashboard";
import ContinueTrainingCard from "./components/dashboard/ContinueTrainingCard";
import ProgressSnapshot from "./components/dashboard/ProgressSnapshot";
import TodaysPlan from "./components/dashboard/TodaysPlan";
import SkillFocusCard from "./components/dashboard/SkillFocusCard";
import RecentSessionsPanel from "./components/dashboard/RecentSessionsPanel";
import InsightsPanel from "./components/dashboard/InsightsPanel";
import SwitchCharacterBar from "./components/dashboard/SwitchCharacterBar";

export default async function Home() {
  const authUser = await getAuthUser();
  const dashboard = authUser
    ? await getDashboardViewModel((await getOrCreateUser(authUser)).id)
    : null;

  return (
    <div className="relative min-h-[calc(100vh-73px)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[500px] w-[600px] rounded-full bg-mira-500/[0.06] blur-[120px]" />
        <div className="absolute right-1/4 top-20 h-[400px] w-[500px] rounded-full bg-sable-500/[0.05] blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 h-[300px] w-[800px] -translate-x-1/2 rounded-full bg-valeria-500/[0.04] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 py-10">
        {!dashboard ? (
          <div className="rounded-2xl border border-base-500/40 bg-base-800/85 p-8 text-center backdrop-blur-md">
            <h1 className="mb-2 font-display text-3xl font-semibold text-base-50">
              Treina conversas sociais com propósito
            </h1>
            <p className="mx-auto max-w-xl text-base-300">
              Pratica comunicação, confiança e leitura social com 5 personalidades únicas num simulador gamificado com feedback detalhado.
            </p>
            <a
              href="/login"
              className="mt-5 inline-flex rounded-lg bg-mira-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-mira-400"
            >
              Entrar
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            <ContinueTrainingCard
              title={dashboard.continueTraining.title}
              subtitle={dashboard.continueTraining.subtitle}
              href={dashboard.continueTraining.href}
              updatedAt={dashboard.continueTraining.updatedAt}
            />
            <ProgressSnapshot {...dashboard.progressSnapshot} />
            <TodaysPlan actions={dashboard.todayPlan} />
            <SkillFocusCard
              label={dashboard.skillFocus.label}
              score={dashboard.skillFocus.score}
              recommendation={dashboard.skillFocus.recommendation}
              href={dashboard.skillFocus.href}
            />
            <RecentSessionsPanel sessions={dashboard.recentSessions} />
            <InsightsPanel insights={dashboard.insights} />
            <SwitchCharacterBar agents={dashboard.switchCharacter} />
          </div>
        )}
      </div>
    </div>
  );
}
