import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { DiscoverStackParamList, Sale } from '../../types';
import { salesService, bookmarksService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { shareToWhatsApp, shareWithOptions } from '../../utils/share';

type SaleDetailScreenNavigationProp = StackNavigationProp<
  DiscoverStackParamList,
  'SaleDetail'
>;
type SaleDetailScreenRouteProp = RouteProp<DiscoverStackParamList, 'SaleDetail'>;

interface Props {
  navigation: SaleDetailScreenNavigationProp;
  route: SaleDetailScreenRouteProp;
}

const SaleDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { saleId } = route.params;
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    fetchSaleDetails();
    checkBookmarkStatus();
  }, []);

  const fetchSaleDetails = async () => {
    try {
      const response = await salesService.getById(saleId);
      console.log('Sale data received:', JSON.stringify(response.data, null, 2));
      setSale(response.data);
    } catch (error: any) {
      console.error('Error fetching sale:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load sale details';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkBookmarkStatus = async () => {
    try {
      // Try to check bookmark status - will fail if not logged in
      const response = await bookmarksService.check(saleId);
      setIsBookmarked(response.data?.isBookmarked || false);
    } catch (error: any) {
      // If 401 (not logged in) or 404, just assume not bookmarked
      // This is expected for users who aren't logged in
      if (error?.response?.status !== 401) {
        console.log('Bookmark check failed (user may not be logged in)');
      }
      setIsBookmarked(false);
    }
  };

  const handleSave = async () => {
    if (bookmarkLoading) return;

    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await bookmarksService.remove(saleId);
        setIsBookmarked(false);
        Alert.alert('Success', 'Removed from saved sales');
      } else {
        await bookmarksService.add(saleId);
        setIsBookmarked(true);
        Alert.alert('Success', 'Sale saved successfully!');
      }
    } catch (error: any) {
      console.error('Error toggling bookmark:', error);
      if (error?.response?.status === 401) {
        Alert.alert(
          'Login Required',
          'Please log in to save sales to your favorites.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => navigation.getParent()?.navigate('Profile') }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to save sale');
      }
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleShare = async () => {
    if (!sale) return;

    try {
      // Show options with WhatsApp as primary choice
      await shareWithOptions(sale);

      // Track share analytics (fire and forget)
      salesService.trackShare(saleId).catch(e => console.error('Failed to track share:', e));
    } catch (error: any) {
      if (error.message !== 'Share dismissed') {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleWhatsAppShare = async () => {
    if (!sale) return;

    try {
      await shareToWhatsApp(sale);

      // Track share analytics (fire and forget)
      salesService.trackShare(saleId).catch(e => console.error('Failed to track share:', e));
    } catch (error: any) {
      console.error('Error sharing to WhatsApp:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!sale) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Sale not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Images */}
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: sale.images && sale.images.length > 0
              ? sale.images[0]
              : 'https://via.placeholder.com/400x300?text=No+Image'
          }}
          style={styles.image}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {sale.discountPercentage && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{sale.discountPercentage}% OFF</Text>
          </View>
        )}

        <Text style={styles.title}>{sale.title}</Text>

        {sale.store && (
          <TouchableOpacity
            style={styles.storeContainer}
            onPress={() => navigation.navigate('StoreDetail', { storeId: sale.storeId })}
          >
            <Ionicons name="storefront" size={20} color="#4F46E5" />
            <Text style={styles.storeName}>{sale.store.name}</Text>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}

        {(sale.salePrice || sale.originalPrice) && (
          <View style={styles.priceContainer}>
            {sale.originalPrice && (
              <Text style={styles.originalPrice}>₪{sale.originalPrice}</Text>
            )}
            {sale.salePrice && (
              <Text style={styles.salePrice}>₪{sale.salePrice}</Text>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{sale.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={20} color="#6B7280" />
            <Text style={styles.detailText}>
              Valid until: {new Date(sale.endDate).toLocaleDateString()}
            </Text>
          </View>
          {sale.store?.address && (
            <View style={styles.detailRow}>
              <Ionicons name="location" size={20} color="#6B7280" />
              <Text style={styles.detailText}>{sale.store.address}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Ionicons name="pricetag" size={20} color="#6B7280" />
            <Text style={styles.detailText}>Category: {sale.category}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color="#4F46E5" />
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, isBookmarked && styles.saveButtonActive]}
            onPress={handleSave}
            disabled={bookmarkLoading}
          >
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.saveButtonText}>
              {bookmarkLoading ? 'Saving...' : (isBookmarked ? 'Saved' : 'Save')}
            </Text>
          </TouchableOpacity>
        </View>
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
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#E5E7EB',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  discountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  discountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  storeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  storeName: {
    flex: 1,
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
    marginLeft: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  originalPrice: {
    fontSize: 18,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginRight: 12,
  },
  salePrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 40,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
    marginLeft: 8,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    marginLeft: 8,
  },
  saveButtonActive: {
    backgroundColor: '#10B981',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default SaleDetailScreen;
