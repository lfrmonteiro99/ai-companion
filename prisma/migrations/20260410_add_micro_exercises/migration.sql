CREATE TABLE IF NOT EXISTS "MicroExercise" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "difficulty" TEXT NOT NULL DEFAULT 'normal',
  "targetSkill" TEXT NOT NULL,
  "options" JSONB,
  "answerKey" JSONB NOT NULL,
  "explanation" TEXT,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "order" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MicroExercise_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MicroExerciseAttempt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "exerciseId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'completed',
  "userAnswer" JSONB,
  "isCorrect" BOOLEAN,
  "rawScore" DOUBLE PRECISION,
  "adjustedScore" DOUBLE PRECISION,
  "rawXp" INTEGER NOT NULL DEFAULT 0,
  "xpEarned" INTEGER NOT NULL DEFAULT 0,
  "hintsUsed" INTEGER NOT NULL DEFAULT 0,
  "directHintUses" INTEGER NOT NULL DEFAULT 0,
  "hintPenaltyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "hintPenaltyXp" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MicroExerciseAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MicroExercise_slug_key" ON "MicroExercise"("slug");
CREATE INDEX IF NOT EXISTS "MicroExercise_isActive_order_idx" ON "MicroExercise"("isActive", "order");
CREATE INDEX IF NOT EXISTS "MicroExercise_type_difficulty_idx" ON "MicroExercise"("type", "difficulty");
CREATE INDEX IF NOT EXISTS "MicroExercise_targetSkill_difficulty_idx" ON "MicroExercise"("targetSkill", "difficulty");

CREATE INDEX IF NOT EXISTS "MicroExerciseAttempt_userId_createdAt_idx" ON "MicroExerciseAttempt"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "MicroExerciseAttempt_userId_exerciseId_idx" ON "MicroExerciseAttempt"("userId", "exerciseId");
CREATE INDEX IF NOT EXISTS "MicroExerciseAttempt_exerciseId_createdAt_idx" ON "MicroExerciseAttempt"("exerciseId", "createdAt");
CREATE INDEX IF NOT EXISTS "MicroExerciseAttempt_status_idx" ON "MicroExerciseAttempt"("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MicroExerciseAttempt_userId_fkey'
  ) THEN
    ALTER TABLE "MicroExerciseAttempt"
      ADD CONSTRAINT "MicroExerciseAttempt_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MicroExerciseAttempt_exerciseId_fkey'
  ) THEN
    ALTER TABLE "MicroExerciseAttempt"
      ADD CONSTRAINT "MicroExerciseAttempt_exerciseId_fkey"
      FOREIGN KEY ("exerciseId") REFERENCES "MicroExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
