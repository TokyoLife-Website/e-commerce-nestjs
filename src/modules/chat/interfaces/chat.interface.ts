export interface ChatUser {
  userId: string;
  username: string;
  role: string;
  socketId: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  participants: string[];
  createdAt: Date;
}

export interface TypingStatus {
  userId: string;
  roomId?: string;
  isTyping: boolean;
}

export interface ChatEvent {
  type: 'message' | 'typing' | 'read' | 'join' | 'leave';
  data: any;
}
