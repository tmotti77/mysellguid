import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { salesService } from '../../services/api';
import { Sale, SearchStackParamList } from '../../types';

type SearchScreenNavigationProp = StackNavigationProp<SearchStackParamList, 'SearchHome'>;

const CATEGORIES = [
  { label: 'All Categories', value: '' },
  { label: 'Clothing', value: 'clothing' },
  { label: 'Shoes', value: 'shoes' },
  { label: 'Electronics', value: 'electronics' },
  { label: 'Home Goods', value: 'home_goods' },
  { label: 'Beauty', value: 'beauty' },
  { label: 'Sports', value: 'sports' },
  { label: 'Food', value: 'food' },
  { label: 'Other', value: 'other' },
];

const DISCOUNT_FILTERS = [
  { label: 'All', value: 0 },
  { label: '10%+', value: 10 },
  { label: '25%+', value: 25 },
  { label: '50%+', value: 50 },
  { label: '75%+', value: 75 },
];

interface Props {
  navigation: SearchScreenNavigationProp;
}

const SearchScreen: React.FC<Props> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDiscount, setSelectedDiscount] = useState(0);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Debounced search
  useEffect(() => {
    try {
      const timer = setTimeout(() => {
        if (searchQuery.trim()) {
          performSearch();
        } else if (searched) {
          setSales([]);
          setSearched(false);
        }
      }, 500);

      return () => clearTimeout(timer);
    } catch (error) {
      console.error('SearchScreen useEffect error:', error);
    }
  }, [searchQuery, selectedCategory, selectedDiscount]);

  const performSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params: any = {};
      if (selectedCategory) params.category = selectedCategory;
      if (selectedDiscount > 0) params.minDiscount = selectedDiscount;

      const response = await salesService.search(searchQuery, params);
      setSales(response.data);
    } catch (error) {
      console.error('Search error:', error);
      setSales([]);
    } finally {
      setLoading(false);
    }
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
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (loading) return null;

    if (!searched) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Start Searching</Text>
          <Text style={styles.emptyText}>
            Search for sales, products, or stores
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="sad-outline" size={64} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>No Results Found</Text>
        <Text style={styles.emptyText}>
          Try adjusting your search or filters
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for sales, stores, or products"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {/* Category Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Category</Text>
          <View style={styles.categoryButtons}>
            {CATEGORIES.slice(0, 4).map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryButton,
                  selectedCategory === cat.value && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(cat.value)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === cat.value && styles.categoryButtonTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Discount Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Minimum Discount</Text>
          <View style={styles.discountButtons}>
            {DISCOUNT_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.value}
                style={[
                  styles.discountButton,
                  selectedDiscount === filter.value && styles.discountButtonActive,
                ]}
                onPress={() => setSelectedDiscount(filter.value)}
              >
                <Text
                  style={[
                    styles.discountButtonText,
                    selectedDiscount === filter.value && styles.discountButtonTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={sales}
          renderItem={renderSaleCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={sales.length === 0 ? styles.emptyList : styles.list}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    margin: 4,
  },
  categoryButtonActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  discountButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  discountButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    margin: 4,
  },
  discountButtonActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  discountButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  discountButtonTextActive: {
    color: '#FFFFFF',
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SearchScreen;
