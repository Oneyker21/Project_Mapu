import React, { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Image, ScrollView, Modal, ActivityIndicator, PanResponder, Animated } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig.js';
import { useAuth } from '../../contexts/AuthContext';

const INITIAL_REGION = {
  latitude: 12.1167,
  longitude: -85.3667,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// Estilo de Google Maps para ocultar Puntos de Interés (POIs), transporte y etiquetas no necesarias
// con el objetivo de mostrar únicamente los centros turísticos registrados en Firestore
const GOOGLE_MAP_STYLE = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.government', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.medical', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.place_of_worship', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.school', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.sports_complex', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [mapRegion, setMapRegion] = useState(INITIAL_REGION);
  const [mapRef, setMapRef] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  
  const [showNotification, setShowNotification] = useState(false);
  const [notificationText, setNotificationText] = useState('');
  const [hasCenteredOnUser, setHasCenteredOnUser] = useState(false);
  // Determinar si el usuario es centro turístico (usa userData o, como fallback, authUser)
  const isCenterUser = (userData?.role === 'centro_turistico' || userData?.tipoUsuario === 'CentroTuristico') || (authUser?.role === 'centro_turistico');
  
  // Función para mostrar notificación flotante
  const showFloatingNotification = (text) => {
    setNotificationText(text);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 2500);
  };

  const loadUserData = async () => {
    try {
      if (authUser) {
        // Determinar la colección según el rol del usuario
        let collectionName = 'turistas'; // Por defecto turistas
        if (authUser.role === 'centro_turistico' || authUser.tipoUsuario === 'CentroTuristico') {
          collectionName = 'centrosTuristicos';
        } else if (authUser.role === 'tourist' || authUser.tipoUsuario === 'Turista') {
          collectionName = 'turistas';
        }

        // Obtener datos adicionales del usuario desde Firestore
        console.log('HomeScreen - Buscando en colección:', collectionName);
        console.log('HomeScreen - User ID:', authUser.uid);
        const userDoc = await getDoc(doc(db, collectionName, authUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log('HomeScreen - Datos del usuario encontrados:', data);
          console.log('HomeScreen - Imagen de perfil:', data.imagenPerfil);
          console.log('HomeScreen - Role del usuario:', data.role);
          console.log('HomeScreen - TipoUsuario del usuario:', data.tipoUsuario);
          console.log('HomeScreen - RoleId del usuario:', data.roleId);
          setUserData(data);
        } else {
          console.log('HomeScreen - No se encontraron datos en la colección:', collectionName);
        }
      }
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
    } finally {
      setLoadingUserData(false);
    }
  };

  const loadCenters = async () => {
    try {
      const isCenterUser = (
        userData?.role === 'centro_turistico' || userData?.tipoUsuario === 'CentroTuristico' ||
        authUser?.role === 'centro_turistico'
      );
      const centersData = [];
      if (isCenterUser && authUser?.uid) {
        // Solo cargar el propio centro
        const docSnap = await getDoc(doc(db, 'centrosTuristicos', authUser.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          const lat = data.latitud || data.latitude;
          const lng = data.longitud || data.longitude;
          if (lat && lng) {
            centersData.push({
              id: docSnap.id,
              ...data,
              businessName: data.nombreNegocio || data.businessName,
              category: data.categoriaNegocio || data.category,
              coordinate: {
                latitude: parseFloat(lat),
                longitude: parseFloat(lng)
              }
            });
          }
        }
      } else {
        // Turista u otro: cargar todos los centros
        const centersSnapshot = await getDocs(collection(db, 'centrosTuristicos'));
        centersSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const lat = data.latitud || data.latitude;
          const lng = data.longitud || data.longitude;
          if (lat && lng) {
            centersData.push({
              id: docSnap.id,
              ...data,
              businessName: data.nombreNegocio || data.businessName,
              category: data.categoriaNegocio || data.category,
              coordinate: {
                latitude: parseFloat(lat),
                longitude: parseFloat(lng)
              }
            });
          }
        });
      }

      console.log('Centros cargados:', centersData.map(c => ({ 
        name: c.businessName, 
        category: c.category,
        categoriaNegocio: c.categoriaNegocio,
        coordinate: c.coordinate
      })));
      setCenters(centersData);
    } catch (error) {
      console.error('Error cargando centros:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar centros turísticos registrados y datos del usuario
  useEffect(() => {
    loadUserData();
    loadCenters();
  }, []);

  // Re-cargar centros cuando se determine el rol/datos del usuario
  useEffect(() => {
    if (!loadingUserData) {
      loadCenters();
    }
  }, [loadingUserData, userData]);

  // Recargar datos de usuario cuando Home recobra foco (después de editar perfil)
  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  // Refresh automático cada 30 segundos solo para centros turísticos
  useEffect(() => {
    const interval = setInterval(() => {
      loadCenters(); // Solo recargar centros, no datos del usuario
    }, 30000); // Refresh cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  // Efecto para centrar el mapa cuando se cargan los datos del usuario
  useEffect(() => {
    if (userData && authUser && !hasShownWelcome) {
      const isCenter = userData.role === 'centro_turistico' || userData.tipoUsuario === 'CentroTuristico';
      // Usar latitud/longitud (español) como prioridad, luego latitude/longitude (inglés)
      const userLat = userData.latitud || userData.latitude;
      const userLng = userData.longitud || userData.longitude;
      
      if (isCenter && userLat && userLng) {
        const centerCoords = {
          latitude: parseFloat(userLat),
          longitude: parseFloat(userLng),
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        console.log('Centrando mapa en coordenadas del usuario:', centerCoords);
        setMapRegion(centerCoords);
        
        // Usar animateToRegion si el mapa está disponible
        if (mapRef) {
          mapRef.animateToRegion(centerCoords, 1000);
        }
        
        // Mostrar notificación flotante solo la primera vez
        setTimeout(() => {
          showFloatingNotification(`¡Bienvenido a ${userData.nombreNegocio || userData.businessName || 'tu centro'}!`);
          setHasShownWelcome(true);
        }, 1500);
      }
    }
  }, [userData, authUser, hasShownWelcome]);

  // Efecto para turistas: solicitar permisos y centrar en ubicación actual SOLO UNA VEZ al entrar por primera vez al Home.
  useEffect(() => {
    // Solo ejecutar cuando ya no estamos cargando datos del usuario
    if (loadingUserData) return;

    const isCenter = userData?.role === 'centro_turistico' || userData?.tipoUsuario === 'CentroTuristico';

    if (!isCenter) {
      // Si ya centramos una vez al usuario, no volver a hacerlo al regresar al Home
      if (hasCenteredOnUser) return;
      (async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            console.log('Permiso de ubicación no concedido para turista, usando ubicación por defecto (Juigalpa).');
            // Asegurar que el mapa tenga la ubicación por defecto (Juigalpa)
            setMapRegion((prev) => prev || INITIAL_REGION);
            setHasCenteredOnUser(true);
            return;
          }

          const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          const newRegion = {
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setMapRegion(newRegion);
          if (mapRef) {
            mapRef.animateToRegion(newRegion, 1000);
          }
          showFloatingNotification('Ubicación actual detectada');
          setHasCenteredOnUser(true);
        } catch (e) {
          console.log('Error obteniendo ubicación del turista:', e?.message || e);
          setMapRegion((prev) => prev || INITIAL_REGION);
          setHasCenteredOnUser(true);
        }
      })();
    } else {
      // Si es centro turístico pero no tiene coordenadas, asegurar fallback a Juigalpa
      const userLat = userData?.latitud || userData?.latitude;
      const userLng = userData?.longitud || userData?.longitude;
      if (!userLat || !userLng) {
        setMapRegion((prev) => prev || INITIAL_REGION);
      }
    }
  }, [loadingUserData, userData, mapRef, hasCenteredOnUser]);

  const handleMapPress = (e) => {
    setSelectedLocation(e.nativeEvent.coordinate);
  };

  // Función para obtener el icono según la categoría
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
    
    const icon = categoryIcons[category] || 'business';
    console.log(`Categoría: "${category}" -> Icono: "${icon}"`);
    return icon;
  };

  const handleMarkerPress = (center) => {
    Alert.alert(
      center.businessName || 'Centro Turístico',
      `${center.description || 'Sin descripción'}\n\nDirección: ${center.address || 'No especificada'}`,
      [
        { text: 'Ver Detalles', onPress: () => console.log('Ver detalles del centro') },
        { text: 'Cerrar', style: 'cancel' }
      ]
    );
  };

  // Centrar el mapa en el centro turístico del usuario (si existe)
  const centerToMyCenter = () => {
    const userLat = userData?.latitud || userData?.latitude;
    const userLng = userData?.longitud || userData?.longitude;
    if (userLat && userLng && userLat !== '' && userLng !== '') {
      const centerCoords = {
        latitude: parseFloat(userLat),
        longitude: parseFloat(userLng),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      if (mapRef) {
        mapRef.animateToRegion(centerCoords, 1000);
      }
      setMapRegion(centerCoords);
      showFloatingNotification(`Mostrando la ubicación de ${userData?.nombreNegocio || userData?.businessName || 'tu centro'}`);
    } else {
      // Sin alert intrusivo: notificación ligera
      showFloatingNotification('No tienes una ubicación registrada. Ve a Mi Centro para agregarla.');
    }
  };

  // Funcion reusable para abrir MapPicker con la ubicacion guardada y acción de guardado
  const openMapPickerForUser = (closeMenu = true) => {
    if (closeMenu) setShowMenu(false);

    const initialCoords = userData?.latitude && userData?.longitude
      ? { latitude: parseFloat(userData.latitude), longitude: parseFloat(userData.longitude) }
      : { latitude: mapRegion.latitude, longitude: mapRegion.longitude };

    navigation.navigate('MapPicker', {
      initialCoords,
      onPick: async (coords) => {
        try {
          if (!authUser) throw new Error('No auth user');
          // Determinar la colección según el rol del usuario
          let collectionName = 'users';
          if (authUser.role === 'centro_turistico' || authUser.tipoUsuario === 'CentroTuristico') {
            collectionName = 'centrosTuristicos';
          }

          // Actualizar en Firestore (guardamos como strings para mantener compatibilidad)
          await updateDoc(doc(db, collectionName, authUser.uid), {
            latitude: coords.latitude.toString(),
            longitude: coords.longitude.toString(),
          });

          // Actualizar estado local
          setUserData((prev) => ({
            ...(prev || {}),
            latitude: coords.latitude.toString(),
            longitude: coords.longitude.toString(),
          }));



          // Centrar mapa en la nueva ubicación
          const newRegion = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setMapRegion(newRegion);
          
          // Usar animateToRegion para mover el mapa
          if (mapRef) {
            mapRef.animateToRegion(newRegion, 1000);
          }

          await loadCenters();

          Alert.alert('Ubicación Actualizada', `Nueva ubicación: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
        } catch (err) {
          console.error('Error actualizando ubicación:', err);
          Alert.alert('Error', 'No se pudo actualizar la ubicación.');
        }
      }
    });
  };

  const getQuickActions = () => {
    const isCenter = userData?.role === 'centro_turistico' || userData?.tipoUsuario === 'CentroTuristico';

    if (isCenter) {
      return [
        {
          id: 'reservations',
          title: 'Reservaciones',
          subtitle: 'Gestionar reservas de visitantes',
          icon: 'calendar',
          color: '#F59E0B',
          onPress: () => {
            setShowMenu(false);
            navigation.navigate('Reservations');
          }
        },
        {
          id: 'analytics',
          title: 'Estadísticas',
          subtitle: 'Ver métricas de visitas',
          icon: 'bar-chart',
          color: '#8B5CF6',
          onPress: () => {
            setShowMenu(false);
            navigation.navigate('Statistics');
          }
        },
        {
          id: 'promotions',
          title: 'Promociones',
          subtitle: 'Crear ofertas especiales',
          icon: 'megaphone',
          color: '#EC4899',
          onPress: () => {
            setShowMenu(false);
            navigation.navigate('Promotions');
          }
        },
        {
          id: 'notifications',
          title: 'Notificaciones',
          subtitle: 'Configurar alertas',
          icon: 'notifications',
          color: '#10B981',
          onPress: () => {
            setShowMenu(false);
            navigation.navigate('Notifications');
          }
        }
      ];
    } else {
      return [
        {
          id: 'favorites',
          title: 'Mis Favoritos',
          subtitle: 'Centros turísticos guardados',
          icon: 'heart',
          color: '#EF4444',
          onPress: () => {
            setShowMenu(false);
            Alert.alert('Favoritos', 'Centros turísticos favoritos');
          }
        },
        {
          id: 'search',
          title: 'Buscar Cercanos',
          subtitle: 'Encontrar centros cerca de ti',
          icon: 'search',
          color: '#3B82F6',
          onPress: () => {
            setShowMenu(false);
            Alert.alert('Buscar', 'Buscar centros turísticos cercanos');
          }
        },
        {
          id: 'history',
          title: 'Mi Historial',
          subtitle: 'Centros que has visitado',
          icon: 'time',
          color: '#10B981',
          onPress: () => {
            setShowMenu(false);
            Alert.alert('Historial', 'Centros que has visitado');
          }
        },
        {
          id: 'reviews',
          title: 'Mis Reseñas',
          subtitle: 'Tus reseñas y calificaciones',
          icon: 'star',
          color: '#F59E0B',
          onPress: () => {
            setShowMenu(false);
            Alert.alert('Mis Reseñas', 'Tus reseñas y calificaciones');
          }
        },
        {
          id: 'notifications',
          title: 'Notificaciones',
          subtitle: 'Configurar alertas',
          icon: 'notifications',
          color: '#8B5CF6',
          onPress: () => {
            setShowMenu(false);
            Alert.alert('Notificaciones', 'Configurar notificaciones');
          }
        }
      ];
    }
  };

  // Mientras carga userData, mostramos un loader pequeño (evita interacciones prematuras)
  if (loadingUserData) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 8 }}>Cargando datos de usuario...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}> 
      {/* Header personalizado */}
      <View style={styles.headerContainer}>
        {/* Información del perfil (tappable para visualizar perfil) */}
        <View style={styles.profileSection}>
          <View
            style={styles.profileInfo}
          >
            <View style={styles.profileContainer}>
              {userData?.imagenPerfil ? (
                <Image 
                  source={{ uri: userData.imagenPerfil }} 
                  style={styles.profileImage}
                  onError={(error) => console.log('Error cargando imagen en Home:', error)}
                  onLoad={() => console.log('Imagen cargada exitosamente en Home')}
                />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Ionicons 
                    name={(userData?.role === 'centro_turistico' || userData?.tipoUsuario === 'CentroTuristico') ? 'business' : 'person'} 
                    size={24} 
                    color="#3B82F6" 
                  />
                </View>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {
                  // Si es centro turístico mostrar nombre del negocio; si es turista, nombres + apellidos
                  userData?.nombreNegocio || userData?.businessName ||
                  [userData?.nombres || userData?.firstName, userData?.apellidos || userData?.lastName]
                    .filter(Boolean)
                    .join(' ') ||
                  authUser?.displayName || 'Usuario'
                }
              </Text>
              <Text style={styles.userRole}>
                {(userData?.role === 'centro_turistico' || userData?.tipoUsuario === 'CentroTuristico') ? 'Centro Turístico' : 'Turista'}
              </Text>
              {(userData?.role === 'centro_turistico' || userData?.tipoUsuario === 'CentroTuristico') && userData?.nombrePropietario && (
                <Text style={styles.propietarioName}>
                  Propietario: {userData.nombrePropietario}
                </Text>
              )}
              {(userData?.role === 'centro_turistico' || userData?.tipoUsuario === 'CentroTuristico') && (
                <View style={styles.profileActionsContainer}>
                  <TouchableOpacity 
                    style={styles.refreshButton}
                    onPress={() => {
                      console.log('Refrescando datos...');
                      loadUserData();
                      loadCenters();
                    }}
                  >
                    <Ionicons name="refresh" size={16} color="#10B981" />
                    <Text style={styles.refreshButtonText}>Refrescar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.refreshButton, { backgroundColor: '#FEF3C7' }]}
                    onPress={() => {
                      console.log('Debug - Datos del usuario:', userData);
                      console.log('Debug - Latitud:', userData?.latitud || userData?.latitude);
                      console.log('Debug - Longitud:', userData?.longitud || userData?.longitude);
                      Alert.alert(
                        'Debug Info',
                        `Latitud: ${userData?.latitud || userData?.latitude || 'No encontrada'}\nLongitud: ${userData?.longitud || userData?.longitude || 'No encontrada'}`,
                        [{ text: 'OK' }]
                      );
                    }}
                  >
                    <Ionicons name="bug" size={16} color="#F59E0B" />
                    <Text style={[styles.refreshButtonText, { color: '#F59E0B' }]}>Debug</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Acciones rápidas principales */}
        <View style={styles.quickActionsSection}>
          {(userData?.role === 'centro_turistico' || userData?.tipoUsuario === 'CentroTuristico') ? (
            <>
              <TouchableOpacity 
                style={[styles.quickActionCard, { backgroundColor: '#EBF4FF' }]}
                onPress={() => navigation.navigate('CentroTuristicoProfile')}
              >
                <Ionicons name="business" size={24} color="#3B82F6" />
                <Text style={[styles.quickActionText, { color: '#3B82F6' }]}>Mi Centro</Text>
              </TouchableOpacity>
              
                  <TouchableOpacity 
                    style={[styles.quickActionCard, { backgroundColor: '#F0FDF4' }]}
                    onPress={() => {
                      // Usar latitud/longitud (español) como prioridad, luego latitude/longitude (inglés)
                      const userLat = userData?.latitud || userData?.latitude;
                      const userLng = userData?.longitud || userData?.longitude;
                      
                      console.log('=== VER MI CENTRO DEBUG ===');
                      console.log('userData completo:', JSON.stringify(userData, null, 2));
                      console.log('userData.latitud:', userData?.latitud);
                      console.log('userData.longitud:', userData?.longitud);
                      console.log('userData.latitude:', userData?.latitude);
                      console.log('userData.longitude:', userData?.longitude);
                      console.log('userLat final:', userLat);
                      console.log('userLng final:', userLng);
                      console.log('========================');
                      
                      if (userLat && userLng && userLat !== '' && userLng !== '') {
                        const centerCoords = {
                          latitude: parseFloat(userLat),
                          longitude: parseFloat(userLng),
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        };
                        console.log('Ver Mi Centro - Coordenadas calculadas:', centerCoords);
                        
                        // Usar animateToRegion para mover el mapa
                        if (mapRef) {
                          mapRef.animateToRegion(centerCoords, 1000); // 1 segundo de animación
                        }
                        
                        // También actualizar el estado
                        setMapRegion(centerCoords);
                        // Notificación no intrusiva
                        showFloatingNotification(`Mostrando la ubicación de ${userData.nombreNegocio || userData.businessName || 'tu centro'}`);
                      } else {
                        console.log('Ver Mi Centro - No se encontraron coordenadas válidas');
                        Alert.alert(
                          'Ubicación No Registrada',
                          'No tienes una ubicación registrada. Ve a "Mi Centro" para agregar la ubicación.\n\nCoordenadas encontradas:\nLatitud: ' + (userLat || 'No encontrada') + '\nLongitud: ' + (userLng || 'No encontrada'),
                          [{ text: 'Entendido' }]
                        );
                      }
                    }}
                  >
                <Ionicons name="locate" size={24} color="#10B981" />
                <Text style={[styles.quickActionText, { color: '#10B981' }]}>Ver Mi Centro</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.quickActionCard, { backgroundColor: '#FEF2F2' }]}
                onPress={() => Alert.alert('Favoritos', 'Centros turísticos favoritos')}
              >
                <Ionicons name="heart" size={24} color="#EF4444" />
                <Text style={[styles.quickActionText, { color: '#EF4444' }]}>Favoritos</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.quickActionCard, { backgroundColor: '#EBF4FF' }]}
                onPress={() => Alert.alert('Buscar', 'Buscar centros turísticos cercanos')}
              >
                <Ionicons name="search" size={24} color="#3B82F6" />
                <Text style={[styles.quickActionText, { color: '#3B82F6' }]}>Buscar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Contenido del mapa */}
      <View style={styles.mapContainer}>
        <MapView
          key={isCenterUser ? 'center-map' : 'tourist-map'}
          ref={setMapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={mapRegion}
          region={mapRegion}
          showsPointsOfInterest={false}
          showsBuildings={true}
          showsTraffic={false}
          customMapStyle={GOOGLE_MAP_STYLE}
          showsUserLocation={!isCenterUser}
          showsMyLocationButton={false}
        >
          {/* Marcadores de centros turísticos registrados */}
          {(userData?.role === 'centro_turistico' || userData?.tipoUsuario === 'CentroTuristico'
            ? centers.filter(c => c.id === authUser?.uid)
            : centers
           ).map((center) => (
            <Marker
              key={center.id}
              coordinate={center.coordinate}
              anchor={{ x: 0.5, y: 1 }}
            >
              {/* Marcador tipo pin compacto, manteniendo color e icono */}
              <View style={styles.centerPinContainer}>
                <View style={styles.centerPin}>
                  <Ionicons
                    name={getCategoryIcon(center.category || center.categoriaNegocio)}
                    size={18}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.centerPinTail} />
              </View>
            </Marker>
          ))}

        </MapView>

        {/* Footer simplificado */}
        {authUser && userData && (
          <View style={[styles.footerContainer, { paddingBottom: insets.bottom }]}>
            <View style={styles.footerContent}>
              <TouchableOpacity 
                style={styles.footerButton}
                onPress={() => setShowMenu(true)}
              >
                <Ionicons name="menu" size={24} color="#6B7280" />
                <Text style={styles.footerButtonText}>Menú</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.footerButton}
                onPress={() => navigation.navigate('Reviews')}
              >
                <Ionicons name="star" size={24} color="#F59E0B" />
                <Text style={styles.footerButtonText}>Reseñas</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.footerButton}
                onPress={() => navigation.navigate('Settings')}
              >
                <Ionicons name="settings" size={24} color="#10B981" />
                <Text style={styles.footerButtonText}>Configurar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Menú simple */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setShowMenu(false)}
          />
          
          <View style={styles.menuContainer}>
            {/* Línea de agarre dentro del menú */}
            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>
            
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>
                {(userData?.role === 'centro_turistico' || userData?.tipoUsuario === 'CentroTuristico') ? 'Herramientas del Centro' : 'Acciones Rápidas'}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowMenu(false)}
              >
                <Ionicons 
                  name="close" 
                  size={24} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.menuContent} showsVerticalScrollIndicator={false}>
              <View style={styles.quickActionsGrid}>
                {getQuickActions().map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    style={[styles.quickActionItem, { borderLeftColor: action.color }]}
                    onPress={action.onPress}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                      <Ionicons name={action.icon} size={24} color={action.color} />
                    </View>
                    <View style={styles.quickActionTextContainer}>
                      <Text style={styles.quickActionTitle}>{action.title}</Text>
                      <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Notificación flotante personalizada */}
      {showNotification && (
        <View style={styles.floatingNotification}>
          <Text style={styles.notificationText}>{notificationText}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    width: '100%',
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileContainer: {
    marginRight: 12,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  profilePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  propietarioName: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '400',
    marginTop: 2,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  editProfileButtonText: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '600',
    marginLeft: 4,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  refreshButtonText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  profileActionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  menuButton: {
    padding: 8,
  },
  quickActionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  quickActionCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
    marginBottom: 80, // Espacio para el footer personalizado
  },
  map: {
    flex: 1,
  },
  customMarker: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  currentUserMarker: {
    backgroundColor: '#10B981',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  tempMarker: {
    backgroundColor: '#EF4444',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  // Nuevo estilo: marcador tipo pin compacto para centros turísticos
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
  centerInfoMarker: {
    backgroundColor: '#10B981',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    minWidth: 120,
    maxWidth: 200,
  },
  centerInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerLogoContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  centerLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  centerInfoText: {
    flex: 1,
  },
  centerName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  centerCategory: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  centerAddress: {
    fontSize: 12,
    color: '#6B7280',
  },
  footerContainer: {
    position: 'absolute',
    bottom: '-15%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingTop: 4,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  footerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 60,
  },
  footerButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  // Estilos del menú deslizable
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalBackground: {
    flex: 1,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  dragHandle: {
    width: 40,
    height: 6,
    backgroundColor: '#9CA3AF',
    borderRadius: 4,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  floatingNotification: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
    zIndex: 1000,
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  menuContent: {
    flex: 1,
  },
  quickActionsGrid: {
    padding: 20,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickActionTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
});


export default HomeScreen;

