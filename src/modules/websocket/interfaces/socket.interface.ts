export interface SocketUser {
  userId: string;
  username: string;
  role: 'user' | 'admin';
  socketId: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId?: string; // null for broadcast messages
  content: string;
  type: 'text' | 'image' | 'file';
  timestamp: Date;
  isRead: boolean;
  roomId?: string; // for group chats
}

export interface NotificationMessage {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  data?: any;
  timestamp: Date;
  isRead: boolean;
}

export interface AIChatMessage {
  id: string;
  userId: string;
  userMessage: string;
  aiResponse: string;
  timestamp: Date;
  conversationId: string;
}

export interface SocketEvents {
  // Connection events
  'user:connect': (user: SocketUser) => void;
  'user:disconnect': (userId: string) => void;

  // Chat events
  'chat:message': (message: ChatMessage) => void;
  'chat:typing': (data: {
    userId: string;
    roomId?: string;
    isTyping: boolean;
  }) => void;
  'chat:read': (data: { messageId: string; userId: string }) => void;

  // Notification events
  'notification:new': (notification: NotificationMessage) => void;
  'notification:read': (notificationId: string) => void;
  'notification:readAll': (userId: string) => void;

  // AI Chat events
  'ai:message': (message: AIChatMessage) => void;
  'ai:typing': (data: { userId: string; isTyping: boolean }) => void;

  // Room events
  'room:join': (data: { userId: string; roomId: string }) => void;
  'room:leave': (data: { userId: string; roomId: string }) => void;
  'room:create': (data: {
    roomId: string;
    name: string;
    participants: string[];
  }) => void;
}

export interface ServerToClientEvents {
  // Chat events
  'chat:message': (message: ChatMessage) => void;
  'chat:typing': (data: {
    userId: string;
    roomId?: string;
    isTyping: boolean;
  }) => void;
  'chat:read': (data: { messageId: string; userId: string }) => void;

  // Notification events
  'notification:new': (notification: NotificationMessage) => void;
  'notification:read': (notificationId: string) => void;
  'notification:readAll': (userId: string) => void;

  // AI Chat events
  'ai:message': (message: AIChatMessage) => void;
  'ai:typing': (data: { userId: string; isTyping: boolean }) => void;

  // Room events
  'room:join': (data: { userId: string; roomId: string }) => void;
  'room:leave': (data: { userId: string; roomId: string }) => void;
  'room:create': (data: {
    roomId: string;
    name: string;
    participants: string[];
  }) => void;

  // System events
  'system:error': (error: { message: string; code: string }) => void;
  'system:success': (message: string) => void;
}

export interface ClientToServerEvents {
  // Connection events
  'user:connect': (user: SocketUser) => void;
  'user:disconnect': (userId: string) => void;

  // Chat events
  'chat:message': (
    message: Omit<ChatMessage, 'id' | 'timestamp' | 'isRead'>,
  ) => void;
  'chat:typing': (data: { roomId?: string; isTyping: boolean }) => void;
  'chat:read': (messageId: string) => void;

  // AI Chat events
  'ai:message': (userMessage: string) => void;
  'ai:typing': (isTyping: boolean) => void;

  // Room events
  'room:join': (roomId: string) => void;
  'room:leave': (roomId: string) => void;
  'room:create': (data: { name: string; participants: string[] }) => void;
}
