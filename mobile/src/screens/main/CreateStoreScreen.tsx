import React, { useState } from 'react';
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
import { ProfileStackParamList } from '../../types';
import { storesService } from '../../services/api';

type CreateStoreScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'CreateStore'>;

interface Props {
  navigation: CreateStoreScreenNavigationProp;
}

const CATEGORIES = [
  { id: 'fashion', label: 'Fashion', icon: 'shirt-outline' },
  { id: 'electronics', label: 'Electronics', icon: 'phone-portrait-outline' },
  { id: 'home', label: 'Home', icon: 'home-outline' },
  { id: 'beauty', label: 'Beauty', icon: 'sparkles-outline' },
  { id: 'sports', label: 'Sports', icon: 'fitness-outline' },
  { id: 'food', label: 'Food', icon: 'fast-food-outline' },
  { id: 'shoes', label: 'Shoes', icon: 'footsteps-outline' },
  { id: 'other', label: 'Other', icon: 'pricetag-outline' },
];

const CreateStoreScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('fashion');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Required', 'Please enable location to auto-fill coordinates');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      // Try to get address from coordinates
      const [addressResult] = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (addressResult) {
        if (addressResult.street && addressResult.streetNumber) {
          setAddress(`${addressResult.street} ${addressResult.streetNumber}`);
        } else if (addressResult.street) {
          setAddress(addressResult.street);
        }
        if (addressResult.city) {
          setCity(addressResult.city);
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setGettingLocation(false);
    }
  };

  const validateForm = (): boolean => {
    if (!name.trim() || name.length < 2) {
      Alert.alert('Error', 'Please enter a store name (at least 2 characters)');
      return false;
    }
    if (!address.trim() || address.length < 5) {
      Alert.alert('Error', 'Please enter an address (at least 5 characters)');
      return false;
    }
    if (!city.trim() || city.length < 2) {
      Alert.alert('Error', 'Please enter a city');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const storeData = {
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        address: address.trim(),
        city: city.trim(),
        country: 'Israel',
        phoneNumber: phoneNumber.trim() || undefined,
        email: email.trim() || undefined,
        website: website.trim() || undefined,
        instagramHandle: instagramHandle.trim() || undefined,
        latitude: location?.latitude,
        longitude: location?.longitude,
      };

      await storesService.create(storeData);

      Alert.alert(
        'Success!',
        'Your store has been registered successfully. You can now post sales!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating store:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to register store. Please try again.'
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
        <Text style={styles.headerTitle}>Register Store</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Store Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Store Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Fashion Paradise"
            value={name}
            onChangeText={setName}
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell customers about your store..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            maxLength={1000}
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

        {/* Location Button */}
        <View style={styles.inputGroup}>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={getCurrentLocation}
            disabled={gettingLocation}
          >
            {gettingLocation ? (
              <ActivityIndicator size="small" color="#4F46E5" />
            ) : (
              <Ionicons name="locate-outline" size={20} color="#4F46E5" />
            )}
            <Text style={styles.locationButtonText}>
              {gettingLocation ? 'Getting location...' : 'Use Current Location'}
            </Text>
          </TouchableOpacity>
          {location && (
            <Text style={styles.locationText}>
              Location set: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </Text>
          )}
        </View>

        {/* Address */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Dizengoff St 123"
            value={address}
            onChangeText={setAddress}
            maxLength={200}
          />
        </View>

        {/* City */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Tel Aviv"
            value={city}
            onChangeText={setCity}
            maxLength={100}
          />
        </View>

        {/* Contact Info */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contact Information</Text>
          <TextInput
            style={[styles.input, { marginBottom: 10 }]}
            placeholder="Phone (e.g., 050-123-4567)"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Social Media */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Social Media (Optional)</Text>
          <TextInput
            style={[styles.input, { marginBottom: 10 }]}
            placeholder="Website URL"
            value={website}
            onChangeText={setWebsite}
            keyboardType="url"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Instagram handle (e.g., @mystore)"
            value={instagramHandle}
            onChangeText={setInstagramHandle}
            autoCapitalize="none"
          />
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
              <Ionicons name="storefront-outline" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Register Store</Text>
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
    height: 80,
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
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    padding: 14,
    gap: 8,
  },
  locationButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4F46E5',
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
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

export default CreateStoreScreen;
