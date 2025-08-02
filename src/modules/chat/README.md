# Chat Module

Module này xử lý tất cả các chức năng liên quan đến chat giữa user và admin trong hệ thống.

## Tính năng

- Chat real-time giữa user và admin
- Lưu trữ tin nhắn trong database
- Typing indicators
- Message read status
- Room-based chat (cho tương lai)
- Socket management

## Cấu trúc

```
chat/
├── dto/
│   └── chat-message.dto.ts          # Data Transfer Objects
├── entities/
│   └── chat-message.entity.ts       # Chat message entity
├── interfaces/
│   └── chat.interface.ts            # TypeScript interfaces
├── chat.controller.ts               # REST API endpoints
├── chat.service.ts                  # Business logic
├── chat.module.ts                   # Module configuration
└── README.md                        # Documentation
```

## API Endpoints

### GET /chat/messages

Lấy danh sách tin nhắn chat

- Query params: `otherUserId`, `roomId`

### POST /chat/messages

Tạo tin nhắn mới

### PUT /chat/messages/:messageId/read

Đánh dấu tin nhắn đã đọc

### GET /chat/unread-count

Lấy số lượng tin nhắn chưa đọc

### GET /chat/recent

Lấy tin nhắn gần đây

- Query params: `limit` (default: 10)

## WebSocket Events

### Client to Server

- `chat:message` - Gửi tin nhắn
- `chat:typing` - Typing indicator
- `chat:read` - Đánh dấu đã đọc
- `room:join` - Tham gia room
- `room:leave` - Rời room
- `room:create` - Tạo room mới

### Server to Client

- `chat:message` - Tin nhắn mới
- `chat:typing` - Typing status
- `chat:read` - Read status
- `room:join` - User tham gia room
- `room:leave` - User rời room
- `room:create` - Room được tạo

## Sử dụng trong code

```typescript
// Inject ChatService
constructor(private chatService: ChatService) {}

// Tạo tin nhắn
const message = await this.chatService.createChatMessage(senderId, {
  content: 'Hello!',
  receiverId: 'admin-id',
  type: MessageType.TEXT
});

// Lấy tin nhắn
const messages = await this.chatService.getChatMessages(userId, otherUserId);

// Đánh dấu đã đọc
await this.chatService.markMessageAsRead(messageId, userId);
```

## Tích hợp với WebSocket

Module này tích hợp với WebSocket module để cung cấp chat real-time. ChatService quản lý socket connections và WebSocket gateway xử lý các events.

## Database Schema

### ChatMessage Entity

- `id` - UUID primary key
- `senderId` - ID người gửi
- `receiverId` - ID người nhận (nullable)
- `content` - Nội dung tin nhắn
- `type` - Loại tin nhắn (text, image, file)
- `roomId` - ID room (nullable, cho group chat)
- `isRead` - Trạng thái đã đọc
- `createdAt` - Thời gian tạo
- `updatedAt` - Thời gian cập nhật

## Message Types

- `TEXT` - Tin nhắn văn bản
- `IMAGE` - Tin nhắn hình ảnh
- `FILE` - Tin nhắn file

## Socket Management

ChatService quản lý mapping giữa userId và socketId để có thể gửi tin nhắn real-time đến đúng user.
