import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DiscoverStackParamList } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import api from '../../services/api';

type Props = {
  navigation: StackNavigationProp<DiscoverStackParamList, 'ReportSale'>;
};

const CATEGORIES = ['clothing', 'shoes', 'electronics', 'home_goods', 'beauty', 'sports', 'food', 'other'];

const ReportSaleScreen: React.FC<Props> = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleGetLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is needed to pin the sale location.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
      setLocationLabel(`${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
    } catch (e: any) {
      Alert.alert('Location Error', e.message);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title || title.length < 3) {
      Alert.alert('Error', 'Title is required (min 3 characters)');
      return;
    }
    if (!discountPercentage || parseInt(discountPercentage) <= 0) {
      Alert.alert('Error', 'Discount percentage is required');
      return;
    }

    setLoading(true);
    try {
      const body: any = {
        title,
        description,
        discountPercentage: parseInt(discountPercentage),
        category: category || 'other',
      };
      if (originalPrice) body.originalPrice = parseFloat(originalPrice);
      if (salePrice) body.salePrice = parseFloat(salePrice);
      if (storeName) body.storeName = storeName;
      if (latitude != null && longitude != null) {
        body.latitude = latitude;
        body.longitude = longitude;
      }

      await api.post('/sales-report', body);
      setSubmitted(true);
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message || 'Failed to submit';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <Ionicons name="checkmark-circle" size={80} color="#10B981" />
        <Text style={styles.successTitle}>Sale Reported!</Text>
        <Text style={styles.successText}>Thank you for helping the community find great deals.</Text>
        <TouchableOpacity style={styles.successButton} onPress={() => navigation.goBack()}>
          <Text style={styles.successButtonText}>Back to Map</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sale Info</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 50% off Nike shoes"
            value={title}
            onChangeText={setTitle}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            placeholder="Any extra details..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pricing</Text>
        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.col]}>
            <Text style={styles.label}>Discount % *</Text>
            <TextInput
              style={styles.input}
              placeholder="30"
              value={discountPercentage}
              onChangeText={setDiscountPercentage}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.inputGroup, styles.col]}>
            <Text style={styles.label}>Original ₪</Text>
            <TextInput
              style={styles.input}
              placeholder="200"
              value={originalPrice}
              onChangeText={setOriginalPrice}
              keyboardType="numeric"
            />
          </View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Sale Price ₪</Text>
          <TextInput
            style={styles.input}
            placeholder="140"
            value={salePrice}
            onChangeText={setSalePrice}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.chipActive]}
              onPress={() => setCategory(cat === category ? null : cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                {cat.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Store (optional)</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Store Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Nike Store Tel Aviv"
            value={storeName}
            onChangeText={setStoreName}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <TouchableOpacity
          style={[styles.locationButton, latitude != null && styles.locationButtonActive]}
          onPress={handleGetLocation}
          disabled={locationLoading}
        >
          <Ionicons name={latitude != null ? 'checkmark-circle' : 'locate'} size={22} color={latitude != null ? '#10B981' : '#4F46E5'} />
          <Text style={[styles.locationButtonText, latitude != null && styles.locationButtonTextActive]}>
            {locationLoading ? 'Getting location...' : latitude != null ? `Pinned: ${locationLabel}` : 'Pin My Current Location'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="send" size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>Report Sale</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  inputMulti: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  chipText: {
    fontSize: 14,
    color: '#374151',
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  locationButtonActive: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  locationButtonText: {
    fontSize: 15,
    color: '#4F46E5',
    fontWeight: '600',
  },
  locationButtonTextActive: {
    color: '#10B981',
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F9FAFB',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 20,
  },
  successText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  successButton: {
    marginTop: 32,
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReportSaleScreen;
