-- Production-safe foundation for tables that were previously created manually.
-- This migration is intentionally idempotent for existing Supabase databases.

CREATE TABLE IF NOT EXISTS "SystemSetting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "companyName" TEXT NOT NULL DEFAULT 'Soul2Soul',
    "companyLogo" TEXT,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'MZN',
    "currencySymbol" TEXT NOT NULL DEFAULT 'MT',
    "decimalFormatting" INTEGER NOT NULL DEFAULT 2,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "User" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

INSERT INTO "SystemSetting" ("id", "companyName", "updatedAt")
VALUES (1, 'Soul2Soul', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
