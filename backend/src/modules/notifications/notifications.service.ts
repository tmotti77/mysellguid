import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FirebaseService } from '../firebase/firebase.service';
import { User } from '../users/entities/user.entity';
import { Sale } from '../sales/entities/sale.entity';
import { Store } from '../stores/entities/store.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
    private firebaseService: FirebaseService,
  ) {}

  /**
   * Notify users about a new sale near their location
   * @param sale The new sale to notify about
   * @param radiusMeters Search radius in meters (default: 5000m / 5km)
   */
  async notifyNearbyUsers(sale: Sale, radiusMeters: number = 5000): Promise<void> {
    try {
      // Find users within radius who have FCM tokens
      const nearbyUsers = await this.findNearbyUsers(
        sale.latitude,
        sale.longitude,
        radiusMeters,
      );

      if (nearbyUsers.length === 0) {
        this.logger.log('No nearby users with FCM tokens found');
        return;
      }

      // Get store information
      const store = await this.storesRepository.findOne({
        where: { id: sale.storeId },
      });

      // Prepare notification payload
      const fcmTokens = nearbyUsers.map((user) => user.fcmToken).filter(Boolean);
      const result = await this.firebaseService.sendToDevices(fcmTokens, {
        title: `New Sale Near You! 🎉`,
        body: `${store?.name || 'A store'} has a new ${sale.discountPercentage}% off sale: ${sale.title}`,
        data: {
          type: 'new_sale',
          saleId: sale.id,
          storeId: sale.storeId,
          category: sale.category,
        },
        imageUrl: sale.images?.[0],
      });

      this.logger.log(
        `Notified ${result.successCount}/${fcmTokens.length} nearby users about new sale`,
      );
    } catch (error) {
      this.logger.error(`Failed to notify nearby users: ${error.message}`);
    }
  }

  /**
   * Notify a specific user about a sale
   */
  async notifyUser(
    userId: string,
    title: string,
    body: string,
    data?: { [key: string]: string },
  ): Promise<boolean> {
    try {
      const user = await this.usersRepository.findOne({ where: { id: userId } });

      if (!user?.fcmToken) {
        this.logger.warn(`User ${userId} does not have an FCM token`);
        return false;
      }

      return await this.firebaseService.sendToDevice(user.fcmToken, {
        title,
        body,
        data,
      });
    } catch (error) {
      this.logger.error(`Failed to notify user ${userId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Send a broadcast notification to a category topic
   */
  async notifyByCategory(
    category: string,
    title: string,
    body: string,
    data?: { [key: string]: string },
  ): Promise<boolean> {
    try {
      return await this.firebaseService.sendToTopic(`category_${category}`, {
        title,
        body,
        data,
      });
    } catch (error) {
      this.logger.error(
        `Failed to notify category ${category}: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Subscribe user to a category topic for notifications
   */
  async subscribeToCategory(userId: string, category: string): Promise<boolean> {
    try {
      const user = await this.usersRepository.findOne({ where: { id: userId } });

      if (!user?.fcmToken) {
        this.logger.warn(`User ${userId} does not have an FCM token`);
        return false;
      }

      return await this.firebaseService.subscribeToTopic(
        [user.fcmToken],
        `category_${category}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to subscribe user to category: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Unsubscribe user from a category topic
   */
  async unsubscribeFromCategory(
    userId: string,
    category: string,
  ): Promise<boolean> {
    try {
      const user = await this.usersRepository.findOne({ where: { id: userId } });

      if (!user?.fcmToken) {
        return false;
      }

      return await this.firebaseService.unsubscribeFromTopic(
        [user.fcmToken],
        `category_${category}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to unsubscribe user from category: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Find users within a radius of a location
   */
  private async findNearbyUsers(
    latitude: number,
    longitude: number,
    radiusMeters: number,
  ): Promise<User[]> {
    // PostGIS query to find users within radius
    const query = `
      SELECT *
      FROM users
      WHERE
        "defaultLatitude" IS NOT NULL
        AND "defaultLongitude" IS NOT NULL
        AND "fcmToken" IS NOT NULL
        AND "isActive" = true
        AND ST_DWithin(
          ST_SetSRID(ST_Point("defaultLongitude", "defaultLatitude"), 4326)::geography,
          ST_SetSRID(ST_Point($1, $2), 4326)::geography,
          $3
        )
    `;

    return this.usersRepository.query(query, [longitude, latitude, radiusMeters]);
  }

  /**
   * Test notification - useful for debugging
   */
  async sendTestNotification(userId: string): Promise<boolean> {
    return this.notifyUser(
      userId,
      'Test Notification',
      'This is a test push notification from MySellGuid!',
      { type: 'test' },
    );
  }
}
