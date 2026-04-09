-- AlterTable: Add mode and scenarioId to Conversation
ALTER TABLE "Conversation" ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'practice';
ALTER TABLE "Conversation" ADD COLUMN "scenarioId" TEXT;

-- Drop old unique constraint on Conversation
DROP INDEX IF EXISTS "Conversation_userId_agentId_key";

-- CreateIndex: new indexes for Conversation
CREATE INDEX "Conversation_userId_agentId_mode_idx" ON "Conversation"("userId", "agentId", "mode");
CREATE INDEX "Conversation_userId_agentId_mode_scenarioId_idx" ON "Conversation"("userId", "agentId", "mode", "scenarioId");

-- CreateTable: Scenario
CREATE TABLE "Scenario" (
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

-- CreateIndex: Scenario
CREATE UNIQUE INDEX "Scenario_slug_key" ON "Scenario"("slug");
CREATE INDEX "Scenario_category_idx" ON "Scenario"("category");
CREATE INDEX "Scenario_difficulty_idx" ON "Scenario"("difficulty");

-- CreateTable: ScenarioAttempt
CREATE TABLE "ScenarioAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "score" JSONB,
    "feedback" JSONB,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScenarioAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: ScenarioAttempt
CREATE INDEX "ScenarioAttempt_userId_scenarioId_idx" ON "ScenarioAttempt"("userId", "scenarioId");
CREATE INDEX "ScenarioAttempt_userId_status_idx" ON "ScenarioAttempt"("userId", "status");

-- CreateTable: UserSkillScore
CREATE TABLE "UserSkillScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "warmth" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "curiosity" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "calibration" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "authenticity" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "pressureLevel" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "awkwardness" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "emotionalIntelligence" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "boundaryRespect" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "conversationalMomentum" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSkillScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: UserSkillScore
CREATE UNIQUE INDEX "UserSkillScore_userId_key" ON "UserSkillScore"("userId");

-- CreateTable: UserProgress
CREATE TABLE "UserProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "xpToNextLevel" INTEGER NOT NULL DEFAULT 100,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "scenariosCompleted" INTEGER NOT NULL DEFAULT 0,
    "achievements" JSONB NOT NULL DEFAULT '[]',
    "unlockedScenarios" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "unlockedAgents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "lastSessionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: UserProgress
CREATE UNIQUE INDEX "UserProgress_userId_key" ON "UserProgress"("userId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioAttempt" ADD CONSTRAINT "ScenarioAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioAttempt" ADD CONSTRAINT "ScenarioAttempt_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillScore" ADD CONSTRAINT "UserSkillScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
