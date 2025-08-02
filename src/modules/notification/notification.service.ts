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
    const savedNotification = await this.createNotification(notification);

    // Emit event để WebSocket Gateway có thể gửi real-time notification
    this.eventEmitter.emit('notification.created', {
      userId,
      notification: savedNotification,
    } as NotificationEvent);
  }

  async sendNotificationToUserWithSocketId(
    userId: string,
    notification: CreateNotificationDto,
    socketId: string,
  ): Promise<void> {
    const savedNotification = await this.createNotification(notification);

    // Emit event với socketId cụ thể
    this.eventEmitter.emit('notification.created', {
      userId,
      notification: savedNotification,
      socketId,
    } as NotificationEvent);
  }

  async getNotifications(userId: string, limit = 50): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
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

  async deleteNotification(notificationId: string): Promise<void> {
    await this.notificationRepository.delete({ id: notificationId });
  }

  async getNotificationCount(userId: string): Promise<number> {
    return await this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  async getNotificationById(
    notificationId: string,
  ): Promise<Notification | null> {
    return await this.notificationRepository.findOne({
      where: { id: notificationId },
    });
  }
}
