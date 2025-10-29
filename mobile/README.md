# MySellGuid Mobile App

React Native mobile application for discovering nearby sales and discounts.

## Features

✅ **Authentication**
- User registration and login
- JWT token management with auto-refresh
- Secure credential storage

✅ **Sales Discovery**
- Map view with nearby sales markers
- List view with distance and pricing
- Adjustable search radius (1km - 20km)
- Real-time location tracking
- Geospatial search powered by backend API

✅ **Sale Details**
- Full sale information
- Store details
- Share and save functionality
- Direct navigation to store

✅ **User Profile**
- Profile management
- Preferences settings
- Logout functionality

## Tech Stack

- **React Native 0.73** with Expo
- **TypeScript** for type safety
- **React Navigation** for routing
- **React Native Maps** for map view
- **Expo Location** for geolocation
- **Axios** for API calls
- **React Query** for data fetching
- **AsyncStorage** for local storage
- **React Native Paper** for UI components

## Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator (Mac) or Android Emulator
- Backend API running at http://localhost:3000/api

## Installation

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start Expo development server
npm start
```

## Running the App

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

### Web (for testing)
```bash
npm run web
```

## Project Structure

```
mobile/
├── src/
│   ├── components/        # Reusable UI components
│   ├── screens/           # Screen components
│   │   ├── auth/          # Authentication screens
│   │   └── main/          # Main app screens
│   ├── navigation/        # Navigation setup
│   ├── services/          # API services
│   ├── context/           # React Context (Auth)
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── assets/                # Images, fonts, etc.
├── App.tsx               # App entry point
└── app.json              # Expo configuration
```

## API Integration

The mobile app connects to the backend API at:
- Default: `http://localhost:3000/api`
- Configure in `app.json` under `extra.apiUrl`

### Key API Endpoints Used

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `GET /sales/nearby?lat=X&lng=Y&radius=Z` - Get nearby sales
- `GET /sales/:id` - Get sale details
- `GET /stores/:id` - Get store details
- `GET /users/me` - Get user profile

## Configuration

### Environment Variables

Create a `.env` file (optional):
```env
API_URL=http://localhost:3000/api
```

### Expo Configuration

Update `app.json` for your needs:
```json
{
  "expo": {
    "name": "MySellGuid",
    "slug": "mysellguid",
    "extra": {
      "apiUrl": "http://your-backend-url/api"
    }
  }
}
```

## Features by Screen

### Welcome Screen
- App introduction
- Get Started button → Register
- Already have account → Login

### Login Screen
- Email and password input
- Password visibility toggle
- Form validation
- JWT token storage

### Register Screen
- First name, last name, email, password
- Password confirmation
- Form validation

### Discover Screen (Main Feature!)
- **Map View**: Shows sales as markers on map
- **List View**: Card-based list of sales
- **Search Radius Selector**: 1km, 5km, 10km, 20km
- **Location Permission**: Requests user location
- **Sale Count Badge**: Shows number of nearby sales
- **Pull to Refresh**: Reload nearby sales

### Sale Detail Screen
- Sale images
- Discount badge
- Price comparison (original vs sale)
- Sale description
- Store information
- Valid until date
- Share and save buttons

### Search Screen (Placeholder)
- Search bar for sales/stores
- Will include filters and categories

### Saved Screen (Placeholder)
- Display bookmarked sales
- Quick access to favorites

### Profile Screen
- User information display
- Settings menu
- Logout functionality

## Development

### Running in Development

1. Start backend:
```bash
cd ../backend
npm run start:dev
```

2. Start mobile app:
```bash
cd mobile
npm start
```

3. Scan QR code with Expo Go app (iOS/Android)

### iOS Simulator

```bash
npm run ios
```

Requires Xcode installed on Mac.

### Android Emulator

```bash
npm run android
```

Requires Android Studio and Android SDK.

## Building for Production

### Using EAS (Expo Application Services)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Build for both
eas build --platform all
```

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## Troubleshooting

### Metro Bundler Issues
```bash
# Clear cache
npx expo start -c
```

### iOS Build Issues
```bash
cd ios && pod install && cd ..
```

### Android Build Issues
```bash
cd android && ./gradlew clean && cd ..
```

### Location Permission Denied
- Check device settings
- Ensure location services are enabled
- Restart the app

## Next Steps

- [ ] Implement search functionality
- [ ] Add save/bookmark feature with local storage
- [ ] Integrate push notifications (Firebase)
- [ ] Add user preferences screen
- [ ] Implement share functionality
- [ ] Add image carousel for sales
- [ ] Implement filters (category, discount %)
- [ ] Add pull-to-refresh on all lists
- [ ] Implement offline mode
- [ ] Add Hebrew (RTL) language support

## License

MIT
