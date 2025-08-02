# Notification Module

Module này xử lý tất cả các chức năng liên quan đến notification trong hệ thống.

## Tính năng

- Tạo và gửi notification
- Lấy danh sách notification của user
- Đánh dấu notification đã đọc
- Xóa notification
- Real-time notification qua WebSocket

## Cấu trúc

```
notification/
├── dto/
│   └── notification.dto.ts          # Data Transfer Objects
├── entities/
│   └── notification.entity.ts       # Notification entity
├── interfaces/
│   └── notification.interface.ts    # TypeScript interfaces
├── notification.controller.ts       # REST API endpoints
├── notification.service.ts          # Business logic
├── notification.module.ts           # Module configuration
└── README.md                        # Documentation
```

## API Endpoints

### GET /notifications

Lấy danh sách notification của user hiện tại

### GET /notifications/unread

Lấy danh sách notification chưa đọc

### GET /notifications/count

Lấy số lượng notification chưa đọc

### GET /notifications/:id

Lấy thông tin chi tiết một notification

### POST /notifications

Tạo notification mới

### PUT /notifications/:id/read

Đánh dấu notification đã đọc

### PUT /notifications/read-all

Đánh dấu tất cả notification đã đọc

### DELETE /notifications/:id

Xóa notification

## WebSocket Events

### notification:new

Event được emit khi có notification mới

## Sử dụng trong code

```typescript
// Inject NotificationService
constructor(private notificationService: NotificationService) {}

// Gửi notification
await this.notificationService.sendNotificationToUser(userId, {
  title: 'Thông báo mới',
  message: 'Nội dung thông báo',
  type: NotificationType.INFO
});

// Lấy notification
const notifications = await this.notificationService.getNotifications(userId);
```

## Tích hợp với WebSocket

Module này tích hợp với WebSocket module để gửi real-time notification. Khi có notification mới, event `notification.created` sẽ được emit và WebSocket gateway sẽ gửi notification đến user tương ứng.
