BEGIN;
ALTER TABLE "Block" ADD COLUMN "label" VARCHAR(60) NOT NULL DEFAULT 'Blocked profile';
CREATE TABLE "InvitationRestriction" (
 "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "invitationId" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "InvitationRestriction_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InvitationRestriction_userId_invitationId_key" ON "InvitationRestriction"("userId","invitationId");
CREATE INDEX "InvitationRestriction_invitationId_idx" ON "InvitationRestriction"("invitationId");
ALTER TABLE "InvitationRestriction" ADD CONSTRAINT "InvitationRestriction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvitationRestriction" ADD CONSTRAINT "InvitationRestriction_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve pre-existing blocks as permanent exclusions on links already issued.
WITH pairs AS (
 SELECT "userId" AS creator, "blockedId" AS visitor FROM "Block"
 UNION SELECT "blockedId", "userId" FROM "Block"
)
INSERT INTO "InvitationRestriction" ("id","userId","invitationId")
SELECT 'c' || substr(md5(i."id" || '|' || p.visitor),1,24), p.visitor, i."id"
FROM pairs p JOIN "Invitation" i ON i."userId" = p.creator
ON CONFLICT ("userId","invitationId") DO NOTHING;
UPDATE "ConnectionRequest" r SET "state"='CLOSED', "updatedAt"=CURRENT_TIMESTAMP
WHERE r."state" IN ('PENDING','ACCEPTED') AND EXISTS (
 SELECT 1 FROM "Block" b WHERE
 (b."userId"=r."senderId" AND b."blockedId"=r."recipientId") OR
 (b."userId"=r."recipientId" AND b."blockedId"=r."senderId")
);
UPDATE "ReferralClaim" c SET "revokedAt"=CURRENT_TIMESTAMP,"acceptedAt"=NULL
FROM "Invitation" i WHERE c."invitationId"=i."id" AND EXISTS (
 SELECT 1 FROM "Block" b WHERE
 (b."userId"=c."userId" AND b."blockedId"=i."userId") OR
 (b."userId"=i."userId" AND b."blockedId"=c."userId")
);
COMMIT;
