ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "mode" TEXT NOT NULL DEFAULT 'practice';
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "scenarioId" TEXT;

CREATE TABLE IF NOT EXISTS "Scenario" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'normal',
    "category" TEXT NOT NULL,
    "maxMessages" INTEGER,
    "timeLimit" INTEGER,
    "unlockRequirement" JSONB,
    "agentConstraints" JSONB,
    "successCriteria" JSONB NOT NULL,
    "tips" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Scenario_slug_key" ON "Scenario"("slug");
CREATE INDEX IF NOT EXISTS "Scenario_isActive_order_idx" ON "Scenario"("isActive", "order");
CREATE INDEX IF NOT EXISTS "Scenario_category_difficulty_idx" ON "Scenario"("category", "difficulty");

CREATE TABLE IF NOT EXISTS "ScenarioAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "score" JSONB,
    "feedback" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScenarioAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Conversation_mode_createdAt_idx" ON "Conversation"("mode", "createdAt");
CREATE INDEX IF NOT EXISTS "Conversation_scenarioId_idx" ON "Conversation"("scenarioId");
CREATE INDEX IF NOT EXISTS "ScenarioAttempt_userId_scenarioId_idx" ON "ScenarioAttempt"("userId", "scenarioId");
CREATE INDEX IF NOT EXISTS "ScenarioAttempt_userId_status_idx" ON "ScenarioAttempt"("userId", "status");
CREATE INDEX IF NOT EXISTS "ScenarioAttempt_conversationId_idx" ON "ScenarioAttempt"("conversationId");

DO $$ BEGIN
  ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ScenarioAttempt" ADD CONSTRAINT "ScenarioAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ScenarioAttempt" ADD CONSTRAINT "ScenarioAttempt_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ScenarioAttempt" ADD CONSTRAINT "ScenarioAttempt_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ScenarioAttempt" ADD CONSTRAINT "ScenarioAttempt_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
