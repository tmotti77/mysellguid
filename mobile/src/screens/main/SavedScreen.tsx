import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DiscoverStackParamList, Sale } from '../../types';
import { userService } from '../../services/api';

type NavigationProp = StackNavigationProp<DiscoverStackParamList>;

const SavedScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [savedSales, setSavedSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSavedSales();
  }, []);

  const fetchSavedSales = async () => {
    try {
      const response = await userService.getSavedSales(50, 0);
      setSavedSales(response.data);
    } catch (error) {
      console.error('Error fetching saved sales:', error);
      Alert.alert('Error', 'Failed to load saved sales');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSavedSales();
  };

  const handleUnsave = async (saleId: string) => {
    Alert.alert(
      'Remove from Saved',
      'Are you sure you want to remove this sale from your saved items?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await userService.unsaveSale(saleId);
              setSavedSales(prev => prev.filter(sale => sale.id !== saleId));
              Alert.alert('Success', 'Sale removed from saved items');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove sale');
            }
          },
        },
      ]
    );
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
          <View style={styles.priceContainer}>
            {item.originalPrice && (
              <Text style={styles.originalPrice}>₪{item.originalPrice}</Text>
            )}
            {item.salePrice && (
              <Text style={styles.salePrice}>₪{item.salePrice}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.unsaveButton}
            onPress={() => handleUnsave(item.id)}
          >
            <Ionicons name="bookmark" size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading saved sales...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved</Text>
        {savedSales.length > 0 && (
          <Text style={styles.headerCount}>{savedSales.length} items</Text>
        )}
      </View>

      {savedSales.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={64} color="#6B7280" />
          <Text style={styles.emptyTitle}>No Saved Sales Yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the bookmark icon on any sale to save it here
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => navigation.navigate('DiscoverHome')}
          >
            <Text style={styles.exploreButtonText}>Explore Sales</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={savedSales}
          renderItem={renderSaleCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
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
  headerCount: {
    fontSize: 14,
    color: '#6B7280',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  exploreButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  unsaveButton: {
    padding: 8,
  },
});

export default SavedScreen;
