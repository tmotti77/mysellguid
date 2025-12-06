import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  TextInput,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { salesService } from '../../services/api';
import { Sale } from '../../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { DiscoverStackParamList } from '../../types';
import { useI18n } from '../../i18n/i18nContext';

type DiscoverScreenNavigationProp = StackNavigationProp<
  DiscoverStackParamList,
  'DiscoverHome'
>;

interface Props {
  navigation: DiscoverScreenNavigationProp;
}

// Helper function to get category color
const getCategoryColor = (category?: string): string => {
  const colors: Record<string, string> = {
    clothing: '#EC4899', // Pink
    fashion: '#EC4899',
    electronics: '#3B82F6', // Blue
    home_goods: '#F59E0B', // Amber
    home: '#F59E0B',
    furniture: '#8B5CF6', // Purple
    beauty: '#EF4444', // Red
    sports: '#10B981', // Green
    food: '#F97316', // Orange
    shoes: '#6366F1', // Indigo
  };
  return colors[category || ''] || '#4F46E5'; // Default indigo
};

const DiscoverScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useI18n();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list'); // Default to list - map requires Google Maps API key config
  const [radius, setRadius] = useState(5000); // 5km default
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapError, setMapError] = useState(false);

  const categories = [
    { id: null, label: t('all') },
    { id: 'clothing', label: t('fashion') },
    { id: 'electronics', label: t('electronics') },
    { id: 'home_goods', label: t('home') },
    { id: 'beauty', label: t('beauty') },
    { id: 'sports', label: t('sports') },
    { id: 'food', label: t('food') },
  ];

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (location || searchQuery) {
      fetchSales();
    }
  }, [location, radius, selectedCategory, searchQuery]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('locationRequired'), 'Location permission is required to find nearby sales');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(t('error'), 'Failed to get your location');
    }
  };

  const fetchSales = async () => {
    if (!location && !searchQuery) return;

    try {
      let response;
      if (searchQuery) {
        response = await salesService.search(searchQuery, {
          category: selectedCategory || undefined,
        });
      } else if (location) {
        response = await salesService.getNearby(
          location.coords.latitude,
          location.coords.longitude,
          radius,
          selectedCategory || undefined
        );
      }

      if (response) {
        setSales(response.data);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
      // Silent error for search typing
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSales();
  };

  const renderSaleCard = ({ item }: { item: Sale }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('SaleDetail', { saleId: item.id })}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {item.discountPercentage && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{item.discountPercentage}% OFF</Text>
            </View>
          )}
        </View>

        <Text style={styles.storeName} numberOfLines={1}>
          {item.store?.name || 'Unknown Store'}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={14} color="#6B7280" />
            <Text style={styles.distance}>
              {item.distance ? `${(item.distance / 1000).toFixed(1)}km away` : 'Nearby'}
            </Text>
          </View>

          {item.salePrice && (
            <View style={styles.priceContainer}>
              {item.originalPrice && (
                <Text style={styles.originalPrice}>₪{item.originalPrice}</Text>
              )}
              <Text style={styles.salePrice}>₪{item.salePrice}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>{t('findingSales')}</Text>
      </View>
    );
  }

  if (!location && !searchQuery) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="location-outline" size={64} color="#6B7280" />
        <Text style={styles.errorText}>{t('locationRequired')}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={requestLocationPermission}
        >
          <Text style={styles.retryButtonText}>{t('enableLocation')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={fetchSales}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
        >
          <Ionicons
            name={viewMode === 'map' ? 'list' : 'map'}
            size={24}
            color="#111827"
          />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id || 'all'}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category.id && styles.categoryChipTextActive,
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Radius Selector */}
      {!searchQuery && (
        <View style={styles.radiusContainer}>
          <View style={styles.radiusButtons}>
            {[1000, 5000, 10000, 20000].map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.radiusButton,
                  radius === r && styles.radiusButtonActive,
                ]}
                onPress={() => setRadius(r)}
              >
                <Text
                  style={[
                    styles.radiusButtonText,
                    radius === r && styles.radiusButtonTextActive,
                  ]}
                >
                  {r < 1000 ? `${r}m` : `${r / 1000}km`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* View Mode Toggle */}
      {viewMode === 'map' ? (
        mapError ? (
          <View style={styles.mapErrorContainer}>
            <Ionicons name="map-outline" size={64} color="#6B7280" />
            <Text style={styles.mapErrorTitle}>Map unavailable</Text>
            <Text style={styles.mapErrorText}>
              Google Maps is not configured properly.{'\n'}
              Please use list view to browse sales.
            </Text>
            <TouchableOpacity
              style={styles.switchToListButton}
              onPress={() => setViewMode('list')}
            >
              <Ionicons name="list" size={20} color="#FFFFFF" />
              <Text style={styles.switchToListText}>Switch to List View</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={location ? {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            } : undefined}
            showsUserLocation
            showsMyLocationButton
            onMapReady={() => setMapError(false)}
          >
            {sales.map((sale, index) => (
              <Marker
                key={sale.id}
                coordinate={{
                  latitude: Number(sale.latitude) + (index * 0.0001), // Slight offset to prevent overlap
                  longitude: Number(sale.longitude) + (index * 0.0001),
                }}
                onPress={() => navigation.navigate('SaleDetail', { saleId: sale.id })}
              >
                <View style={styles.markerContainer}>
                  <View style={[styles.marker, { backgroundColor: getCategoryColor(sale.category) }]}>
                    <Text style={styles.markerText}>
                      {sale.discountPercentage ? `${sale.discountPercentage}%` : '🏷️'}
                    </Text>
                  </View>
                  <View style={styles.markerArrow} />
                </View>
                <Callout
                  style={styles.callout}
                  onPress={() => navigation.navigate('SaleDetail', { saleId: sale.id })}
                >
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle} numberOfLines={2}>{sale.title}</Text>
                    <Text style={styles.calloutStore}>{sale.store?.name || 'Unknown Store'}</Text>
                    {sale.discountPercentage && (
                      <View style={styles.calloutDiscountBadge}>
                        <Text style={styles.calloutDiscount}>{sale.discountPercentage}% OFF</Text>
                      </View>
                    )}
                    <Text style={styles.calloutButton}>Tap to view details →</Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        )
      ) : (
        <FlatList
          data={sales}
          renderItem={renderSaleCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color="#6B7280" />
              <Text style={styles.emptyText}>{t('noSalesFound')}</Text>
              <Text style={styles.emptySubtext}>Try increasing the search radius</Text>
            </View>
          }
        />
      )}



      {/* Sale Count */}
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{sales.length} {t('nearbyDeals')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: 50, // Status bar padding
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    padding: 0,
  },
  iconButton: {
    padding: 8,
  },
  categoryContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    maxHeight: 56, // Fixed height to prevent stretching
  },
  categoryContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center', // Center chips vertically
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    height: 36, // Fixed height for chips
    justifyContent: 'center', // Center text vertically
  },
  categoryChipActive: {
    backgroundColor: '#4F46E5',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  map: {
    flex: 1,
  },
  mapErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 24,
  },
  mapErrorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  mapErrorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  switchToListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  switchToListText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 40,
    alignItems: 'center',
  },
  markerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#4F46E5',
    marginTop: -1,
  },
  callout: {
    width: 220,
  },
  calloutContainer: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  calloutStore: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  calloutDiscountBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  calloutDiscount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  calloutButton: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 12,
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
  storeName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distance: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  priceContainer: {
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
    fontWeight: '600',
    color: '#10B981',
  },
  radiusContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  radiusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  radiusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radiusButton: {
    flex: 1,
    paddingVertical: 6,
    marginHorizontal: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  radiusButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  radiusButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  radiusButtonTextActive: {
    color: '#FFFFFF',
  },
  countBadge: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
});

export default DiscoverScreen;
