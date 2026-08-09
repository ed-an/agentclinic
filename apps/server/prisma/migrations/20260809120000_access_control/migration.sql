-- Phase 10 accounts use one role and enforce the Agent ownership link in SQLite.
CREATE TABLE "UserAccount" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "agentId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "UserAccount_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "UserAccount_email_normalized_check" CHECK ("email" = lower(trim("email")) AND length("email") > 3),
  CONSTRAINT "UserAccount_role_check" CHECK ("role" IN ('AGENT', 'STAFF')),
  CONSTRAINT "UserAccount_role_agent_check" CHECK (("role" = 'AGENT' AND "agentId" IS NOT NULL) OR ("role" = 'STAFF' AND "agentId" IS NULL)),
  CONSTRAINT "UserAccount_active_check" CHECK ("isActive" IN (0, 1))
);

CREATE UNIQUE INDEX "UserAccount_email_key" ON "UserAccount"("email");
CREATE UNIQUE INDEX "UserAccount_agentId_key" ON "UserAccount"("agentId");
CREATE INDEX "UserAccount_role_isActive_idx" ON "UserAccount"("role", "isActive");

CREATE TABLE "AuthSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "csrfTokenHash" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL,
  "expiresAt" DATETIME NOT NULL,
  "revokedAt" DATETIME,
  CONSTRAINT "AuthSession_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "UserAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AuthSession_expiry_check" CHECK ("expiresAt" > "createdAt"),
  CONSTRAINT "AuthSession_revocation_check" CHECK ("revokedAt" IS NULL OR "revokedAt" >= "createdAt")
);

CREATE UNIQUE INDEX "AuthSession_tokenHash_key" ON "AuthSession"("tokenHash");
CREATE UNIQUE INDEX "AuthSession_csrfTokenHash_key" ON "AuthSession"("csrfTokenHash");
CREATE INDEX "AuthSession_accountId_expiresAt_idx" ON "AuthSession"("accountId", "expiresAt");
