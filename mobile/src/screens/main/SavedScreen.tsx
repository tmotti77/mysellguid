import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SavedScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved</Text>
      </View>
      <View style={styles.content}>
        <Ionicons name="bookmark-outline" size={64} color="#6B7280" />
        <Text style={styles.title}>No Saved Sales Yet</Text>
        <Text style={styles.subtitle}>
          Sales you bookmark will appear here
        </Text>
        <Text style={styles.info}>
          {'\n'}Features:
          {'\n'}- Save favorite sales
          {'\n'}- Quick access to saved items
          {'\n'}- Notifications for saved sale updates
        </Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  info: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default SavedScreen;
