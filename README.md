# AI Companion

A gamified social / dating conversation simulator. Users practice real
conversation skills — communication, confidence, timing, social reading, and
boundary respect — against five distinct AI personalities, each with their own
backstory, voice, and relational quirks.

This is **not** a "virtual girlfriend" fantasy app. It is a training
environment: you pick a character, enter a scenario, converse in real time,
and get scored on how the interaction actually went.

---

## Features

- **5 distinct AI characters** with hand-authored personas, voice styles,
  flaws, and opinions:
  - **Valeria** — dominant, sharp, provocative, hard to impress
  - **Luna** — warm, gentle, emotionally intuitive
  - **Mira** — reserved intellectual, dry wit, values depth
  - **Sable** — cryptic, mysterious, reveals herself in fragments
  - **Kira** — playful, chaotic, spontaneous, bold
- **Scenario-based practice** with objectives, success criteria, difficulty
  tiers, and time / message limits
- **Micro-exercises** targeting individual skills (tone, calibration,
  momentum, boundaries…)
- **Dynamic relationship state** per user ↔ agent pair — interest, trust,
  comfort, tension, respect, attachment, emotional openness, mood, stage
- **Long-term memory** — agents remember salient things the user said
- **Post-conversation evaluation** scoring confidence, warmth, curiosity,
  calibration, authenticity, pressure level, emotional intelligence,
  boundary respect, conversational momentum
- **Progression system** — XP, levels, streaks, unlockable scenarios and
  agents, achievements
- **Coaching & hints** with penalty bookkeeping so hint abuse is reflected
  in scores
- **Agent-initiated messages** via a daily cron (quiet hours respected)
- **Portuguese (pt-PT) UI** by default

---

## Tech stack

| Layer           | Tech                                              |
| --------------- | ------------------------------------------------- |
| Framework       | Next.js 14 (App Router) + React 18 + TypeScript   |
| Styling         | Tailwind CSS, Framer Motion, lucide-react         |
| Database        | PostgreSQL (Supabase) via Prisma ORM              |
| Auth            | Supabase Auth (`@supabase/ssr`)                   |
| LLM             | OpenAI (default model `gpt-4o`)                   |
| Validation      | Zod                                               |
| Hosting / cron  | Vercel (`vercel.json` defines the initiative cron)|

---

## Project layout

```
app/                    Next.js App Router
  page.tsx              Dashboard / landing
  agents/               Character selection + profile pages
  scenarios/            Scenario browser + runner
  exercises/            Micro-exercises
  chat/                 Chat UI
  history/              Past conversations
  analysis/             Replay + feedback views
  onboarding/           First-run flow
  profile/, settings/   User settings
  api/                  Route handlers
    chat/, scenarios/, micro-exercises/, evaluate/, feedback/,
    progress/, memories/, notifications/, dashboard/, cron/, …

lib/
  agents/               5 AgentConfig definitions (kira, luna, mira, sable, valeria)
  services/             Domain services (chat, coaching, evaluation, memory,
                        milestone, mood, progression, relationship, scenario,
                        scoring, stage, prompt-builder, llm, …)
  supabase/             Supabase server/client helpers
  prisma.ts             Prisma client singleton
  types/, data/, utils/, config.ts

prisma/
  schema.prisma         Data model (see below)
  migrations/
  seed.ts, seeds/       Scenario + micro-exercise seeds

docs/                   Internal planning & QA checklists
public/                 Static assets (avatars, icons)
middleware.ts           Auth middleware
```

## Data model (Prisma)

Core models: `User`, `Agent`, `Conversation`, `Message`, `RelationshipState`,
`Memory`, `Milestone`, `Notification`, `Scenario`, `ScenarioAttempt`,
`MicroExercise`, `MicroExerciseAttempt`, `UserSkillScore`, `UserProgress`.

See `prisma/schema.prisma` for the full schema.

---

## Getting started

### 1. Prerequisites

- Node.js 20+
- A Supabase project (Postgres + Auth)
- An OpenAI API key

### 2. Install

```bash
npm install
```

`postinstall` runs `prisma generate` automatically.

### 3. Configure environment

Copy the example env file and fill it in:

```bash
cp .env.example .env
```

Required variables:

| Variable                         | Purpose                                                    |
| -------------------------------- | ---------------------------------------------------------- |
| `DATABASE_URL`                   | Supabase transaction pooler (port 6543) — runtime queries  |
| `DIRECT_URL`                     | Supabase session pooler (port 5432) — migrations           |
| `NEXT_PUBLIC_SUPABASE_URL`       | Supabase project URL                                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Supabase anon public key                                   |
| `SUPABASE_SERVICE_ROLE_KEY`      | Service role key (used for account deletion)               |
| `OPENAI_API_KEY`                 | OpenAI API key                                             |
| `OPENAI_MODEL`                   | OpenAI model (defaults to `gpt-4o`)                        |

Notes:
- `DATABASE_URL` must include `?pgbouncer=true&connection_limit=1` for
  Supabase's Supavisor transaction mode.
- `DIRECT_URL` is only used by Prisma for migrations (needs prepared
  statements).

### 4. Database

```bash
npm run db:migrate   # apply migrations locally
npm run db:seed      # seed agents, scenarios, micro-exercises
# or, to wipe + reseed:
npm run db:reset
```

### 5. Run

```bash
npm run dev
```

Visit http://localhost:3000.

---

## Scripts

| Script              | What it does                                              |
| ------------------- | --------------------------------------------------------- |
| `npm run dev`       | Next.js dev server                                        |
| `npm run build`     | `prisma generate && prisma migrate deploy && next build`  |
| `npm run start`     | Production server                                         |
| `npm run lint`      | `next lint`                                               |
| `npm run db:migrate`| `prisma migrate dev`                                      |
| `npm run db:seed`   | `ts-node prisma/seed.ts`                                  |
| `npm run db:reset`  | `prisma migrate reset` (drops + reseeds)                  |

---

## Deployment

Built for Vercel. `vercel.json` registers a daily cron at 09:00 UTC hitting
`/api/cron/initiative`, which lets agents reach out first (subject to each
user's quiet-hours window). The `build` script runs `prisma migrate deploy`,
so migrations are applied at build time.

Make sure all environment variables above are set in the Vercel project
settings.

---

## Further reading

- `social_dating_conversation_simulator.md` — product positioning and
  pedagogical thesis
- `virtual_girlfriend_agents_plan.md` — agent design plan
- `docs/` — QA checklists and planning notes (dashboard v2, micro-exercises,
  real-time coaching, monetization, UI consistency)
