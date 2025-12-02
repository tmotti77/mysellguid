import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../services/notifications';

export const useNotifications = () => {
  const navigation = useNavigation();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

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
    const data = response.notification.request.content.data as Record<string, string> | undefined;

    // Handle different notification types
    if (data?.saleId) {
      // Navigate to sale detail
      // @ts-expect-error - Navigation types are complex
      navigation.navigate('SaleDetail', { saleId: data.saleId });
    } else if (data?.storeId) {
      // Navigate to store detail
      // @ts-expect-error - Navigation types are complex
      navigation.navigate('StoreDetail', { storeId: data.storeId });
    } else if (data?.screen) {
      // Navigate to specific screen
      // @ts-expect-error - Navigation types are complex
      navigation.navigate(data.screen);
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
