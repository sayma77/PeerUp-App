export type Message = {
  id: string;
  senderId: string;
  text: string;
  createdAt: string; // ISO string, converted from Firestore Timestamp
  read: boolean;
};

export type Conversation = {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  lastMessage: string;
  lastMessageAt: string | null;
  lastSenderId: string;
  unreadCount: number; // already resolved to "for the current user"
};