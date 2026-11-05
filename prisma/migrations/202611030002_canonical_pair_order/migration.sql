-- Match the ASCII ID ordering used by the application regardless of DB locale.
-- Preserve existing requests, IDs, conversations and messages.
BEGIN;
ALTER TABLE "ConnectionRequest" DROP CONSTRAINT "ConnectionRequest_canonical_pair";
UPDATE "ConnectionRequest"
SET "pairLow" = LEAST("senderId" COLLATE "C", "recipientId" COLLATE "C"),
    "pairHigh" = GREATEST("senderId" COLLATE "C", "recipientId" COLLATE "C");
ALTER TABLE "ConnectionRequest" ADD CONSTRAINT "ConnectionRequest_canonical_pair" CHECK (
 "senderId" <> "recipientId" AND
 "pairLow" = LEAST("senderId" COLLATE "C", "recipientId" COLLATE "C") AND
 "pairHigh" = GREATEST("senderId" COLLATE "C", "recipientId" COLLATE "C")
);
COMMIT;
