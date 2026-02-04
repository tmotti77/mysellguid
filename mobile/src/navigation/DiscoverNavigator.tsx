import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { DiscoverStackParamList } from '../types';
import DiscoverScreen from '../screens/main/DiscoverScreen';
import SaleDetailScreen from '../screens/main/SaleDetailScreen';
import StoreDetailScreen from '../screens/main/StoreDetailScreen';
import ReportSaleScreen from '../screens/main/ReportSaleScreen';

const Stack = createStackNavigator<DiscoverStackParamList>();

const DiscoverNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DiscoverHome"
        component={DiscoverScreen}
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
      <Stack.Screen
        name="ReportSale"
        component={ReportSaleScreen}
        options={{
          title: 'Report a Sale',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default DiscoverNavigator;
