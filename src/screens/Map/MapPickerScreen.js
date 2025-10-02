import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text, Alert, ActivityIndicator, Platform, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Button } from '../../components';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const DEFAULT_REGION = {
  latitude: 12.1167,
  longitude: -85.3667,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

const MapPickerScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const initial = route?.params?.initialCoords;
  const onPick = route?.params?.onPick;
  const onError = route?.params?.onError;
  
  console.log('MapPickerScreen - Parámetros recibidos:', route?.params);


  // 🔑 Si hay ubicación guardada, arrancamos ahí. Si no, arrancamos con default.
  const [region, setRegion] = useState(
    initial
      ? { ...initial, latitudeDelta: 0.01, longitudeDelta: 0.01 }
      : DEFAULT_REGION
  );

  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(!!initial);
  const [mapType, setMapType] = useState('standard'); // 'standard' o 'satellite'
  const [userLocation, setUserLocation] = useState(null);
  const [showUserLocation, setShowUserLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Coordenadas de departamentos y ciudades principales de Nicaragua
  const lugares = {
    // Departamentos
    'Managua': { latitude: 12.136389, longitude: -86.251389, tipo: 'Departamento' },
    'León': { latitude: 12.4344, longitude: -86.8774, tipo: 'Departamento' },
    'Granada': { latitude: 11.9344, longitude: -85.9561, tipo: 'Departamento' },
    'Masaya': { latitude: 11.9744, longitude: -86.0942, tipo: 'Departamento' },
    'Carazo': { latitude: 11.7272, longitude: -86.2158, tipo: 'Departamento' },
    'Rivas': { latitude: 11.4372, longitude: -85.8261, tipo: 'Departamento' },
    'Chinandega': { latitude: 12.6244, longitude: -87.1306, tipo: 'Departamento' },
    'Estelí': { latitude: 13.0914, longitude: -86.3536, tipo: 'Departamento' },
    'Matagalpa': { latitude: 12.9244, longitude: -85.9175, tipo: 'Departamento' },
    'Jinotega': { latitude: 13.0914, longitude: -86.0014, tipo: 'Departamento' },
    'Nueva Segovia': { latitude: 13.7667, longitude: -86.3833, tipo: 'Departamento' },
    'Madriz': { latitude: 13.4667, longitude: -86.4167, tipo: 'Departamento' },
    'Boaco': { latitude: 12.4667, longitude: -85.6667, tipo: 'Departamento' },
    'Chontales': { latitude: 12.1167, longitude: -85.3667, tipo: 'Departamento' },
    'Río San Juan': { latitude: 11.1333, longitude: -84.8333, tipo: 'Departamento' },
    'Atlántico Norte': { latitude: 14.0333, longitude: -83.3833, tipo: 'Departamento' },
    'Atlántico Sur': { latitude: 12.1667, longitude: -83.8333, tipo: 'Departamento' },
    
    // Ciudades principales
    'Juigalpa': { latitude: 12.1167, longitude: -85.3667, tipo: 'Ciudad' },
    'Jinotepe': { latitude: 11.8500, longitude: -86.2000, tipo: 'Ciudad' },
    'Diriamba': { latitude: 11.8500, longitude: -86.2333, tipo: 'Ciudad' },
    'San Marcos': { latitude: 11.9167, longitude: -86.2000, tipo: 'Ciudad' },
    'Nandaime': { latitude: 11.7500, longitude: -86.0500, tipo: 'Ciudad' },
    'San Juan del Sur': { latitude: 11.2500, longitude: -85.8667, tipo: 'Ciudad' },
    'Ometepe': { latitude: 11.5000, longitude: -85.5833, tipo: 'Isla' },
    'Corn Island': { latitude: 12.1667, longitude: -83.0333, tipo: 'Isla' },
    'Bluefields': { latitude: 12.0167, longitude: -83.7667, tipo: 'Ciudad' },
    'Puerto Cabezas': { latitude: 14.0333, longitude: -83.3833, tipo: 'Ciudad' },
    'Somoto': { latitude: 13.4667, longitude: -86.5833, tipo: 'Ciudad' },
    'Ocotal': { latitude: 13.6333, longitude: -86.4667, tipo: 'Ciudad' },
    'Somotillo': { latitude: 12.9167, longitude: -86.9167, tipo: 'Ciudad' },
    'El Viejo': { latitude: 12.6667, longitude: -87.1667, tipo: 'Ciudad' },
    'Chichigalpa': { latitude: 12.5667, longitude: -87.0167, tipo: 'Ciudad' },
    'Posoltega': { latitude: 12.5500, longitude: -86.9833, tipo: 'Ciudad' },
    'El Sauce': { latitude: 12.8833, longitude: -86.5333, tipo: 'Ciudad' },
    'Larreynaga': { latitude: 12.6667, longitude: -86.5667, tipo: 'Ciudad' },
    'Achuapa': { latitude: 13.0500, longitude: -86.5833, tipo: 'Ciudad' },
    'El Jicaral': { latitude: 12.7167, longitude: -86.3833, tipo: 'Ciudad' },
    'La Paz Centro': { latitude: 12.3333, longitude: -86.6667, tipo: 'Ciudad' },
    'Nagarote': { latitude: 12.2667, longitude: -86.5667, tipo: 'Ciudad' },
    'El Crucero': { latitude: 12.0167, longitude: -86.3167, tipo: 'Ciudad' },
    'Ticuantepe': { latitude: 12.0167, longitude: -86.2000, tipo: 'Ciudad' },
    'San Rafael del Sur': { latitude: 11.8500, longitude: -86.4333, tipo: 'Ciudad' },
    'Villa El Carmen': { latitude: 12.0167, longitude: -86.2000, tipo: 'Ciudad' },
    'Mateare': { latitude: 12.2167, longitude: -86.4333, tipo: 'Ciudad' },
    'Ciudad Sandino': { latitude: 12.1667, longitude: -86.3500, tipo: 'Ciudad' },
    'Tipitapa': { latitude: 12.2000, longitude: -86.1000, tipo: 'Ciudad' },
    'San Francisco Libre': { latitude: 12.5000, longitude: -86.2500, tipo: 'Ciudad' },
    'Villa Carlos Fonseca': { latitude: 11.9833, longitude: -86.3167, tipo: 'Ciudad' }
  };

  useEffect(() => {
    // 🟢 Solo buscamos ubicación si NO hay coordenadas iniciales
    if (!initial) {
      getCurrentLocation();
    }
  }, []);

  // Efecto para actualizar la región cuando cambien las coordenadas iniciales
  useEffect(() => {
    if (initial) {
      const newRegion = {
        ...initial,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      };
      // Deshabilitar animación al actualizar región
      setIsAnimating(true);
      setRegion(newRegion);
      setMapReady(true);
      // Rehabilitar después de un breve delay
      setTimeout(() => setIsAnimating(false), 100);
    }
  }, [initial]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const permissionError = new Error('Permission denied: Location permission not granted');
        permissionError.code = 'PERMISSION_DENIED';
        
        if (onError) {
          onError(permissionError);
        } else {
          Alert.alert(
            'Permisos de ubicación',
            'Se necesitan permisos de ubicación para obtener tu posición actual.',
            [{ text: 'OK' }]
          );
        }
        return false;
      }
      return true;
    } catch (error) {
      // Solo logear para debugging interno, no mostrar al usuario
      console.log('Error interno de permisos:', error.message);
      
      if (onError) {
        onError(error);
      }
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
      setShowUserLocation(true);
    } catch (error) {
      // Solo logear para debugging interno, no mostrar al usuario
      console.log('Error interno de ubicación:', error.message);
      
      // Usar callback personalizado si está disponible, sino mostrar alerta genérica
      if (onError) {
        onError(error);
      } else {
        Alert.alert(
          'Error de ubicación',
          'No se pudo obtener tu ubicación actual. Usando ubicación por defecto.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
      setMapReady(true);
    }
  };

  const confirm = () => {
    if (route?.params?.onPick) {
      // Usar las coordenadas exactas del centro de la pantalla (donde está la cruz)
      const centerLatitude = region.latitude;
      const centerLongitude = region.longitude;
      
      route.params.onPick({ 
        latitude: Number(centerLatitude.toFixed(8)), 
        longitude: Number(centerLongitude.toFixed(8)) 
      });
    }
    navigation.goBack();
  };

  const toggleMapType = () => {
    setMapType(prev => prev === 'standard' ? 'satellite' : 'standard');
  };

  const searchLugar = (query) => {
    if (!query.trim() || isAnimating) return;
    
    // Buscar coincidencias exactas primero
    let lugar = Object.keys(lugares).find(
      lugar => lugar.toLowerCase() === query.toLowerCase()
    );
    
    // Si no hay coincidencia exacta, buscar parcial
    if (!lugar) {
      lugar = Object.keys(lugares).find(
        lugar => lugar.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    if (lugar) {
      const coords = lugares[lugar];
      const newRegion = {
        latitude: Number(coords.latitude.toFixed(8)),
        longitude: Number(coords.longitude.toFixed(8)),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      // Iniciar animación
      setIsAnimating(true);
      setRegion(newRegion);
      setSearchQuery(lugar);
      setShowSearch(false);
      
      // Mostrar confirmación después de la animación
      setTimeout(() => {
        Alert.alert('Ubicación encontrada', `Navegando a ${lugar}`);
        setIsAnimating(false);
      }, 1200);
    } else {
      Alert.alert('No encontrado', 'Lugar no encontrado. Intenta con otro nombre.');
    }
  };

  const filteredLugares = Object.keys(lugares).filter(lugar =>
    lugar.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Memoizar la región para evitar re-renders innecesarios
  const memoizedRegion = useMemo(() => region, [region.latitude, region.longitude, region.latitudeDelta, region.longitudeDelta]);

  if (!mapReady) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 10 }}>Cargando mapa...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Botón flotante de volver atrás */}
      <TouchableOpacity 
        style={[styles.floatingBackButton, { top: insets.top + 16 }]} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#374151" />
      </TouchableOpacity>

          {/* Botón flotante para cambiar tipo de mapa */}
          <TouchableOpacity 
            style={[styles.floatingMapTypeButton, { top: insets.top + 16 }]} 
            onPress={toggleMapType}
          >
            <Ionicons 
              name={mapType === 'standard' ? 'globe' : 'map'} 
              size={20} 
              color="#374151" 
            />
          </TouchableOpacity>

          {/* Botón flotante para búsqueda */}
          <TouchableOpacity 
            style={[styles.floatingSearchButton, { top: insets.top + 16 }]} 
            onPress={() => setShowSearch(!showSearch)}
          >
            <Ionicons 
              name="search" 
              size={20} 
              color="#374151" 
            />
          </TouchableOpacity>

          {/* Campo de búsqueda */}
          {showSearch && (
            <View style={[styles.searchContainer, { top: insets.top + 70 }]}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar lugar (ej: Juigalpa, Granada...)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={() => searchLugar(searchQuery)}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Lista de lugares filtrados */}
              {searchQuery.length > 0 && filteredLugares.length > 0 && (
                <View style={styles.lugaresList}>
                  {filteredLugares.map((lugar) => (
                    <TouchableOpacity
                      key={lugar}
                      style={styles.lugarItem}
                      onPress={() => searchLugar(lugar)}
                    >
                      <Ionicons 
                        name={lugares[lugar].tipo === 'Departamento' ? 'map' : 
                              lugares[lugar].tipo === 'Ciudad' ? 'location' : 'island'} 
                        size={16} 
                        color="#3B82F6" 
                      />
                      <View style={styles.lugarInfo}>
                        <Text style={styles.lugarText}>{lugar}</Text>
                        <Text style={styles.lugarTipo}>{lugares[lugar].tipo}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={memoizedRegion}
        mapType={mapType}
        showsUserLocation={true}
        showsMyLocationButton={false}
        followsUserLocation={false}
        onRegionChangeComplete={(r) => !isAnimating && setRegion(r)}
        onMapReady={() => setMapReady(true)}
        animateToRegion={false}
        animationDuration={0}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
      >
        {/* Marcador estático para ubicación registrada */}
        {initial && (
          <Marker
            coordinate={{
              latitude: initial.latitude,
              longitude: initial.longitude
            }}
            title="Ubicación Registrada"
            description={`${initial.latitude.toFixed(6)}, ${initial.longitude.toFixed(6)}`}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.centerPinContainer}>
              <View style={styles.centerPin}>
                <Ionicons name="business" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.centerPinTail} />
            </View>
          </Marker>
        )}
        
        {/* Marcador del centro de la cruz en tiempo real - invisible y sin callout */}
        <Marker
          coordinate={{
            latitude: region.latitude,
            longitude: region.longitude
          }}
          pinColor="transparent"
          opacity={0}
        />
      </MapView>

      {/* Cruz de precisión - centrada exactamente donde estaba el marcador rojo */}
      <View style={[
        styles.crosshairContainer,
        {
          top: '41%',  // Ajuste mínimo para que la punta de arriba capture
          left: '50%',
          marginLeft: -15,
          marginTop: -15,
        }
      ]}>
        {/* Cruz horizontal */}
        <View style={styles.crosshairHorizontal} />
        {/* Cruz vertical */}
        <View style={styles.crosshairVertical} />
        {/* Punto central */}
        <View style={styles.crosshairCenter} />
        <View style={styles.pinIndicator}>
          <Text style={styles.pinText}>Capturar aquí</Text>
        </View>
      </View>


      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.coordsText}>
          Lat: {region.latitude.toFixed(8)}, Lng: {region.longitude.toFixed(8)}
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={getCurrentLocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#6B7280" />
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="locate" size={18} color="#374151" />
                <Text style={styles.locationButtonText}>Mi ubicación</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={confirm}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>Confirmar</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Botón flotante
  floatingBackButton: {
    position: 'absolute',
    left: 16,
    zIndex: 1000,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  floatingMapTypeButton: {
    position: 'absolute',
    right: 16,
    zIndex: 1000,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  floatingSearchButton: {
    position: 'absolute',
    right: 80,
    zIndex: 1000,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // Estilos del buscador
  searchContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  lugaresList: {
    maxHeight: 200,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  lugarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lugarInfo: {
    marginLeft: 12,
    flex: 1,
  },
  lugarText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  lugarTipo: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  map: {
    flex: 1,
    marginTop: 0, // Eliminar margen superior
  },
  crosshairContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 30,
    height: 30,
    marginLeft: -15,
    marginTop: -15,
    zIndex: 999,
    pointerEvents: 'none', // Para que no interfiera con el toque del mapa
  },
  crosshairHorizontal: {
    position: 'absolute',
    width: 30,
    height: 4,
    backgroundColor: '#FF0000', // Rojo más brillante
    borderRadius: 2,
    top: 13, // (30 - 4) / 2 = 13 - PERFECTO CENTRO
    left: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 3,
  },
  crosshairVertical: {
    position: 'absolute',
    width: 4,
    height: 30,
    backgroundColor: '#FF0000', // Rojo más brillante
    borderRadius: 2,
    top: 0,
    left: 13, // (30 - 4) / 2 = 13 - PERFECTO CENTRO
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 3,
  },
  crosshairCenter: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000', // Rojo más brillante
    top: 11, // (30 - 8) / 2 = 11 - PERFECTO CENTRO
    left: 11, // (30 - 8) / 2 = 11 - PERFECTO CENTRO
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  coordsText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  buttonContainer: { 
    flexDirection: 'row', 
    gap: 12,
    marginTop: 8,
  },
  locationButton: { 
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  confirmButton: { 
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  locationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  // Marcador tipo pin compacto (igual que HomeScreen)
  centerPinContainer: {
    alignItems: 'center',
  },
  centerPin: {
    backgroundColor: '#10B981',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 6,
  },
  centerPinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#10B981',
    marginTop: -1,
  },
  pinIndicator: {
    position: 'absolute',
    top: 25,
    left: -40,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  pinText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default MapPickerScreen;
