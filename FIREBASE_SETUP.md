# Firebase Push Notifications Setup Guide

This guide explains how to set up Firebase Cloud Messaging (FCM) for push notifications in MySellGuid.

## Prerequisites

- Firebase account (https://console.firebase.google.com)
- Node.js backend running
- Mobile app configured with Firebase (for React Native)

## Backend Setup

### 1. Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add project" or select existing project
3. Follow the setup wizard

### 2. Generate Service Account Key

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Navigate to **Service Accounts** tab
3. Click **Generate New Private Key**
4. Download the JSON file (keep it secure!)
5. Save it as `firebase-service-account.json` in a secure location

### 3. Configure Backend

There are two ways to configure the Firebase credentials:

#### Option A: Using File Path (Recommended for Development)

1. Place your `firebase-service-account.json` file in a secure location (outside the repo)
2. Add to `.env`:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/firebase-service-account.json
```

#### Option B: Using Environment Variable (Recommended for Production)

1. Convert the JSON file content to a single-line string:

```bash
cat firebase-service-account.json | jq -c
```

2. Add the entire JSON content to `.env`:

```env
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project",...}'
```

### 4. Restart Backend

```bash
cd backend
npm run start:dev
```

You should see:
```
[Nest] LOG [FirebaseService] Firebase Admin SDK initialized successfully
```

Instead of the warning:
```
[Nest] WARN [FirebaseService] Firebase credentials not configured
```

## Mobile App Setup (React Native)

### 1. Install Firebase Libraries

```bash
cd mobile
npm install @react-native-firebase/app @react-native-firebase/messaging
```

### 2. Android Configuration

1. Download `google-services.json` from Firebase Console:
   - Go to Project Settings > Your Apps > Android App
   - Download `google-services.json`
   - Place it in `mobile/android/app/google-services.json`

2. Update `android/build.gradle`:

```gradle
buildscript {
  dependencies {
    classpath('com.google.gms:google-services:4.4.0')
  }
}
```

3. Update `android/app/build.gradle`:

```gradle
apply plugin: 'com.google.gms.google-services'
```

### 3. iOS Configuration

1. Download `GoogleService-Info.plist` from Firebase Console:
   - Go to Project Settings > Your Apps > iOS App
   - Download `GoogleService-Info.plist`
   - Add it to your Xcode project

2. Run:

```bash
cd ios
pod install
```

### 4. Request Permission & Get FCM Token

Add this to your React Native app:

```typescript
import messaging from '@react-native-firebase/messaging';

// Request permission (iOS)
async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
  }
}

// Get FCM token
async function getFCMToken() {
  const token = await messaging().getToken();
  console.log('FCM Token:', token);

  // Send this token to your backend
  await updateUserFCMToken(token);
}

// Update user's FCM token in backend
async function updateUserFCMToken(token: string) {
  const response = await fetch('http://localhost:3000/api/users/me/fcm-token', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ fcmToken: token }),
  });
}
```

## Testing Push Notifications

### 1. Test Notification via API

Once you have:
- Firebase credentials configured in backend
- User logged in with FCM token set

Test the notification endpoint:

```bash
# Get your access token
TOKEN="your-jwt-token"

# Send test notification
curl -X POST http://localhost:3000/api/notifications/test \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Subscribe to Category Notifications

```bash
curl -X POST http://localhost:3000/api/notifications/subscribe/clothing \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Trigger Notification on New Sale

When a new sale is created near a user's location, they will automatically receive a notification.

## Notification Features

### 1. Location-Based Notifications

When a new sale is created, the system automatically:
- Finds all users within 5km radius
- Filters users with active FCM tokens
- Sends push notification with sale details

### 2. Category Subscriptions

Users can subscribe to specific categories:
- `clothing`
- `electronics`
- `furniture`
- `beauty`
- `sports`
- `food`
- etc.

### 3. Notification Types

The system supports:
- **New Sale Nearby**: Automatic notification when a sale is created near the user
- **Category Updates**: Notifications for subscribed categories
- **User-Specific**: Direct notifications to specific users
- **Broadcast**: Send to all users in a topic

## Troubleshooting

### Backend Not Initializing Firebase

**Symptom**: Warning message "Firebase credentials not configured"

**Solutions**:
1. Check `.env` file has `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_SERVICE_ACCOUNT_JSON`
2. Verify file path is correct (absolute path recommended)
3. Ensure JSON is properly formatted (use `jq` to validate)
4. Check file permissions (backend needs read access)

### Mobile App Not Receiving Notifications

**Symptom**: No notifications received on device

**Solutions**:
1. Check if FCM token is set in user profile: `GET /api/users/me`
2. Verify Firebase project settings match mobile app bundle ID
3. Check device notification permissions
4. For iOS: Enable "Push Notifications" capability in Xcode
5. Test with backend test endpoint first

### Notifications Not Sending to Nearby Users

**Symptom**: No nearby users notified when sale is created

**Solutions**:
1. Verify users have `defaultLatitude` and `defaultLongitude` set
2. Check users have active FCM tokens
3. Verify sale coordinates are valid
4. Check backend logs for Firebase send errors

## API Endpoints

### Update FCM Token

```
PATCH /api/users/me/fcm-token
Authorization: Bearer {token}
Content-Type: application/json

{
  "fcmToken": "device-fcm-token"
}
```

### Test Notification

```
POST /api/notifications/test
Authorization: Bearer {token}
```

### Subscribe to Category

```
POST /api/notifications/subscribe/{category}
Authorization: Bearer {token}
```

### Unsubscribe from Category

```
POST /api/notifications/unsubscribe/{category}
Authorization: Bearer {token}
```

## Security Notes

1. **Never commit** `firebase-service-account.json` to version control
2. Add to `.gitignore`:
   ```
   firebase-service-account.json
   google-services.json
   GoogleService-Info.plist
   ```
3. Use environment variables in production (Option B above)
4. Rotate service account keys periodically
5. Limit service account permissions to only what's needed

## Production Deployment

For production environments:

1. Use `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable
2. Store credentials in secure secret management (AWS Secrets Manager, Azure Key Vault, etc.)
3. Enable Firebase App Check for additional security
4. Monitor notification delivery rates
5. Set up error alerting for failed deliveries

## Next Steps

1. Configure Firebase project
2. Set up mobile app with Firebase SDK
3. Test notifications end-to-end
4. Configure notification preferences UI in mobile app
5. Set up analytics to track notification engagement
