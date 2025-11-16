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
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
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

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (location) {
      fetchNearbySales();
    }
  }, [location, radius]);

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

  const fetchNearbySales = async () => {
    if (!location) return;

    try {
      const response = await salesService.getNearby(
        location.coords.latitude,
        location.coords.longitude,
        radius
      );
      setSales(response.data);
    } catch (error) {
      console.error('Error fetching sales:', error);
      Alert.alert('Error', 'Failed to load nearby sales');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNearbySales();
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

  if (!location) {
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
        <Text style={styles.headerTitle}>Discover</Text>
        <View style={styles.headerActions}>
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
      </View>

      {/* View Mode Toggle */}
      {viewMode === 'map' ? (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation
          showsMyLocationButton
        >
          {sales.map((sale) => (
            <Marker
              key={sale.id}
              coordinate={{
                latitude: parseFloat(sale.latitude),
                longitude: parseFloat(sale.longitude),
              }}
              onPress={() => navigation.navigate('SaleDetail', { saleId: sale.id })}
            >
              <View style={styles.markerContainer}>
                <View style={styles.marker}>
                  <Ionicons name="pricetag" size={20} color="#FFFFFF" />
                </View>
              </View>
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

      {/* Radius Selector */}
      <View style={styles.radiusContainer}>
        <Text style={styles.radiusLabel}>Search Radius: {radius / 1000}km</Text>
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
                {r / 1000}km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
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
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    paddingVertical: 8,
    marginHorizontal: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  radiusButtonActive: {
    backgroundColor: '#4F46E5',
  },
  radiusButtonText: {
    fontSize: 12,
    fontWeight: '600',
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
