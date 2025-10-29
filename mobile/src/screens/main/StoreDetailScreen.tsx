import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { DiscoverStackParamList } from '../../types';

type StoreDetailScreenNavigationProp = StackNavigationProp<
  DiscoverStackParamList,
  'StoreDetail'
>;
type StoreDetailScreenRouteProp = RouteProp<DiscoverStackParamList, 'StoreDetail'>;

interface Props {
  navigation: StoreDetailScreenNavigationProp;
  route: StoreDetailScreenRouteProp;
}

const StoreDetailScreen: React.FC<Props> = ({ route }) => {
  const { storeId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Store Details</Text>
      <Text style={styles.subtitle}>Store ID: {storeId}</Text>
      <Text style={styles.info}>
        This screen will display:
        {'\n'}- Store information
        {'\n'}- All sales from this store
        {'\n'}- Store location on map
        {'\n'}- Opening hours
        {'\n'}- Contact details
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  info: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 24,
    textAlign: 'center',
  },
});

export default StoreDetailScreen;
