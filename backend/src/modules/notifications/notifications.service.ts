import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import axios from 'axios';

export interface PushNotificationPayload {
  to: string | string[];
  title: string;
  body: string;
  data?: any;
  sound?: string;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  async sendPushNotification(payload: PushNotificationPayload): Promise<void> {
    const tokens = Array.isArray(payload.to) ? payload.to : [payload.to];
    const validTokens = tokens.filter(token => token && token.startsWith('ExponentPushToken'));

    if (validTokens.length === 0) {
      this.logger.warn('No valid push tokens provided');
      return;
    }

    const messages = validTokens.map(token => ({
      to: token,
      sound: payload.sound || 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      badge: payload.badge,
      channelId: payload.channelId || 'default',
      priority: payload.priority || 'high',
    }));

    try {
      await axios.post(this.EXPO_PUSH_URL, messages, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      this.logger.log(`Sent ${validTokens.length} push notifications`);
    } catch (error) {
      this.logger.error('Failed to send push notifications:', error);
    }
  }

  async sendToUser(userId: string, title: string, body: string, data?: any): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user || !user.fcmToken) return;

    await this.sendPushNotification({ to: user.fcmToken, title, body, data });
  }

  async notifyNewSale(
    saleTitle: string,
    storeName: string,
    category: string,
    saleId: string,
    latitude: number,
    longitude: number,
    radius: number = 10000, // 10km default
    discountPercentage?: number
  ): Promise<void> {
    const users = await this.usersRepository
      .createQueryBuilder('user')
      .where("user.preferences->>'notificationEnabled' = 'true'")
      .andWhere('user.fcmToken IS NOT NULL')
      .andWhere(
        `ST_DWithin(
          ST_SetSRID(ST_Point(user."defaultLongitude", user."defaultLatitude"), 4326)::geography,
          ST_SetSRID(ST_Point(:longitude, :latitude), 4326)::geography,
          :radius
        )`,
        { longitude, latitude, radius }
      )
      .getMany();

    if (users.length === 0) return;

    const tokens = users.map(user => user.fcmToken).filter(token => token);
    const body = discountPercentage ? `${discountPercentage}% OFF at ${storeName}!` : `New sale at ${storeName}`;

    await this.sendPushNotification({
      to: tokens,
      title: saleTitle,
      body,
      data: { type: 'new_sale', saleId, category },
    });
  }
}
