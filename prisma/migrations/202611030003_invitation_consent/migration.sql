ALTER TABLE "ConnectProfile" ADD COLUMN "demoActivatedAt" TIMESTAMP(3);
ALTER TABLE "ConnectionRequest" ADD COLUMN "invitationId" TEXT,
 ADD COLUMN "invitationAlias" TEXT, ADD COLUMN "invitationSenderAlias" TEXT;
ALTER TABLE "ReferralClaim" ADD COLUMN "revokedAt" TIMESTAMP(3);
CREATE INDEX "ConnectionRequest_invitationId_idx" ON "ConnectionRequest"("invitationId");
ALTER TABLE "ConnectionRequest" ADD CONSTRAINT "ConnectionRequest_invitationId_fkey"
 FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConnectionRequest" ADD CONSTRAINT "ConnectionRequest_invitation_aliases" CHECK (
 "invitationId" IS NULL OR ("invitationAlias" IS NOT NULL AND "invitationSenderAlias" IS NOT NULL)
);
