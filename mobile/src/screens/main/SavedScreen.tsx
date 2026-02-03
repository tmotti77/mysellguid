import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import { bookmarksService } from '../../services/api';
import { Sale, SavedStackParamList } from '../../types';

type SavedScreenNavigationProp = StackNavigationProp<SavedStackParamList, 'SavedHome'>;

interface Props {
  navigation: SavedScreenNavigationProp;
}

const SavedScreen: React.FC<Props> = ({ navigation }) => {
  const [savedSales, setSavedSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Reload saved sales when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSavedSales();
    }, [])
  );

  const loadSavedSales = async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);

    try {
      // Get user's current location for distance calculation
      const { status } = await Location.requestForegroundPermissionsAsync();
      let latitude: number | undefined;
      let longitude: number | undefined;

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        latitude = location.coords.latitude;
        longitude = location.coords.longitude;
      }

      // Fetch bookmarked sales from backend
      const response = await bookmarksService.getAll(latitude, longitude);

      // Response is an array of bookmark objects, each with a nested `sale`
      const sales = (response.data || [])
        .filter((b: any) => b.sale)
        .map((b: any) => b.sale);
      setSavedSales(sales);
    } catch (error) {
      console.error('Error loading saved sales:', error);
      Alert.alert('Error', 'Failed to load saved sales');
      setSavedSales([]);
    } finally {
      setLoading(false);
      if (isRefreshing) setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSavedSales(true);
  };

  const handleRemoveBookmark = async (saleId: string, saleTitle: string) => {
    Alert.alert(
      'Remove Bookmark',
      `Remove "${saleTitle}" from saved sales?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookmarksService.remove(saleId);
              setSavedSales((prev) => prev.filter((sale) => sale.id !== saleId));
            } catch (error) {
              console.error('Error removing bookmark:', error);
              Alert.alert('Error', 'Failed to remove bookmark');
            }
          },
        },
      ]
    );
  };

  const renderSaleCard = ({ item }: { item: Sale }) => (
    <TouchableOpacity
      style={styles.saleCard}
      onPress={() => navigation.navigate('SaleDetail', { saleId: item.id })}
    >
      <Image
        source={{
          uri: item.images && item.images.length > 0
            ? item.images[0]
            : 'https://via.placeholder.com/400x200?text=No+Image'
        }}
        style={styles.saleImage}
      />
      <View style={styles.saleInfo}>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{item.discountPercentage}% OFF</Text>
        </View>
        <Text style={styles.saleTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.storeName}>{item.store?.name || 'Unknown Store'}</Text>
        <View style={styles.priceRow}>
          {item.originalPrice && (
            <Text style={styles.originalPrice}>
              {item.currency} {item.originalPrice}
            </Text>
          )}
          {item.salePrice && (
            <Text style={styles.salePrice}>
              {item.currency} {item.salePrice}
            </Text>
          )}
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveBookmark(item.id, item.title)}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="bookmark-outline" size={80} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Saved Sales Yet</Text>
      <Text style={styles.emptyText}>
        Bookmark sales you're interested in to find them here later
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.getParent()?.navigate('Discover')}
      >
        <Text style={styles.browseButtonText}>Browse Sales</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Saved</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>Loading saved sales...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved</Text>
        {savedSales.length > 0 && (
          <Text style={styles.headerSubtitle}>
            {savedSales.length} {savedSales.length === 1 ? 'sale' : 'sales'}
          </Text>
        )}
      </View>

      {/* Sales List */}
      <FlatList
        data={savedSales}
        renderItem={renderSaleCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          savedSales.length === 0 ? styles.emptyList : styles.list
        }
        ListEmptyComponent={renderEmptyState}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
  },
  saleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  saleImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  saleInfo: {
    padding: 12,
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  saleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  storeName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  originalPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  salePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  removeButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SavedScreen;
