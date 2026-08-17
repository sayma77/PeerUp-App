export type Message = {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  read: boolean;
};

export type Conversation = {
  id: string;
  partnerId: string;
  partnerName: string;
  messages: Message[];
};