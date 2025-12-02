import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../types';
import { Ionicons } from '@expo/vector-icons';

type WelcomeScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Welcome'>;

interface Props {
  navigation: WelcomeScreenNavigationProp;
}

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Icon */}
        <View style={styles.logoContainer}>
          <Ionicons name="pricetag" size={80} color="#4F46E5" />
          <Text style={styles.appName}>MySellGuid</Text>
          <Text style={styles.tagline}>Never miss a sale again</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Ionicons name="location" size={24} color="#4F46E5" />
            <Text style={styles.featureText}>Find nearby sales</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="notifications" size={24} color="#4F46E5" />
            <Text style={styles.featureText}>Real-time alerts</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="heart" size={24} color="#4F46E5" />
            <Text style={styles.featureText}>Save your favorites</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  tagline: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  featuresContainer: {
    marginVertical: 40,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  buttonsContainer: {
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WelcomeScreen;
