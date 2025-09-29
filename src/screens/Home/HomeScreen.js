import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Image, ScrollView, Modal, ActivityIndicator, PanResponder, Animated } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig.js';
import { useAuth } from '../../contexts/AuthContext';

// Paleta de colores para la aplicación
const COLOR_PALETTE = {
  primary: '#3B82F6',      // Azul principal
  secondary: '#10B981',    // Verde
  accent: '#F59E0B',       // Naranja
  purple: '#8B5CF6',       // Morado
  pink: '#EC4899',         // Rosa
  red: '#EF4444',          // Rojo
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    light: '#9CA3AF',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
  }
};

const INITIAL_REGION = {
  latitude: 12.136389,
  longitude: -86.251389,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// Estilo del mapa para limpiar POIs de Google (negocios, lugares, parques, etc.)
const GOOGLE_MAP_STYLE = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.arterial', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.highway', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.medical', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.school', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.place_of_worship', stylers: [{ visibility: 'off' }] },
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
      // Si es centro turístico, mostrar solo su propio centro
      const isCenterUser = authUser && (authUser.role === 'centro_turistico' || authUser.tipoUsuario === 'CentroTuristico');
      if (isCenterUser) {
        const centerDoc = await getDoc(doc(db, 'centrosTuristicos', authUser.uid));
        if (centerDoc.exists()) {
          const data = centerDoc.data();
          const lat = data.latitud || data.latitude;
          const lng = data.longitud || data.longitude;
          if (lat && lng) {
            const onlyMine = [{
              id: centerDoc.id,
              ...data,
              businessName: data.nombreNegocio || data.businessName,
              category: data.categoriaNegocio || data.category,
              coordinate: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
            }];
            setCenters(onlyMine);
          } else {
            setCenters([]);
          }
        } else {
          setCenters([]);
        }
        return;
      }

      // Si no es centro turístico (por ejemplo, turista), cargar todos (comportamiento anterior)
      const centersSnapshot = await getDocs(collection(db, 'centrosTuristicos'));
      const centersData = [];
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
            coordinate: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
          });
        }
      });
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
          color: COLOR_PALETTE.accent,
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
          color: COLOR_PALETTE.purple,
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
          color: COLOR_PALETTE.pink,
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
          color: COLOR_PALETTE.secondary,
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
          color: COLOR_PALETTE.red,
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
          color: COLOR_PALETTE.primary,
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
          color: COLOR_PALETTE.secondary,
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
          color: COLOR_PALETTE.accent,
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
        <ActivityIndicator size="large" color={COLOR_PALETTE.primary} />
        <Text style={{ marginTop: 8 }}>Cargando datos de usuario...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}> 
      {/* Header personalizado */}
      <View style={styles.headerContainer}>
        {/* Información del perfil */}
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
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
                    color={COLOR_PALETTE.primary} 
                  />
                </View>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {userData?.nombreNegocio || userData?.businessName || userData?.firstName || authUser?.displayName || 'Usuario'}
              </Text>
              <Text style={styles.userRole}>
                {(userData?.role === 'centro_turistico' || userData?.tipoUsuario === 'CentroTuristico') ? 'Centro Turístico' : 'Turista'}
              </Text>
              {(userData?.role === 'centro_turistico' || userData?.tipoUsuario === 'CentroTuristico') && userData?.nombrePropietario && (
                <Text style={styles.propietarioName}>
                  Propietario: {userData.nombrePropietario}
                </Text>
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
                <Ionicons name="business" size={24} color={COLOR_PALETTE.primary} />
                <Text style={[styles.quickActionText, { color: COLOR_PALETTE.primary }]}>Mi Centro</Text>
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
                        
                        Alert.alert(
                          'Ubicación del Centro',
                          `Te hemos dirigido a la ubicación registrada de ${userData.nombreNegocio || userData.businessName || 'tu centro'}.\n\nCoordenadas: ${userLat}, ${userLng}`,
                          [{ text: 'Perfecto' }]
                        );
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
                <Ionicons name="locate" size={24} color={COLOR_PALETTE.secondary} />
                <Text style={[styles.quickActionText, { color: COLOR_PALETTE.secondary }]}>Ver Mi Centro</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.quickActionCard, { backgroundColor: '#FEF2F2' }]}
                onPress={() => Alert.alert('Favoritos', 'Centros turísticos favoritos')}
              >
                <Ionicons name="heart" size={24} color={COLOR_PALETTE.red} />
                <Text style={[styles.quickActionText, { color: COLOR_PALETTE.red }]}>Favoritos</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.quickActionCard, { backgroundColor: '#EBF4FF' }]}
                onPress={() => Alert.alert('Buscar', 'Buscar centros turísticos cercanos')}
              >
                <Ionicons name="search" size={24} color={COLOR_PALETTE.primary} />
                <Text style={[styles.quickActionText, { color: COLOR_PALETTE.primary }]}>Buscar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Contenido del mapa */}
      <View style={styles.mapContainer}>
        <MapView
          ref={setMapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={mapRegion}
          region={mapRegion}
          showsUserLocation
          showsMyLocationButton
          showsPointsOfInterest={false}
          customMapStyle={GOOGLE_MAP_STYLE}
          onPress={handleMapPress}
        >
          {/* Marcadores de centros turísticos registrados */}
          {centers.map((center) => (
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

          {/* Marcador temporal al tocar el mapa */}
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              title="Ubicación seleccionada"
            >
              <View style={styles.tempMarker}>
                <Ionicons name="location" size={16} color="#FFFFFF" />
              </View>
            </Marker>
          )}
        </MapView>

        {/* Footer simplificado */}
        {authUser && userData && (
          <View style={[styles.footerContainer, { paddingBottom: insets.bottom }]}>
            <View style={styles.footerContent}>
              <TouchableOpacity 
                style={styles.footerButton}
                onPress={() => setShowMenu(true)}
              >
                 <Ionicons name="menu" size={22} color={COLOR_PALETTE.text.secondary} />
                <Text style={styles.footerButtonText}>Menú</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.footerButton}
                onPress={() => navigation.navigate('Reviews')}
              >
                 <Ionicons name="star" size={22} color={COLOR_PALETTE.accent} />
                <Text style={styles.footerButtonText}>Reseñas</Text>
              </TouchableOpacity>

              {(userData.role === 'centro_turistico' || userData.tipoUsuario === 'CentroTuristico') && (
                <TouchableOpacity 
                  style={styles.footerButton}
                  onPress={() => navigation.navigate('Settings')}
                >
                   <Ionicons name="settings" size={22} color={COLOR_PALETTE.secondary} />
                  <Text style={styles.footerButtonText}>Configurar</Text>
                </TouchableOpacity>
              )}
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
     marginBottom: 0, // Sin margen para que el mapa llegue hasta el footer
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
     bottom: 0,
     left: 0,
     right: 0,
     backgroundColor: 'rgba(255, 255, 255, 0.95)',
     paddingTop: 8,
     paddingBottom: 8,
     borderTopWidth: 0,
     backdropFilter: 'blur(10px)',
   },
   footerContent: {
     flexDirection: 'row',
     justifyContent: 'space-evenly',
     alignItems: 'center',
     paddingHorizontal: 16,
     paddingVertical: 0,
   },
   footerButton: {
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 6,
     paddingHorizontal: 8,
     minWidth: 50,
     flex: 1,
   },
   footerButtonText: {
     fontSize: 10,
     fontWeight: '600',
     color: '#6B7280',
     marginTop: 2,
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

