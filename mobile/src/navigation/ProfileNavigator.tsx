import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProfileStackParamList } from '../types';
import ProfileScreen from '../screens/main/ProfileScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import CreateSaleScreen from '../screens/main/CreateSaleScreen';
import CreateStoreScreen from '../screens/main/CreateStoreScreen';

const Stack = createStackNavigator<ProfileStackParamList>();

const ProfileNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: 'Edit Profile',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="CreateSale"
        component={CreateSaleScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="CreateStore"
        component={CreateStoreScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};

export default ProfileNavigator;
