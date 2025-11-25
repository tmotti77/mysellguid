import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../services/notifications';

export const useNotifications = () => {
  const navigation = useNavigation();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Initialize notifications
    initializeNotifications();

    // Set up listeners
    notificationListener.current = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        setNotification(notification);
      }
    );

    responseListener.current = notificationService.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        handleNotificationResponse(response);
      }
    );

    return () => {
      // Cleanup listeners
      if (notificationListener.current) {
        notificationService.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        notificationService.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      // Configure notification channels
      await notificationService.configureNotificationChannels();

      // Register push token
      const registered = await notificationService.registerPushToken();
      if (registered) {
        const token = await notificationService.getExpoPushToken();
        setExpoPushToken(token);
      }

      // Clear badge on app open
      await notificationService.clearBadge();
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;

    // Handle different notification types
    if (data?.saleId) {
      // Navigate to sale detail
      navigation.navigate('SaleDetail' as never, { saleId: data.saleId } as never);
    } else if (data?.storeId) {
      // Navigate to store detail
      navigation.navigate('StoreDetail' as never, { storeId: data.storeId } as never);
    } else if (data?.screen) {
      // Navigate to specific screen
      navigation.navigate(data.screen as never);
    }
  };

  const sendTestNotification = async () => {
    await notificationService.showLocalNotification(
      'Test Notification',
      'This is a test notification from MySellGuid!',
      { test: true }
    );
  };

  return {
    expoPushToken,
    notification,
    sendTestNotification,
  };
};
