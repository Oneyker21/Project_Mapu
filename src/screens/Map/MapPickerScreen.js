import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Alert, ActivityIndicator } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Button } from '../../components';
import { MaterialIcons } from '@expo/vector-icons';

const DEFAULT_REGION = {
  latitude: 12.136389,
  longitude: -86.251389,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

const MapPickerScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const initial = route?.params?.initialCoords;

  // 🔑 Si hay ubicación guardada, arrancamos ahí. Si no, arrancamos con default.
  const [region, setRegion] = useState(
    initial
      ? { ...initial, latitudeDelta: 0.02, longitudeDelta: 0.02 }
      : DEFAULT_REGION
  );

  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(!!initial); // si hay initial, ya podemos mostrar mapa
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    // 🟢 Solo buscamos ubicación si NO hay coordenadas iniciales
    if (!initial) {
      getCurrentLocation();
    }
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos de ubicación',
          'Se necesitan permisos de ubicación para obtener tu posición actual.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error al solicitar permisos:', error);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setLoading(false);
        setMapReady(true);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      const newRegion = { latitude, longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 };

      setUserLocation({ latitude, longitude });
      setRegion(newRegion);
    } catch (error) {
      console.error('Error al obtener ubicación:', error);
      Alert.alert(
        'Error de ubicación',
        'No se pudo obtener tu ubicación actual. Usando ubicación por defecto.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setMapReady(true);
    }
  };

  const confirm = () => {
    if (route?.params?.onPick) {
      route.params.onPick({ latitude: region.latitude, longitude: region.longitude });
    }
    navigation.goBack();
  };

  if (!mapReady) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 10 }}>Cargando mapa...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={false}
        followsUserLocation={false}
        onRegionChangeComplete={(r) => setRegion(r)}
        onMapReady={() => setMapReady(true)}
      />

      {/* Pin fijo */}
      <View style={styles.markerFixed}>
        <MaterialIcons name="location-pin" size={40} color="red" />
      </View>

      <View style={styles.footer}>
        <Text style={styles.coordsText}>
          Lat: {region.latitude.toFixed(6)}, Lng: {region.longitude.toFixed(6)}
        </Text>
        <View style={styles.buttonContainer}>
          <Button
            title="Mi ubicación"
            onPress={getCurrentLocation}
            loading={loading}
            variant="secondary"
            style={styles.locationButton}
          />
          <Button
            title="Confirmar ubicación"
            onPress={confirm}
            style={styles.confirmButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  markerFixed: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -16,
    marginTop: 10,
    zIndex: 999,
  },
  footer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    gap: 12,
  },
  coordsText: {
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonContainer: { flexDirection: 'row', gap: 12 },
  locationButton: { flex: 1 },
  confirmButton: { flex: 1 },
});

export default MapPickerScreen;
