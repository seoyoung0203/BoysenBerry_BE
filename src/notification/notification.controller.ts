import {
  Controller,
  UseGuards,
  Req,
  Get,
  Put,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getNotifications(@Req() req) {
    const userId = req.user.id;
    return this.notificationService.getNotifications(userId);
  }

  @Put('/:id')
  @UseGuards(AuthGuard('jwt'))
  async readNotification(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const userId = req.user.id;
    return this.notificationService.markAsRead(id, userId);
  }
}
