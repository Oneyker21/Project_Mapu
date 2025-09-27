import React from 'react';
import { View, Text, Platform } from 'react-native';

// Fallback para react-native-maps en web
export const MapView = ({ children, ...props }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }}>
        <Text style={{ fontSize: 18, color: '#666', textAlign: 'center' }}>
          Mapa no disponible en web
        </Text>
        <Text style={{ fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8 }}>
          Esta funcionalidad solo está disponible en dispositivos móviles
        </Text>
      </View>
    );
  }
  return null;
};

export const Marker = ({ children, ...props }) => {
  if (Platform.OS === 'web') {
    return null;
  }
  return null;
};

export const PROVIDER_GOOGLE = 'google';

export default MapView;
