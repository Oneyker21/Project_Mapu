import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { GOOGLE_MAPS_CONFIG } from '../config/googleMaps';

const SafeMapView = ({ children, style, ...props }) => {
  const [mapError, setMapError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si la API key está configurada
    if (!GOOGLE_MAPS_CONFIG.API_KEY || GOOGLE_MAPS_CONFIG.API_KEY === 'TU_GOOGLE_MAPS_API_KEY_AQUI') {
      console.warn('Google Maps API Key no configurada');
      setMapError(true);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }

  if (mapError) {
    return (
      <View style={[styles.container, style, styles.errorContainer]}>
        <Text style={styles.errorText}>Mapa no disponible</Text>
        <Text style={styles.errorSubtext}>Verifica la configuración de Google Maps</Text>
      </View>
    );
  }

  try {
    return (
      <MapView
        provider={PROVIDER_GOOGLE}
        style={[styles.map, style]}
        onError={(error) => {
          console.error('Error en MapView:', error);
          setMapError(true);
        }}
        {...props}
      >
        {children}
      </MapView>
    );
  } catch (error) {
    console.error('Error al renderizar MapView:', error);
    return (
      <View style={[styles.container, style, styles.errorContainer]}>
        <Text style={styles.errorText}>Error al cargar el mapa</Text>
        <Text style={styles.errorSubtext}>Intenta reiniciar la aplicación</Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  map: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default SafeMapView;
