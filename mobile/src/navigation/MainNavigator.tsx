import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from '../types';
import DiscoverNavigator from './DiscoverNavigator';
import SearchNavigator from './SearchNavigator';
import SavedNavigator from './SavedNavigator';
import ProfileNavigator from './ProfileNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator = () => {
  const insets = useSafeAreaInsets();

  // Calculate tab bar height based on safe area
  const tabBarHeight = 60 + (Platform.OS === 'android' ? Math.max(insets.bottom, 10) : insets.bottom);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Discover') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Saved') {
            iconName = focused ? 'bookmark' : 'bookmark-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 10) : insets.bottom,
          paddingTop: 5,
          height: tabBarHeight,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverNavigator}
        options={{ title: 'Discover' }}
      />
      <Tab.Screen
        name="Search"
        component={SearchNavigator}
        options={{ title: 'Search' }}
      />
      <Tab.Screen
        name="Saved"
        component={SavedNavigator}
        options={{ title: 'Saved' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
