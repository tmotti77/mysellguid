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

type DiscoverScreenNavigationProp = StackNavigationProp<
  DiscoverStackParamList,
  'DiscoverHome'
>;

interface Props {
  navigation: DiscoverScreenNavigationProp;
}

const DiscoverScreen: React.FC<Props> = ({ navigation }) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [radius, setRadius] = useState(5000); // 5km default
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: null, label: 'All' },
    { id: 'clothing', label: 'Fashion' },
    { id: 'electronics', label: 'Electronics' },
    { id: 'home_goods', label: 'Home' },
    { id: 'beauty', label: 'Beauty' },
    { id: 'sports', label: 'Sports' },
    { id: 'food', label: 'Food' },
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
        Alert.alert('Permission Denied', 'Location permission is required to find nearby sales');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location');
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
          {item.store.name}
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
        <Text style={styles.loadingText}>Finding sales near you...</Text>
      </View>
    );
  }

  if (!location && !searchQuery) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="location-outline" size={64} color="#6B7280" />
        <Text style={styles.errorText}>Location access required</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={requestLocationPermission}
        >
          <Text style={styles.retryButtonText}>Enable Location</Text>
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
            placeholder="Search sales..."
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
        >
          {sales.map((sale) => (
            <Marker
              key={sale.id}
              coordinate={{
                latitude: sale.latitude,
                longitude: sale.longitude,
              }}
              onPress={() => navigation.navigate('SaleDetail', { saleId: sale.id })}
            >
              <View style={styles.markerContainer}>
                <View style={styles.marker}>
                  <Ionicons name="pricetag" size={20} color="#FFFFFF" />
                </View>
              </View>
              <Callout onPress={() => navigation.navigate('SaleDetail', { saleId: sale.id })}>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>{sale.title}</Text>
                  <Text style={styles.calloutStore}>{sale.store.name}</Text>
                  <Text style={styles.calloutDiscount}>{sale.discountPercentage}% OFF</Text>
                  <Text style={styles.calloutButton}>Tap to view</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
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
              <Text style={styles.emptyText}>No sales found nearby</Text>
              <Text style={styles.emptySubtext}>Try increasing the search radius</Text>
            </View>
          }
        />
      )}



      {/* Sale Count */}
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{sales.length} sales nearby</Text>
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
  },
  categoryContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
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
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    backgroundColor: '#4F46E5',
    padding: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  calloutContainer: {
    width: 200,
    padding: 8,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  calloutStore: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  calloutDiscount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 4,
  },
  calloutButton: {
    fontSize: 12,
    color: '#4F46E5',
    marginTop: 4,
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
