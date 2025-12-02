import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: { [key: string]: string };
  imageUrl?: string;
}

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private firebaseApp: admin.app.App;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    try {
      // Check if Firebase credentials are configured
      const serviceAccountPath = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH');
      const serviceAccountJson = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');

      if (serviceAccountPath || serviceAccountJson) {
        let serviceAccount;

        if (serviceAccountJson) {
          // Use JSON string from environment variable
          serviceAccount = JSON.parse(serviceAccountJson);
        } else if (serviceAccountPath) {
          // Use file path
          serviceAccount = require(serviceAccountPath);
        }

        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });

        this.logger.log('Firebase Admin SDK initialized successfully');
      } else {
        this.logger.warn(
          'Firebase credentials not configured. Push notifications will be disabled.',
        );
        this.logger.warn(
          'To enable push notifications, set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON in .env',
        );
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', error);
      this.logger.warn('Push notifications will be disabled');
    }
  }

  /**
   * Check if Firebase is initialized and ready to send notifications
   */
  isInitialized(): boolean {
    return !!this.firebaseApp;
  }

  /**
   * Send push notification to a single device
   */
  async sendToDevice(fcmToken: string, payload: PushNotificationPayload): Promise<boolean> {
    if (!this.isInitialized()) {
      this.logger.warn('Firebase not initialized, skipping notification');
      return false;
    }

    try {
      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              contentAvailable: true,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Notification sent successfully: ${response}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
      return false;
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendToDevices(
    fcmTokens: string[],
    payload: PushNotificationPayload,
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!this.isInitialized()) {
      this.logger.warn('Firebase not initialized, skipping notifications');
      return { successCount: 0, failureCount: fcmTokens.length };
    }

    if (fcmTokens.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens: fcmTokens,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              contentAvailable: true,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      this.logger.log(
        `Sent ${response.successCount}/${fcmTokens.length} notifications successfully`,
      );

      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            this.logger.error(`Failed to send to token ${fcmTokens[idx]}: ${resp.error?.message}`);
          }
        });
      }

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      this.logger.error(`Failed to send multicast notification: ${error.message}`);
      return { successCount: 0, failureCount: fcmTokens.length };
    }
  }

  /**
   * Send notification to a topic (for broadcast messages)
   */
  async sendToTopic(topic: string, payload: PushNotificationPayload): Promise<boolean> {
    if (!this.isInitialized()) {
      this.logger.warn('Firebase not initialized, skipping notification');
      return false;
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              contentAvailable: true,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Topic notification sent successfully: ${response}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send topic notification: ${error.message}`);
      return false;
    }
  }

  /**
   * Subscribe devices to a topic
   */
  async subscribeToTopic(fcmTokens: string[], topic: string): Promise<boolean> {
    if (!this.isInitialized()) {
      this.logger.warn('Firebase not initialized, cannot subscribe to topic');
      return false;
    }

    try {
      await admin.messaging().subscribeToTopic(fcmTokens, topic);
      this.logger.log(`Subscribed ${fcmTokens.length} devices to topic: ${topic}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to subscribe to topic: ${error.message}`);
      return false;
    }
  }

  /**
   * Unsubscribe devices from a topic
   */
  async unsubscribeFromTopic(fcmTokens: string[], topic: string): Promise<boolean> {
    if (!this.isInitialized()) {
      this.logger.warn('Firebase not initialized, cannot unsubscribe from topic');
      return false;
    }

    try {
      await admin.messaging().unsubscribeFromTopic(fcmTokens, topic);
      this.logger.log(`Unsubscribed ${fcmTokens.length} devices from topic: ${topic}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to unsubscribe from topic: ${error.message}`);
      return false;
    }
  }
}
