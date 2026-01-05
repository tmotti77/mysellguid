import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import { ProfileStackParamList, Store } from '../../types';
import { salesService, storesService } from '../../services/api';
import { useI18n } from '../../i18n/i18nContext';

type CreateSaleScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'CreateSale'>;

interface Props {
  navigation: CreateSaleScreenNavigationProp;
}

const CATEGORIES = [
  { id: 'clothing', label: 'Clothing', icon: 'shirt-outline' },
  { id: 'electronics', label: 'Electronics', icon: 'phone-portrait-outline' },
  { id: 'home_goods', label: 'Home', icon: 'home-outline' },
  { id: 'beauty', label: 'Beauty', icon: 'sparkles-outline' },
  { id: 'sports', label: 'Sports', icon: 'fitness-outline' },
  { id: 'food', label: 'Food', icon: 'fast-food-outline' },
  { id: 'shoes', label: 'Shoes', icon: 'footsteps-outline' },
  { id: 'other', label: 'Other', icon: 'pricetag-outline' },
];

const CreateSaleScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [loadingStores, setLoadingStores] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('clothing');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Store selection
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showStoreSelector, setShowStoreSelector] = useState(false);

  // Location
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    loadLocationAndStores();
  }, []);

  const loadLocationAndStores = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Required', 'Please enable location to create a sale');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      // Load nearby stores
      const response = await storesService.getNearby(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        10000 // 10km radius
      );
      setStores(response.data || []);
    } catch (error) {
      console.error('Error loading location/stores:', error);
      Alert.alert('Error', 'Failed to load nearby stores');
    } finally {
      setLoadingStores(false);
    }
  };

  const validateForm = (): boolean => {
    if (!title.trim() || title.length < 5) {
      Alert.alert('Error', 'Please enter a title (at least 5 characters)');
      return false;
    }
    if (!description.trim() || description.length < 10) {
      Alert.alert('Error', 'Please enter a description (at least 10 characters)');
      return false;
    }
    if (!selectedStore) {
      Alert.alert('Error', 'Please select a store');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const saleData = {
        title: title.trim(),
        description: description.trim(),
        storeId: selectedStore!.id,
        category,
        discountPercentage: discountPercentage ? Number(discountPercentage) : undefined,
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        salePrice: salePrice ? Number(salePrice) : undefined,
        currency: 'ILS',
        images: imageUrl.trim() ? [imageUrl.trim()] : undefined,
        latitude: location?.latitude || selectedStore!.latitude,
        longitude: location?.longitude || selectedStore!.longitude,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      };

      await salesService.create(saleData);

      Alert.alert(
        'Success!',
        'Your sale has been posted successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating sale:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create sale. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post a Sale</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Sale Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 50% OFF Summer Collection!"
            value={title}
            onChangeText={setTitle}
            maxLength={200}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the sale, what's included, any conditions..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={2000}
          />
        </View>

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    category === cat.id && styles.categoryChipActive,
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={16}
                    color={category === cat.id ? '#FFFFFF' : '#6B7280'}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      category === cat.id && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Store Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Store *</Text>
          {loadingStores ? (
            <View style={styles.loadingStores}>
              <ActivityIndicator size="small" color="#4F46E5" />
              <Text style={styles.loadingText}>Loading nearby stores...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.storeSelector}
              onPress={() => setShowStoreSelector(!showStoreSelector)}
            >
              {selectedStore ? (
                <View style={styles.selectedStore}>
                  <Ionicons name="storefront-outline" size={20} color="#4F46E5" />
                  <Text style={styles.selectedStoreText}>{selectedStore.name}</Text>
                </View>
              ) : (
                <Text style={styles.storePlaceholder}>Select a store...</Text>
              )}
              <Ionicons
                name={showStoreSelector ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#6B7280"
              />
            </TouchableOpacity>
          )}

          {showStoreSelector && (
            <View style={styles.storeList}>
              {stores.length === 0 ? (
                <Text style={styles.noStoresText}>No stores found nearby</Text>
              ) : (
                stores.map((store) => (
                  <TouchableOpacity
                    key={store.id}
                    style={[
                      styles.storeOption,
                      selectedStore?.id === store.id && styles.storeOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedStore(store);
                      setShowStoreSelector(false);
                    }}
                  >
                    <View>
                      <Text style={styles.storeOptionName}>{store.name}</Text>
                      <Text style={styles.storeOptionAddress}>{store.address}, {store.city}</Text>
                    </View>
                    {selectedStore?.id === store.id && (
                      <Ionicons name="checkmark-circle" size={20} color="#4F46E5" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* Pricing */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pricing (Optional)</Text>
          <View style={styles.priceRow}>
            <View style={styles.priceInput}>
              <Text style={styles.priceLabel}>Discount %</Text>
              <TextInput
                style={styles.input}
                placeholder="50"
                value={discountPercentage}
                onChangeText={setDiscountPercentage}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
            <View style={styles.priceInput}>
              <Text style={styles.priceLabel}>Original ₪</Text>
              <TextInput
                style={styles.input}
                placeholder="200"
                value={originalPrice}
                onChangeText={setOriginalPrice}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.priceInput}>
              <Text style={styles.priceLabel}>Sale ₪</Text>
              <TextInput
                style={styles.input}
                placeholder="100"
                value={salePrice}
                onChangeText={setSalePrice}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Image URL */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Image URL (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChangeText={setImageUrl}
            keyboardType="url"
            autoCapitalize="none"
          />
          <Text style={styles.helperText}>
            Paste a link to an image of the sale
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="megaphone-outline" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Post Sale</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  storeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
  },
  selectedStore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedStoreText: {
    fontSize: 16,
    color: '#111827',
  },
  storePlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  loadingStores: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  storeList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
    maxHeight: 200,
  },
  storeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  storeOptionSelected: {
    backgroundColor: '#F0F0FF',
  },
  storeOptionName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  storeOptionAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  noStoresText: {
    padding: 14,
    textAlign: 'center',
    color: '#6B7280',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priceInput: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 40,
  },
});

export default CreateSaleScreen;
