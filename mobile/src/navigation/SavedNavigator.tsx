import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SavedStackParamList } from '../types';
import SavedScreen from '../screens/main/SavedScreen';
import SaleDetailScreen from '../screens/main/SaleDetailScreen';
import StoreDetailScreen from '../screens/main/StoreDetailScreen';

const Stack = createStackNavigator<SavedStackParamList>();

const SavedNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SavedHome"
        component={SavedScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SaleDetail"
        component={SaleDetailScreen}
        options={{
          title: 'Sale Details',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="StoreDetail"
        component={StoreDetailScreen}
        options={{
          title: 'Store Details',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default SavedNavigator;
