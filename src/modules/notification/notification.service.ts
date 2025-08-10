import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/notification.dto';
import { NotificationEvent } from './interfaces/notification.interface';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private eventEmitter: EventEmitter2,
  ) {}

  async createNotification(data: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(data);
    return await this.notificationRepository.save(notification);
  }

  async sendNotificationToUser(
    userId: string,
    notification: CreateNotificationDto,
  ): Promise<void> {
    console.log('🔥 sendNotificationToUser', userId, notification);
    const savedNotification = await this.createNotification(notification);

    // Emit event để WebSocket Gateway có thể gửi real-time notification
    this.eventEmitter.emit('notification.created', {
      userId,
      notification: savedNotification,
    } as NotificationEvent);
  }

  async getNotifications(userId: string, limit = 50): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId },
      { isRead: true },
    );
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update({ userId }, { isRead: true });
  }
}
