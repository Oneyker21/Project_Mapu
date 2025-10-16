import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { colors } from '../../config/colors';

const CentersMapScreen = ({ navigation, route }) => {
  const { centers = [] } = route.params || {};
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesita permiso de ubicación para mostrar el mapa');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const iconMap = {
      'Hoteles': 'bed',
      'Restaurantes': 'restaurant',
      'Museos': 'library',
      'Parques': 'leaf',
      'Playas': 'water',
      'Montañas': 'mountain',
      'Centros Históricos': 'business',
      'Aventura': 'flash',
      'Ecoturismo': 'leaf',
      'Cultura': 'musical-notes',
      'Gastronomía': 'restaurant',
      'Artesanías': 'construct',
      'Otros': 'location'
    };
    return iconMap[category] || 'location';
  };

  const getMarkerColor = (category) => {
    const colorMap = {
      'Hoteles': '#3B82F6',
      'Restaurantes': '#10B981',
      'Museos': '#8B5CF6',
      'Parques': '#059669',
      'Playas': '#0EA5E9',
      'Montañas': '#7C2D12',
      'Centros Históricos': '#DC2626',
      'Aventura': '#EA580C',
      'Ecoturismo': '#16A34A',
      'Cultura': '#9333EA',
      'Gastronomía': '#CA8A04',
      'Artesanías': '#BE185D',
      'Otros': '#6B7280'
    };
    return colorMap[category] || '#6B7280';
  };

  const fitToMarkers = () => {
    if (mapRef.current && centers.length > 0) {
      const coordinates = centers.map(center => ({
        latitude: parseFloat(center.latitude || center.lat || 12.4318),
        longitude: parseFloat(center.longitude || center.lng || -85.8318)
      }));

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  const initialRegion = {
    latitude: 12.4318, // Juigalpa por defecto
    longitude: -85.8318,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Centros en el Mapa</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando mapa...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Centros en el Mapa</Text>
        <TouchableOpacity 
          style={styles.fitButton}
          onPress={fitToMarkers}
        >
          <Ionicons name="locate" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Mapa */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={userLocation ? {
          ...userLocation,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        } : initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {/* Marcador del usuario */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Tu ubicación"
            pinColor="#3B82F6"
          />
        )}

        {/* Marcadores de centros */}
        {centers.map((center, index) => {
          const lat = parseFloat(center.latitude || center.lat || 12.4318);
          const lng = parseFloat(center.longitude || center.lng || -85.8318);
          
          return (
            <Marker
              key={center.id || index}
              coordinate={{ latitude: lat, longitude: lng }}
              title={center.businessName || center.nombreNegocio || 'Centro Turístico'}
              pinColor={getMarkerColor(center.category || center.categoriaNegocio)}
            >
              <Callout style={styles.callout}>
                <View style={styles.calloutContent}>
                  <Text style={styles.calloutTitle}>
                    {center.businessName || center.nombreNegocio || 'Centro Turístico'}
                  </Text>
                  <Text style={styles.calloutCategory}>
                    {center.category || center.categoriaNegocio || 'Otros'}
                  </Text>
                  <Text style={styles.calloutDepartment}>
                    {center.department || center.departamento || 'Departamento'}
                  </Text>
                  {center.address && (
                    <Text style={styles.calloutAddress}>{center.address}</Text>
                  )}
                  <TouchableOpacity
                    style={styles.calloutButton}
                    onPress={() => navigation.navigate('CenterDetail', { center })}
                  >
                    <Text style={styles.calloutButtonText}>Ver detalles</Text>
                  </TouchableOpacity>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Información de centros */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          {centers.length} centro{centers.length !== 1 ? 's' : ''} encontrado{centers.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  fitButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6B7280',
  },
  callout: {
    width: 200,
  },
  calloutContent: {
    padding: 8,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  calloutCategory: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    marginBottom: 2,
  },
  calloutDepartment: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  calloutAddress: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  calloutButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  calloutButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  infoContainer: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default CentersMapScreen;
