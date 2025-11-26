import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContextSimple';
import { SimpleNavigator } from './src/navigation/SimpleNavigator';

// Componente de error boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error en la aplicación:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error en la aplicación</Text>
          <Text style={styles.errorText}>
            {this.state.error?.message || 'Ha ocurrido un error inesperado'}
          </Text>
          <Text style={styles.errorSubtext}>
            Por favor, reinicia la aplicación
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function AppTest() {
  try {
    return (
      <ErrorBoundary>
        <SafeAreaProvider>
          <AuthProvider>
            <NavigationContainer>
              <SimpleNavigator />
            </NavigationContainer>
          </AuthProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Error al inicializar la aplicación:', error);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error de inicialización</Text>
        <Text style={styles.errorText}>
          No se pudo inicializar la aplicación
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
