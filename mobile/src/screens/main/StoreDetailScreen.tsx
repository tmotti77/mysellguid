import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { storesService, salesService } from '../../services/api';
import { DiscoverStackParamList, Store, Sale } from '../../types';

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
    loadStoreDetails();
  }, [storeId]);

  const loadStoreDetails = async () => {
    setLoading(true);
    try {
      // Fetch store details and sales in parallel
      const [storeResponse, salesResponse] = await Promise.all([
        storesService.getById(storeId),
        salesService.getByStore(storeId),
      ]);

      setStore(storeResponse.data);
      setSales(salesResponse.data);
    } catch (error) {
      console.error('Error loading store details:', error);
      Alert.alert('Error', 'Failed to load store details');
    } finally {
      setLoading(false);
    }
  };

  const handleCallStore = (phoneNumber?: string) => {
    if (!phoneNumber) {
      Alert.alert('No Phone Number', 'This store has not provided a phone number');
      return;
    }
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleOpenLocation = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const renderSaleCard = (sale: Sale) => (
    <TouchableOpacity
      key={sale.id}
      style={styles.saleCard}
      onPress={() => navigation.navigate('SaleDetail', { saleId: sale.id })}
    >
      <Image
        source={{
          uri: sale.images && sale.images.length > 0
            ? sale.images[0]
            : 'https://via.placeholder.com/400x200?text=No+Image'
        }}
        style={styles.saleImage}
      />
      <View style={styles.saleInfo}>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{sale.discountPercentage}% OFF</Text>
        </View>
        <Text style={styles.saleTitle} numberOfLines={2}>
          {sale.title}
        </Text>
        <View style={styles.priceRow}>
          {sale.originalPrice && (
            <Text style={styles.originalPrice}>
              {sale.currency} {sale.originalPrice}
            </Text>
          )}
          {sale.salePrice && (
            <Text style={styles.salePrice}>
              {sale.currency} {sale.salePrice}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EF4444" />
        <Text style={styles.loadingText}>Loading store details...</Text>
      </View>
    );
  }

  if (!store) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Store not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Store Header */}
      <View style={styles.header}>
        {store.coverImage && (
          <Image source={{ uri: store.coverImage }} style={styles.coverImage} />
        )}
        <View style={styles.headerContent}>
          {store.logo && (
            <Image source={{ uri: store.logo }} style={styles.storeLogo} />
          )}
          <View style={styles.storeInfo}>
            <Text style={styles.storeName}>{store.name}</Text>
            {store.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Store Description */}
      {store.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{store.description}</Text>
        </View>
      )}

      {/* Store Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>

        {/* Address */}
        <TouchableOpacity
          style={styles.detailRow}
          onPress={() => handleOpenLocation(store.latitude, store.longitude)}
        >
          <Ionicons name="location-outline" size={20} color="#6B7280" />
          <View style={styles.detailText}>
            <Text style={styles.detailLabel}>Address</Text>
            <Text style={styles.detailValue}>
              {store.address}, {store.city}, {store.country}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </TouchableOpacity>

        {/* Category */}
        <View style={styles.detailRow}>
          <Ionicons name="pricetag-outline" size={20} color="#6B7280" />
          <View style={styles.detailText}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{store.category}</Text>
          </View>
        </View>

        {/* Rating */}
        <View style={styles.detailRow}>
          <Ionicons name="star-outline" size={20} color="#6B7280" />
          <View style={styles.detailText}>
            <Text style={styles.detailLabel}>Rating</Text>
            <Text style={styles.detailValue}>
              {store.rating.toFixed(1)} ({store.reviewCount} reviews)
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleOpenLocation(store.latitude, store.longitude)}
        >
          <Ionicons name="navigate" size={24} color="#EF4444" />
          <Text style={styles.actionButtonText}>Directions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleCallStore(store.phoneNumber)}
        >
          <Ionicons name="call" size={24} color="#EF4444" />
          <Text style={styles.actionButtonText}>Call</Text>
        </TouchableOpacity>
      </View>

      {/* Active Sales */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Active Sales ({sales.length})
        </Text>

        {sales.length === 0 ? (
          <View style={styles.noSalesContainer}>
            <Ionicons name="pricetags-outline" size={48} color="#D1D5DB" />
            <Text style={styles.noSalesText}>No active sales at this store</Text>
          </View>
        ) : (
          <View style={styles.salesGrid}>
            {sales.map((sale) => renderSaleCard(sale))}
          </View>
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
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  coverImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#F3F4F6',
  },
  headerContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeLogo: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  storeInfo: {
    flex: 1,
    marginLeft: 16,
  },
  storeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailText: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  actionsSection: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 6,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  salesGrid: {
  },
  saleCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  saleImage: {
    width: 120,
    height: 120,
    backgroundColor: '#F3F4F6',
  },
  saleInfo: {
    flex: 1,
    padding: 12,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  saleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  priceRow: {
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  noSalesContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  noSalesText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
});

export default StoreDetailScreen;
