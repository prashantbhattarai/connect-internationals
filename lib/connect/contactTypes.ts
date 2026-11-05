export type RequestState = "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "CLOSED";
export type Peer = { userId: string; alias: string };
export type Introduction = { id: string; direction: "incoming" | "outgoing"; peer: Peer | null; purpose: string | null; note: string | null; state: RequestState; createdAt: string; conversationId: string | null; canAccept: boolean };
export type RequestsResponse = { viewerId: string; items: Introduction[]; page: number; hasNext: boolean; canIntroduce: boolean };
export type ConversationItem = { id: string; peer: Peer; lastMessageAt: string | null };
export type ConversationsResponse = { viewerId: string; items: ConversationItem[]; page: number; hasNext: boolean };
export type ChatMessage = { id: string; sender: "you" | "peer"; text: string; createdAt: string };
export type MessagesResponse = { viewerId: string; conversationId: string; peer: Peer; items: ChatMessage[]; nextBefore: string | null; hasOlder: boolean };
