# Expo Push Notifications Setup - MySellGuid

This guide shows how to set up push notifications using Expo's push notification service for the MySellGuid mobile app.

## Why Expo Push Notifications?

For MVP development, Expo Push Notifications offer several advantages:
- **No Firebase setup required** - Works immediately
- **Cross-platform** - iOS and Android with same code
- **Free for development** - No cost for testing
- **Easy testing** - Can send test notifications from Expo dashboard
- **Can upgrade to Firebase later** - Migration path available

## Mobile App Setup

### 1. Install Required Packages

```bash
cd mobile
npm install expo-notifications expo-device expo-constants
```

### 2. Update app.json

The notification configuration is already added to `app.json`:

```json
{
  "expo": {
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#EF4444",
      "androidMode": "default",
      "androidCollapsedTitle": "{{unread_notifications}} new sales nearby"
    },
    "android": {
      "googleServicesFile": "./google-services.json",
      "permissions": [
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "NOTIFICATIONS"
      ]
    },
    "ios": {
      "supportsTabletMultitasking": true
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#EF4444",
          "sounds": ["./assets/notification.wav"]
        }
      ]
    ]
  }
}
```

### 3. Test on Physical Device

**IMPORTANT**: Push notifications only work on physical devices, not simulators/emulators.

1. Start the Expo development server:
   ```bash
   cd mobile
   npx expo start
   ```

2. Scan QR code with Expo Go app on your phone

3. Grant notification permissions when prompted

4. Your Expo push token will be logged in the console

### 4. Test Notifications

#### Option A: Test from Mobile App

The app includes a test notification feature in the Profile screen.

#### Option B: Send Test via Expo Push Tool

1. Get your Expo push token from the app logs
2. Go to https://expo.dev/notifications
3. Enter your push token
4. Send a test notification

#### Option C: Send via Backend

Once the backend is configured, it will send notifications automatically:
- New sales nearby
- Price drops on saved sales
- Sale ending soon reminders

## Backend Integration

The backend is already configured to send push notifications. It stores user FCM/Expo tokens in the database.

### Update User Token

The mobile app automatically registers its push token with the backend when:
- User logs in
- App starts
- Token changes

### Send Notification from Backend

The backend includes a notifications module that can send:

```typescript
// Send to single user
await notificationsService.sendNewSaleNotification(userId, saleId);

// Send to multiple users nearby
await notificationsService.notifyNearbyUsers(latitude, longitude, saleId);

// Send to saved sale watchers
await notificationsService.notifySavedSaleUpdate(saleId, 'Price dropped by 20%!');
```

## Notification Types

MySellGuid sends these types of notifications:

### 1. New Sales Nearby
When a new sale appears within the user's preferred radius:
```
Title: "New Sale Nearby!"
Body: "50% OFF at Fashion Paradise - Only 200m away"
Data: { saleId, distance }
```

### 2. Saved Sale Updates
When a saved sale has price drops or changes:
```
Title: "Price Drop Alert!"
Body: "Your saved sale now 70% OFF (was 50%)"
Data: { saleId, oldDiscount, newDiscount }
```

### 3. Sale Ending Soon
24 hours before a saved sale expires:
```
Title: "Sale Ending Soon"
Body: "Summer Sale at Tech Zone ends tomorrow"
Data: { saleId, endDate }
```

### 4. Store Updates
When a followed store posts new sales:
```
Title: "New Sale at Fashion Paradise"
Body: "3 new sales just posted"
Data: { storeId, saleCount }
```

## Handling Notifications

The app automatically handles notification taps:

```typescript
// When user taps notification
if (data.saleId) {
  // Navigate to sale detail
  navigation.navigate('SaleDetail', { saleId });
} else if (data.storeId) {
  // Navigate to store detail
  navigation.navigate('StoreDetail', { storeId });
}
```

## Notification Channels (Android)

The app creates three notification channels:

1. **Default** - General notifications (MAX priority)
2. **Sales** - New sales and promotions (HIGH priority)
3. **Updates** - Saved sale updates (DEFAULT priority)

Users can customize each channel's settings in Android system settings.

## Testing Checklist

- [ ] Install packages (`expo-notifications`, `expo-device`, `expo-constants`)
- [ ] Run app on physical device
- [ ] Grant notification permission
- [ ] Get Expo push token (check console logs)
- [ ] Send test notification from https://expo.dev/notifications
- [ ] Verify notification appears
- [ ] Tap notification and verify navigation works
- [ ] Test local notification from Profile screen
- [ ] Check badge count updates

## Troubleshooting

### "Push notifications don't work on simulator"
**Solution**: Use a physical device. Simulators cannot receive push notifications.

### "No push token generated"
**Solution**:
- Check you're using a physical device
- Grant notification permissions
- Restart the app

### "Notifications not appearing"
**Solution**:
- Check device notification settings
- Ensure "Do Not Disturb" is off
- Check notification permissions in system settings
- Try sending a local notification first

### "Token registration fails"
**Solution**:
- Check backend is running
- Check network connectivity
- Check console for error logs
- Verify API endpoint `/users/me/fcm-token` is working

## Production Deployment

For production builds:

1. Build with EAS Build:
   ```bash
   eas build --platform android
   eas build --platform ios
   ```

2. Expo push notifications work automatically in production builds

3. Monitor notifications in Expo dashboard

## Upgrading to Firebase (Optional)

If you need Firebase-specific features later:

1. Follow `FIREBASE_SETUP.md` guide
2. Install Firebase packages
3. Update notification service to use Firebase
4. Backend already supports Firebase (just needs credentials)

## Cost

- **Development**: Free
- **Production**: Free for first 1 million notifications/month
- **Enterprise**: Contact Expo for pricing

## Resources

- Expo Notifications Docs: https://docs.expo.dev/push-notifications/overview/
- Expo Push Notification Tool: https://expo.dev/notifications
- Firebase Migration Guide: https://docs.expo.dev/push-notifications/using-fcm/

---

**Status**: Ready to use (requires package installation)
**Last Updated**: November 17, 2025
