# WebSocket Module

Module này cung cấp chức năng real-time cho ứng dụng e-commerce bao gồm:

## Tính năng

### 1. Chat Real-time

- Chat giữa user và admin
- Chat nhóm (room-based)
- Typing indicators
- Message read status

### 2. Real-time Communication

- Real-time event handling
- WebSocket connection management
- User authentication và authorization

### 3. AI Chat

- Chat với DeepSeek AI (tương lai)
- Conversation management
- Message history

## Cài đặt

Module đã được tích hợp sẵn vào ứng dụng. Các dependencies cần thiết:

```bash
npm install @nestjs/websockets@^10.0.0 @nestjs/platform-socket.io@^10.0.0 socket.io@^4.0.0
```

## Cấu hình

### Environment Variables

```env
JWT_SECRET=your_jwt_secret
CLIENT_BASE_URL=http://localhost:3000
```

## Sử dụng

### WebSocket Connection

```javascript
// Frontend (JavaScript/TypeScript)
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your_jwt_token', // JWT token từ login
  },
});

// Listen for events
socket.on('chat:message', (message) => {
  console.log('New message:', message);
});

socket.on('notification:new', (notification) => {
  console.log('New notification:', notification);
});

// Send events
socket.emit('chat:message', {
  content: 'Hello!',
  receiverId: 'user_id', // hoặc roomId cho group chat
});

socket.emit('ai:message', {
  userMessage: 'Tell me about products',
});
```

### REST API Endpoints

#### Chat

- `GET /websocket/chat/messages` - Lấy tin nhắn
- `POST /websocket/chat/messages` - Gửi tin nhắn
- `PUT /websocket/chat/messages/:messageId/read` - Đánh dấu đã đọc

#### Notifications (đã chuyển sang Notification Module)

- `GET /notifications` - Lấy thông báo
- `POST /notifications` - Tạo thông báo
- `PUT /notifications/:notificationId/read` - Đánh dấu đã đọc
- `PUT /notifications/read-all` - Đánh dấu tất cả đã đọc

#### AI Chat

- `GET /websocket/ai/conversations` - Lấy danh sách cuộc trò chuyện
- `GET /websocket/ai/conversations/:conversationId/messages` - Lấy tin nhắn cuộc trò chuyện
- `POST /websocket/ai/messages` - Gửi tin nhắn AI

## Events

### Client to Server

- `chat:message` - Gửi tin nhắn
- `chat:typing` - Typing indicator
- `chat:read` - Đánh dấu đã đọc
- `ai:message` - Gửi tin nhắn AI
- `ai:typing` - AI typing indicator
- `room:join` - Tham gia room
- `room:leave` - Rời room
- `room:create` - Tạo room

### Server to Client

- `chat:message` - Tin nhắn mới
- `chat:typing` - Typing status
- `chat:read` - Read status
- `notification:new` - Thông báo mới
- `notification:read` - Notification read status
- `ai:message` - AI response
- `ai:typing` - AI typing status
- `room:join` - User joined room
- `room:leave` - User left room
- `room:create` - Room created
- `system:error` - System error
- `system:success` - System success

## Database Schema

### Chat Messages

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID,
  content TEXT NOT NULL,
  type ENUM('text', 'image', 'file') DEFAULT 'text',
  room_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
  data JSON,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### AI Chat

```sql
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  title VARCHAR(255),
  summary TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE ai_chat_messages (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_id UUID NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Tích hợp với Orders Module

### Notification khi tạo Order

Khi có order mới được tạo, hệ thống sẽ tự động gửi notification real-time cho tất cả admin:

```typescript
// Trong OrdersService.create()
await this.notifyAdminNewOrder(savedOrder);
```

Notification sẽ chứa:

- **Title**: "Đơn hàng mới"
- **Message**: Thông tin chi tiết về order
- **Data**:
  - orderId: ID của order
  - orderCode: Mã order
  - customerName: Tên khách hàng
  - amount: Tổng tiền
  - status: Trạng thái order
  - createdAt: Thời gian tạo

### Test Notification

1. **Chạy WebSocket test:**

```bash
node src/modules/websocket/test-notification.js
```

2. **Tạo order mới** qua API hoặc frontend

3. **Xem notification** trong console của test script

### Frontend Integration

```javascript
// Kết nối WebSocket với admin token
const socket = io('http://localhost:3000', {
  auth: { token: adminJwtToken },
});

// Listen for notifications
socket.on('notification:new', (notification) => {
  // Hiển thị notification
  showNotification(notification);

  // Cập nhật UI
  updateNotificationCount();
});
```

## Tích hợp DeepSeek AI (Tương lai)

Để tích hợp với DeepSeek AI, cần:

1. Cài đặt DeepSeek API client
2. Cấu hình API key
3. Cập nhật `processAIMessage` method trong `WebSocketService`
4. Xử lý streaming responses

```typescript
// Ví dụ tích hợp DeepSeek AI
async processAIMessage(userId: string, data: SendAIMessageDto): Promise<AIChatMessage> {
  // Gọi DeepSeek API
  const response = await deepseekClient.chat({
    messages: [{ role: 'user', content: data.userMessage }],
    model: 'deepseek-chat',
    stream: false
  });

  // Lưu vào database
  const aiMessage = this.aiChatMessageRepository.create({
    userId,
    conversationId: data.conversationId,
    userMessage: data.userMessage,
    aiResponse: response.choices[0].message.content,
    metadata: {
      model: 'deepseek-chat',
      tokens: response.usage.total_tokens,
      timestamp: new Date().toISOString(),
    },
  });

  return await this.aiChatMessageRepository.save(aiMessage);
}
```

## Security

- JWT authentication cho WebSocket connections
- Role-based access control
- Input validation với class-validator
- Rate limiting (có thể thêm)

## Performance

- In-memory socket mapping cho fast lookups
- Database indexing cho queries
- Connection pooling
- Message queuing cho high load
