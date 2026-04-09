-- Add user profile fields
ALTER TABLE "User" ADD COLUMN "bio" TEXT;
ALTER TABLE "User" ADD COLUMN "interests" TEXT[] DEFAULT ARRAY[]::TEXT[];
