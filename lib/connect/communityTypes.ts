import { StrangerCard } from "./types";
export type CircleSummary = { slug: string; name: string; purpose: string; starterActivity: string };
export type CircleView = CircleSummary & { joined: boolean; visibleMemberBand: string };
export type CircleResponse = { viewerId: string; circles: CircleView[] };
export type CircleMembers = { viewerId: string; circle: CircleSummary; items: StrangerCard[]; page: number; hasNext: boolean; visibleMemberBand: string };
export type PublicInvitation = { approvedAlias: string; message: string; circle: CircleSummary | null; allowsIntroductions: boolean };
export type InvitationStatus = { viewerId: string; isCreator: boolean; reservedNewcomer: boolean; activated: boolean; claimedHere: boolean; attributedElsewhere: boolean; canClaim: boolean; canIntroduce: boolean; relationship: string; circleJoined: boolean; circle: CircleSummary | null };
export type ManagedInvitation = PublicInvitation & { id: string; expiresAt: string; revokedAt: string | null; createdAt: string };
export type InvitationList = { viewerId: string; items: ManagedInvitation[]; page: number; hasNext: boolean };
