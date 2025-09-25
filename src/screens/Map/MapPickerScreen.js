import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Alert, PermissionsAndroid, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Button } from '../../components';

const DEFAULT_REGION = {
  latitude: 12.136389,
  longitude: -86.251389,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

const MapPickerScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const initial = route?.params?.initialCoords;
  const [coords, setCoords] = useState(initial || { latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude });
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCurrentLocation();
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
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      const newCoords = { latitude, longitude };
      
      setUserLocation(newCoords);
      setCoords(newCoords);
    } catch (error) {
      console.error('Error al obtener ubicación:', error);
      Alert.alert(
        'Error de ubicación',
        'No se pudo obtener tu ubicación actual. Usando ubicación por defecto.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const onMapPress = (e) => {
    setCoords(e.nativeEvent.coordinate);
  };

  const confirm = () => {
    if (route?.params?.onPick) {
      route.params.onPick(coords);
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}> 
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{ 
          ...DEFAULT_REGION, 
          ...(userLocation || initial || {})
        }}
        onPress={onMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
        followsUserLocation={false}
      >
        {coords && (
          <Marker 
            coordinate={coords} 
            title="Ubicación seleccionada"
            description="Toca el mapa para cambiar la ubicación"
          />
        )}
        {userLocation && (
          <Marker 
            coordinate={userLocation} 
            pinColor="blue"
            title="Mi ubicación"
            description="Tu ubicación actual"
          />
        )}
      </MapView>
      <View style={styles.footer}>
        <Text style={styles.coordsText}>
          Lat: {coords.latitude.toFixed(6)}, Lng: {coords.longitude.toFixed(6)}
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
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  locationButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
  },
});

export default MapPickerScreen;


