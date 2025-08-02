import { NotificationType } from '../entities/notification.entity';

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  data?: any;
}

export interface NotificationEvent {
  userId: string;
  notification: any;
  socketId?: string;
}
