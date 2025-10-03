import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-gesture-handler';
import { AuthProvider } from './src/contexts/AuthContext';
import { AuthNavigator } from './src/navigation/AuthNavigator';

// Silenciar logs verbosos en desarrollo (mantener warnings/errores visibles)
if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log = () => {};
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <AuthNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
