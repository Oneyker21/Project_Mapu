import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig.js';

const NearbyCentersScreen = ({ navigation }) => {
  const [centers, setCenters] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      
      if (status === 'granted') {
        await getCurrentLocation();
      } else {
        Alert.alert(
          'Permiso de Ubicación',
          'Necesitamos acceso a tu ubicación para mostrar centros cercanos',
          [{ text: 'OK' }]
        );
        setLoading(false);
      }
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      
      await loadNearbyCenters(location.coords);
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación actual');
      setLoading(false);
    }
  };

  const loadNearbyCenters = async (userCoords) => {
    try {
      const centersSnapshot = await getDocs(collection(db, 'centrosTuristicos'));
      const centersData = [];
      
      centersSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Priorizar latitud/longitud (español) sobre latitude/longitude (inglés)
        let lat = data.latitud || data.latitude || data.lat || data.coordenadas?.lat || data.location?.lat;
        let lng = data.longitud || data.longitude || data.lng || data.coordenadas?.lng || data.location?.lng;
        
        // Si no hay coordenadas, saltar este centro
        if (!lat || !lng) {
          return;
        }
        
        // Convertir a número y validar
        lat = parseFloat(lat);
        lng = parseFloat(lng);
        
        if (isNaN(lat) || isNaN(lng)) {
          return;
        }
        
        const distance = calculateDistance(
          userCoords.latitude,
          userCoords.longitude,
          lat,
          lng
        );
        
        centersData.push({
          id: docSnap.id,
          ...data,
          businessName: data.nombreNegocio || data.businessName,
          category: data.categoriaNegocio || data.category,
          department: data.departamento || data.department || 'No especificado',
          distance: distance,
          coordinate: {
            latitude: lat,
            longitude: lng
          }
        });
      });

      // Ordenar por distancia (más cercanos primero)
      centersData.sort((a, b) => a.distance - b.distance);
      
      setCenters(centersData);
    } catch (error) {
      console.error('Error cargando centros cercanos:', error);
      Alert.alert('Error', 'No se pudieron cargar los centros turísticos');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  const getCategoryIcon = (category) => {
    const categoryIcons = {
      'Hoteles': 'bed',
      'Restaurantes': 'restaurant',
      'Museos': 'library',
      'Parques': 'leaf',
      'Playas': 'beach',
      'Montañas': 'mountain',
      'Centros Históricos': 'library',
      'Aventura': 'bicycle',
      'Ecoturismo': 'leaf',
      'Cultura': 'library',
      'Gastronomía': 'restaurant',
      'Artesanías': 'construct',
      'Otros': 'business'
    };
    
    return categoryIcons[category] || 'business';
  };

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const renderCenterItem = ({ item }) => (
    <TouchableOpacity style={styles.centerItem}>
      <View style={styles.centerInfo}>
        <View style={styles.centerHeader}>
          <View style={styles.centerIconContainer}>
            <Ionicons 
              name={getCategoryIcon(item.category)} 
              size={20} 
              color="#3B82F6" 
            />
          </View>
          <View style={styles.centerTextContainer}>
            <Text style={styles.centerName}>{item.businessName}</Text>
            <Text style={styles.centerCategory}>{item.category}</Text>
            <Text style={styles.centerDepartment}>{item.department}</Text>
            {item.address && (
              <Text style={styles.centerAddress}>{item.address}</Text>
            )}
          </View>
        </View>
        <View style={styles.distanceContainer}>
          <Ionicons name="location" size={16} color="#10B981" />
          <Text style={styles.distanceText}>{formatDistance(item.distance)}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#6B7280" />
    </TouchableOpacity>
  );

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
          <Text style={styles.headerTitle}>Centros Cercanos</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Buscando centros cercanos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (locationPermission !== 'granted') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Centros Cercanos</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="location-outline" size={64} color="#9CA3AF" />
          <Text style={styles.errorTitle}>Ubicación Requerida</Text>
          <Text style={styles.errorText}>
            Necesitamos acceso a tu ubicación para mostrar centros cercanos
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={requestLocationPermission}
          >
            <Text style={styles.retryButtonText}>Intentar de Nuevo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Centros Cercanos</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={() => {
            setLoading(true);
            getCurrentLocation();
          }}
        >
          <Ionicons name="refresh" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>
          Centros cerca de ti ({centers.length})
        </Text>
        
        <FlatList
          data={centers}
          renderItem={renderCenterItem}
          keyExtractor={(item) => item.id}
          style={styles.centersList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>
                No se encontraron centros cercanos
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  refreshButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  centersList: {
    flex: 1,
  },
  centerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  centerInfo: {
    flex: 1,
  },
  centerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  centerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  centerTextContainer: {
    flex: 1,
  },
  centerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  centerCategory: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    marginBottom: 2,
  },
  centerDepartment: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  centerAddress: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default NearbyCentersScreen;

