import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { DiscoverStackParamList, Store, Sale } from '../../types';
import { storesService, salesService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

type StoreDetailScreenNavigationProp = StackNavigationProp<
  DiscoverStackParamList,
  'StoreDetail'
>;
type StoreDetailScreenRouteProp = RouteProp<DiscoverStackParamList, 'StoreDetail'>;

interface Props {
  navigation: StoreDetailScreenNavigationProp;
  route: StoreDetailScreenRouteProp;
}

const StoreDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { storeId } = route.params;
  const [store, setStore] = useState<Store | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    try {
      const [storeRes, salesRes] = await Promise.all([
        storesService.getById(storeId),
        salesService.getByStoreId(storeId),
      ]);
      setStore(storeRes.data);
      setSales(salesRes.data);
    } catch (error) {
      console.error('Error fetching store data:', error);
      Alert.alert('Error', 'Failed to load store details');
    } finally {
      setLoading(false);
    }
  };

  const renderSaleItem = ({ item }: { item: Sale }) => (
    <TouchableOpacity
      style={styles.saleCard}
      onPress={() => navigation.push('SaleDetail', { saleId: item.id })}
    >
      <View style={styles.saleInfo}>
        <Text style={styles.saleTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.salePriceContainer}>
          {item.originalPrice && (
            <Text style={styles.originalPrice}>₪{Number(item.originalPrice).toFixed(2)}</Text>
          )}
          {item.salePrice && <Text style={styles.salePrice}>₪{Number(item.salePrice).toFixed(2)}</Text>}
        </View>
      </View>
      {item.discountPercentage && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{item.discountPercentage}%</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!store) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Store not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.storeIcon}>
          <Ionicons name="storefront" size={40} color="#4F46E5" />
        </View>
        <Text style={styles.storeName}>{store.name}</Text>
        <Text style={styles.category}>{store.category}</Text>

        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FBBF24" />
          <Text style={styles.rating}>{store.rating || 'New'}</Text>
          {store.reviewCount && (
            <Text style={styles.reviewCount}>({store.reviewCount} reviews)</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.description}>{store.description}</Text>

        <View style={styles.infoRow}>
          <Ionicons name="location" size={20} color="#6B7280" />
          <Text style={styles.infoText}>{store.address}, {store.city}</Text>
        </View>

        {store.phoneNumber && (
          <View style={styles.infoRow}>
            <Ionicons name="call" size={20} color="#6B7280" />
            <Text style={styles.infoText}>{store.phoneNumber}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Sales ({sales.length})</Text>
        {sales.length > 0 ? (
          sales.map((sale) => (
            <View key={sale.id}>{renderSaleItem({ item: sale })}</View>
          ))
        ) : (
          <Text style={styles.emptyText}>No active sales at the moment.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  storeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  storeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  category: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  section: {
    padding: 16,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 12,
  },
  saleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  saleInfo: {
    flex: 1,
  },
  saleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  salePriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  salePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  discountBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
});

export default StoreDetailScreen;
