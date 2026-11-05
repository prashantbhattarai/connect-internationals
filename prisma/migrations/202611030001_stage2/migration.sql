-- CreateEnum
CREATE TYPE "ConnectionState" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'CLOSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "demoOrdinal" INTEGER,
    "nationality" TEXT,
    "city" TEXT,
    "university" TEXT,
    "major" TEXT,
    "interests" TEXT[],
    "purposes" TEXT[],
    "lookingFor" TEXT[],
    "canHelpWith" TEXT[],
    "targetRoles" TEXT[],
    "provenance" JSONB NOT NULL,
    "discoverable" BOOLEAN NOT NULL DEFAULT false,
    "showNationality" BOOLEAN NOT NULL DEFAULT false,
    "showCity" BOOLEAN NOT NULL DEFAULT false,
    "showUniversity" BOOLEAN NOT NULL DEFAULT false,
    "showMajor" BOOLEAN NOT NULL DEFAULT false,
    "nationalityPreference" BOOLEAN NOT NULL DEFAULT false,
    "consentSource" TEXT NOT NULL DEFAULT 'none',
    "consentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileDeletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileDeletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectionRequest" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "pairLow" TEXT NOT NULL,
    "pairHigh" TEXT NOT NULL,
    "state" "ConnectionState" NOT NULL DEFAULT 'PENDING',
    "purpose" TEXT NOT NULL,
    "note" VARCHAR(300) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "reason" VARCHAR(100) NOT NULL,
    "context" VARCHAR(2000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Circle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "starterActivity" TEXT NOT NULL,

    CONSTRAINT "Circle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CircleMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CircleMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "circleId" TEXT,
    "approvedAlias" TEXT NOT NULL,
    "message" VARCHAR(300) NOT NULL,
    "allowsIntroductions" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "ReferralClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageCounter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UsageCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConnectProfile_userId_key" ON "ConnectProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectProfile_demoOrdinal_key" ON "ConnectProfile"("demoOrdinal");

-- CreateIndex
CREATE INDEX "ConnectProfile_discoverable_idx" ON "ConnectProfile"("discoverable");

-- CreateIndex
CREATE INDEX "ConnectProfile_nationality_idx" ON "ConnectProfile"("nationality");

-- CreateIndex
CREATE INDEX "ConnectProfile_city_idx" ON "ConnectProfile"("city");

-- CreateIndex
CREATE INDEX "ConnectProfile_university_idx" ON "ConnectProfile"("university");

-- CreateIndex
CREATE INDEX "ConnectProfile_major_idx" ON "ConnectProfile"("major");

-- CreateIndex
CREATE INDEX "ConnectProfile_interests_idx" ON "ConnectProfile" USING GIN ("interests");

-- CreateIndex
CREATE INDEX "ConnectProfile_purposes_idx" ON "ConnectProfile" USING GIN ("purposes");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileDeletion_userId_key" ON "ProfileDeletion"("userId");

-- CreateIndex
CREATE INDEX "ConnectionRequest_senderId_state_createdAt_idx" ON "ConnectionRequest"("senderId", "state", "createdAt");

-- CreateIndex
CREATE INDEX "ConnectionRequest_recipientId_state_createdAt_idx" ON "ConnectionRequest"("recipientId", "state", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectionRequest_pairLow_pairHigh_key" ON "ConnectionRequest"("pairLow", "pairHigh");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_requestId_key" ON "Conversation"("requestId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_id_idx" ON "Message"("conversationId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Message_userId_createdAt_idx" ON "Message"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Block_blockedId_idx" ON "Block"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "Block_userId_blockedId_key" ON "Block"("userId", "blockedId");

-- CreateIndex
CREATE INDEX "Report_userId_createdAt_idx" ON "Report"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Report_subjectId_idx" ON "Report"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Circle_slug_key" ON "Circle"("slug");

-- CreateIndex
CREATE INDEX "CircleMembership_circleId_idx" ON "CircleMembership"("circleId");

-- CreateIndex
CREATE UNIQUE INDEX "CircleMembership_userId_circleId_key" ON "CircleMembership"("userId", "circleId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");

-- CreateIndex
CREATE INDEX "Invitation_userId_idx" ON "Invitation"("userId");

-- CreateIndex
CREATE INDEX "Invitation_circleId_idx" ON "Invitation"("circleId");

-- CreateIndex
CREATE INDEX "Invitation_expiresAt_idx" ON "Invitation"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralClaim_userId_key" ON "ReferralClaim"("userId");

-- CreateIndex
CREATE INDEX "ReferralClaim_invitationId_idx" ON "ReferralClaim"("invitationId");

-- CreateIndex
CREATE INDEX "UsageCounter_windowStart_idx" ON "UsageCounter"("windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "UsageCounter_userId_action_windowStart_key" ON "UsageCounter"("userId", "action", "windowStart");

-- AddForeignKey
ALTER TABLE "ConnectProfile" ADD CONSTRAINT "ConnectProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileDeletion" ADD CONSTRAINT "ProfileDeletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectionRequest" ADD CONSTRAINT "ConnectionRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectionRequest" ADD CONSTRAINT "ConnectionRequest_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ConnectionRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleMembership" ADD CONSTRAINT "CircleMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleMembership" ADD CONSTRAINT "CircleMembership_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralClaim" ADD CONSTRAINT "ReferralClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralClaim" ADD CONSTRAINT "ReferralClaim_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageCounter" ADD CONSTRAINT "UsageCounter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Canonical endpoints prevent reversed or fabricated duplicate pairs at the database boundary.
ALTER TABLE "ConnectionRequest" ADD CONSTRAINT "ConnectionRequest_canonical_pair" CHECK (
 "senderId" <> "recipientId" AND
 "pairLow" = LEAST("senderId", "recipientId") AND
 "pairHigh" = GREATEST("senderId", "recipientId")
);
ALTER TABLE "Block" ADD CONSTRAINT "Block_not_self" CHECK ("userId" <> "blockedId");
ALTER TABLE "UsageCounter" ADD CONSTRAINT "UsageCounter_nonnegative" CHECK ("count" >= 0);
