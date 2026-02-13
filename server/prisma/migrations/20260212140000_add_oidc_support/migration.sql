-- AlterTable: Make password nullable and add OIDC fields to User
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "oidcId" TEXT;
ALTER TABLE "User" ADD COLUMN "oidcProvider" TEXT;

-- CreateIndex: Composite unique on oidcId + oidcProvider
CREATE UNIQUE INDEX "User_oidcId_oidcProvider_key" ON "User"("oidcId", "oidcProvider");

-- CreateTable: OidcState for storing OIDC flow state
CREATE TABLE "OidcState" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "codeVerifier" TEXT,
    "exchangeCode" TEXT,
    "userId" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OidcState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OidcState_state_key" ON "OidcState"("state");
CREATE UNIQUE INDEX "OidcState_exchangeCode_key" ON "OidcState"("exchangeCode");
CREATE INDEX "OidcState_state_idx" ON "OidcState"("state");
CREATE INDEX "OidcState_exchangeCode_idx" ON "OidcState"("exchangeCode");
CREATE INDEX "OidcState_expiresAt_idx" ON "OidcState"("expiresAt");
