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
  Image,
  Linking,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { ProfileStackParamList, Store } from '../../types';
import { salesService, storesService, mlService } from '../../services/api';
import { useI18n } from '../../i18n/i18nContext';

type CreateSaleScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'CreateSale'>;

interface Props {
  navigation: CreateSaleScreenNavigationProp;
}

type InputMode = 'manual' | 'url' | 'screenshot';

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
  const [aiLoading, setAiLoading] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('manual');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('clothing');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // URL paste state
  const [pastedUrl, setPastedUrl] = useState('');

  // Screenshot state
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);

  // Store selection
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showStoreSelector, setShowStoreSelector] = useState(false);

  // Location
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // AI extraction results
  const [aiExtracted, setAiExtracted] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);

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

  const handlePasteUrl = async () => {
    try {
      const text = await Clipboard.getString();
      if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
        setPastedUrl(text);
      } else {
        Alert.alert('No URL Found', 'Please copy a valid URL from Instagram, TikTok, or other social media.');
      }
    } catch (error) {
      console.error('Clipboard error:', error);
    }
  };

  const handleExtractFromUrl = async () => {
    if (!pastedUrl) {
      Alert.alert('Error', 'Please enter or paste a URL first');
      return;
    }

    setAiLoading(true);
    try {
      const response = await mlService.extractFromUrl(pastedUrl);
      const data = response.data;

      if (data.confidence > 0.3) {
        // Auto-fill form with extracted data
        if (data.title) setTitle(data.title);
        if (data.description) setDescription(data.description);
        if (data.category) {
          const matchedCategory = CATEGORIES.find(c => c.id === data.category);
          if (matchedCategory) setCategory(data.category);
        }
        if (data.discountPercentage) setDiscountPercentage(String(data.discountPercentage));
        if (data.originalPrice) setOriginalPrice(String(data.originalPrice));
        if (data.salePrice) setSalePrice(String(data.salePrice));
        if (data.imageUrls && data.imageUrls.length > 0) setImageUrl(data.imageUrls[0]);

        // Try to match store by name
        if (data.storeName && stores.length > 0) {
          const matchedStore = stores.find(s =>
            s.name.toLowerCase().includes(data.storeName.toLowerCase()) ||
            data.storeName.toLowerCase().includes(s.name.toLowerCase())
          );
          if (matchedStore) setSelectedStore(matchedStore);
        }

        setAiExtracted(true);
        setAiConfidence(data.confidence);
        setInputMode('manual'); // Switch to manual to show/edit the results

        Alert.alert(
          'Sale Extracted!',
          `Confidence: ${Math.round(data.confidence * 100)}%\n\nPlease review and edit the details below.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Low Confidence',
          'Could not confidently extract sale information from this URL. Please enter the details manually.',
          [{ text: 'OK', onPress: () => setInputMode('manual') }]
        );
      }
    } catch (error: any) {
      console.error('URL extraction error:', error);
      Alert.alert('Error', 'Failed to extract sale information. Please try again or enter manually.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleTakeScreenshot = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera access to take screenshots');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setScreenshotUri(result.assets[0].uri);
        await analyzeScreenshot(result.assets[0].base64!, 'image/jpeg');
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow photo library access');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setScreenshotUri(result.assets[0].uri);
        await analyzeScreenshot(result.assets[0].base64!, 'image/jpeg');
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const analyzeScreenshot = async (base64Data: string, mimeType: string) => {
    setAiLoading(true);
    try {
      const response = await mlService.analyzeScreenshot(base64Data, mimeType);
      const data = response.data;

      if (data.confidence > 0.3) {
        // Auto-fill form with extracted data
        if (data.title) setTitle(data.title);
        if (data.description) setDescription(data.description);
        if (data.category) {
          const matchedCategory = CATEGORIES.find(c => c.id === data.category);
          if (matchedCategory) setCategory(data.category);
        }
        if (data.discountPercentage) setDiscountPercentage(String(data.discountPercentage));
        if (data.originalPrice) setOriginalPrice(String(data.originalPrice));
        if (data.salePrice) setSalePrice(String(data.salePrice));

        // Try to match store by name
        if (data.storeName && stores.length > 0) {
          const matchedStore = stores.find(s =>
            s.name.toLowerCase().includes(data.storeName.toLowerCase()) ||
            data.storeName.toLowerCase().includes(s.name.toLowerCase())
          );
          if (matchedStore) setSelectedStore(matchedStore);
        }

        setAiExtracted(true);
        setAiConfidence(data.confidence);
        setInputMode('manual');

        Alert.alert(
          'Screenshot Analyzed!',
          `Confidence: ${Math.round(data.confidence * 100)}%\n\nPlease review and edit the details below.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Could Not Extract',
          'Could not extract sale information from this image. Please enter the details manually.',
          [{ text: 'OK', onPress: () => setInputMode('manual') }]
        );
      }
    } catch (error: any) {
      console.error('Screenshot analysis error:', error);
      Alert.alert('Error', 'Failed to analyze screenshot. Please try again or enter manually.');
    } finally {
      setAiLoading(false);
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

  const renderInputModeSelector = () => (
    <View style={styles.modeSelector}>
      <TouchableOpacity
        style={[styles.modeButton, inputMode === 'manual' && styles.modeButtonActive]}
        onPress={() => setInputMode('manual')}
      >
        <Ionicons
          name="create-outline"
          size={20}
          color={inputMode === 'manual' ? '#FFFFFF' : '#6B7280'}
        />
        <Text style={[styles.modeButtonText, inputMode === 'manual' && styles.modeButtonTextActive]}>
          Manual
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.modeButton, inputMode === 'url' && styles.modeButtonActive]}
        onPress={() => setInputMode('url')}
      >
        <Ionicons
          name="link-outline"
          size={20}
          color={inputMode === 'url' ? '#FFFFFF' : '#6B7280'}
        />
        <Text style={[styles.modeButtonText, inputMode === 'url' && styles.modeButtonTextActive]}>
          Paste URL
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.modeButton, inputMode === 'screenshot' && styles.modeButtonActive]}
        onPress={() => setInputMode('screenshot')}
      >
        <Ionicons
          name="camera-outline"
          size={20}
          color={inputMode === 'screenshot' ? '#FFFFFF' : '#6B7280'}
        />
        <Text style={[styles.modeButtonText, inputMode === 'screenshot' && styles.modeButtonTextActive]}>
          Screenshot
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderUrlInput = () => (
    <View style={styles.aiSection}>
      <View style={styles.aiHeader}>
        <Ionicons name="sparkles" size={24} color="#4F46E5" />
        <Text style={styles.aiTitle}>AI-Powered Extraction</Text>
      </View>
      <Text style={styles.aiDescription}>
        Paste a link from Instagram, TikTok, Facebook, or any sale post and we'll automatically extract the details.
      </Text>

      <View style={styles.urlInputContainer}>
        <TextInput
          style={styles.urlInput}
          placeholder="https://www.instagram.com/p/..."
          value={pastedUrl}
          onChangeText={setPastedUrl}
          autoCapitalize="none"
          keyboardType="url"
        />
        <TouchableOpacity style={styles.pasteButton} onPress={handlePasteUrl}>
          <Ionicons name="clipboard-outline" size={20} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.extractButton, aiLoading && styles.extractButtonDisabled]}
        onPress={handleExtractFromUrl}
        disabled={aiLoading || !pastedUrl}
      >
        {aiLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="flash-outline" size={20} color="#FFFFFF" />
            <Text style={styles.extractButtonText}>Extract Sale Info</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.platformIcons}>
        <Ionicons name="logo-instagram" size={24} color="#E1306C" />
        <Ionicons name="logo-tiktok" size={24} color="#000000" />
        <Ionicons name="logo-facebook" size={24} color="#1877F2" />
        <Ionicons name="send" size={24} color="#0088cc" />
      </View>
    </View>
  );

  const renderScreenshotInput = () => (
    <View style={styles.aiSection}>
      <View style={styles.aiHeader}>
        <Ionicons name="camera" size={24} color="#4F46E5" />
        <Text style={styles.aiTitle}>Screenshot Analysis</Text>
      </View>
      <Text style={styles.aiDescription}>
        Take a photo or select a screenshot of a sale post. Our AI will extract all the details automatically.
      </Text>

      {screenshotUri ? (
        <View style={styles.screenshotPreview}>
          <Image source={{ uri: screenshotUri }} style={styles.screenshotImage} />
          <TouchableOpacity
            style={styles.removeScreenshot}
            onPress={() => setScreenshotUri(null)}
          >
            <Ionicons name="close-circle" size={28} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.screenshotButtons}>
          <TouchableOpacity
            style={[styles.screenshotButton, aiLoading && styles.extractButtonDisabled]}
            onPress={handleTakeScreenshot}
            disabled={aiLoading}
          >
            {aiLoading ? (
              <ActivityIndicator color="#4F46E5" />
            ) : (
              <>
                <Ionicons name="camera" size={32} color="#4F46E5" />
                <Text style={styles.screenshotButtonText}>Take Photo</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.screenshotButton, aiLoading && styles.extractButtonDisabled]}
            onPress={handlePickImage}
            disabled={aiLoading}
          >
            {aiLoading ? (
              <ActivityIndicator color="#4F46E5" />
            ) : (
              <>
                <Ionicons name="images" size={32} color="#4F46E5" />
                <Text style={styles.screenshotButtonText}>From Gallery</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderManualForm = () => (
    <>
      {aiExtracted && aiConfidence && (
        <View style={styles.aiNotice}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.aiNoticeText}>
            AI extracted ({Math.round(aiConfidence * 100)}% confidence) - Please review
          </Text>
        </View>
      )}

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
    </>
  );

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
        {/* Input Mode Selector */}
        {renderInputModeSelector()}

        {/* Content based on mode */}
        {inputMode === 'url' && renderUrlInput()}
        {inputMode === 'screenshot' && renderScreenshotInput()}
        {inputMode === 'manual' && renderManualForm()}

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
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: '#4F46E5',
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  aiSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  aiDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  urlInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  urlInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#111827',
  },
  pasteButton: {
    padding: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
  },
  extractButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  extractButtonDisabled: {
    opacity: 0.7,
  },
  extractButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  platformIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
    opacity: 0.6,
  },
  screenshotButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  screenshotButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 24,
    gap: 8,
  },
  screenshotButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
  },
  screenshotPreview: {
    position: 'relative',
    alignItems: 'center',
  },
  screenshotImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    resizeMode: 'contain',
  },
  removeScreenshot: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  aiNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  aiNoticeText: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '500',
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
