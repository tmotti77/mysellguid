import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send push notification to user' })
  async sendNotification(
    @Body() body: { userId: string; title: string; body: string },
  ) {
    return this.notificationsService.sendPushNotification(
      body.userId,
      body.title,
      body.body,
    );
  }

  @Post('geofence')
  @ApiOperation({ summary: 'Send notifications to nearby users' })
  async sendGeofenceNotification(
    @Body()
    body: {
      latitude: number;
      longitude: number;
      radius: number;
      title: string;
      body: string;
    },
  ) {
    return this.notificationsService.sendToNearbyUsers(
      body.latitude,
      body.longitude,
      body.radius,
      { title: body.title, body: body.body },
    );
  }
}
