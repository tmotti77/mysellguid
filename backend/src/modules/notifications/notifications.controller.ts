import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('test')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send test push notification to current user' })
  async sendTest(@Request() req) {
    await this.notificationsService.sendToUser(
      req.user.id,
      'Test Notification',
      'Push notifications are working!',
      { type: 'test' },
    );
    return { success: true, message: 'Test notification sent' };
  }
}
