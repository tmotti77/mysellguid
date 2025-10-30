import { Controller, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('test')
  @ApiOperation({ summary: 'Send test notification to current user' })
  async sendTestNotification(@Request() req) {
    const success = await this.notificationsService.sendTestNotification(
      req.user.id,
    );
    return {
      success,
      message: success
        ? 'Test notification sent successfully'
        : 'Failed to send test notification. Check if FCM token is set.',
    };
  }

  @Post('subscribe/:category')
  @ApiOperation({ summary: 'Subscribe to category notifications' })
  async subscribeToCategory(@Request() req, @Param('category') category: string) {
    const success = await this.notificationsService.subscribeToCategory(
      req.user.id,
      category,
    );
    return {
      success,
      message: success
        ? `Subscribed to ${category} notifications`
        : 'Failed to subscribe. Check if FCM token is set.',
    };
  }

  @Post('unsubscribe/:category')
  @ApiOperation({ summary: 'Unsubscribe from category notifications' })
  async unsubscribeFromCategory(
    @Request() req,
    @Param('category') category: string,
  ) {
    const success = await this.notificationsService.unsubscribeFromCategory(
      req.user.id,
      category,
    );
    return {
      success,
      message: success
        ? `Unsubscribed from ${category} notifications`
        : 'Failed to unsubscribe',
    };
  }
}
