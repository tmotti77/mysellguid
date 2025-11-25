import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SearchScreen from '../screens/main/SearchScreen';
import SaleDetailScreen from '../screens/main/SaleDetailScreen';
import StoreDetailScreen from '../screens/main/StoreDetailScreen';
import { SearchStackParamList } from '../types';

const Stack = createStackNavigator<SearchStackParamList>();

const SearchNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SearchHome" component={SearchScreen} />
      <Stack.Screen name="SaleDetail" component={SaleDetailScreen} />
      <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
    </Stack.Navigator>
  );
};

export default SearchNavigator;
