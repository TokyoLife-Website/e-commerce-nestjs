import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Role } from 'src/common/enum/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
@Roles(Role.Admin)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  async createNotification(
    @Body() createNotificationDto: CreateNotificationDto,
  ) {
    return await this.notificationService.createNotification(
      createNotificationDto,
    );
  }

  @Get()
  async getNotifications(@Request() req, @Query('limit') limit?: number) {
    const userId = req.user.id;
    return await this.notificationService.getNotifications(userId, limit);
  }

  @Put(':id/read')
  async markNotificationAsRead(@Param('id') id: string) {
    await this.notificationService.markNotificationAsRead(id);
    return { message: 'Notification marked as read' };
  }

  @Put('read-all')
  async markAllNotificationsAsRead(@Request() req) {
    const userId = req.user.id;
    await this.notificationService.markAllNotificationsAsRead(userId);
    return { message: 'All notifications marked as read' };
  }
}
