import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { theme } from './src/utils/theme';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { I18nProvider } from './src/i18n/i18nContext';
import { warmUpServer } from './src/services/api';

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    warmUpServer();
  }, []);

  return (
    <ErrorBoundary>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <PaperProvider theme={theme}>
              <AuthProvider>
                <NavigationContainer>
                  <StatusBar style="auto" />
                  <RootNavigator />
                </NavigationContainer>
              </AuthProvider>
            </PaperProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}
