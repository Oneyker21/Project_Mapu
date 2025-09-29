import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Image, ScrollView, Modal, ActivityIndicator } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig.js';
import { useAuth } from '../../contexts/AuthContext';

const INITIAL_REGION = {
  latitude: 12.136389,
  longitude: -86.251389,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [mapRegion, setMapRegion] = useState(INITIAL_REGION);
  const [showMenu, setShowMenu] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(true);

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
      const centersSnapshot = await getDocs(collection(db, 'centrosTuristicos'));
      const centersData = [];

      centersSnapshot.forEach((docSnap) => {
        const data = docSnap.data();

        // Usar latitud/longitud (español) como prioridad, luego latitude/longitude (inglés)
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

  // Refresh automático cada 5 segundos para datos actualizados
  useEffect(() => {
    const interval = setInterval(() => {
      loadUserData();
      loadCenters();
    }, 5000); // Refresh cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  // Efecto para centrar el mapa cuando se cargan los datos del usuario
  useEffect(() => {
    if (userData && authUser) {
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
        
        // Mostrar alerta informativa después de un pequeño delay
        setTimeout(() => {
          Alert.alert(
            'Centro Turístico',
            `Bienvenido a ${userData.nombreNegocio || userData.businessName || 'tu centro'}. Te hemos dirigido a tu ubicación registrada.`,
            [{ text: 'Entendido' }]
          );
        }, 1000);
      }
    }
  }, [userData, authUser]);

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
          setMapRegion({
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });

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
          id: 'location',
          title: 'Actualizar Ubicación',
          icon: 'location',
          color: '#3B82F6',
          onPress: () => {
            // Abre el map picker centrado en la ubicación guardada y actualiza Firestore al confirmar
            openMapPickerForUser(true);
          }
        },
        {
          id: 'business_info',
          title: 'Mi Centro',
          icon: 'business',
          color: '#10B981',
          onPress: () => {
            setShowMenu(false);
            Alert.alert('Mi Centro', 'Editar información del centro turístico');
          }
        },
        {
          id: 'reservations',
          title: 'Reservaciones',
          icon: 'calendar',
          color: '#F59E0B',
          onPress: () => {
            setShowMenu(false);
            Alert.alert('Reservaciones', 'Gestionar reservas de visitantes');
          }
        },
        {
          id: 'reviews',
          title: 'Reseñas',
          icon: 'star',
          color: '#EF4444',
          onPress: () => {
            setShowMenu(false);
            Alert.alert('Reseñas', 'Ver y responder reseñas');
          }
        },
        {
          id: 'analytics',
          title: 'Estadísticas',
          icon: 'bar-chart',
          color: '#8B5CF6',
          onPress: () => {
            setShowMenu(false);
            Alert.alert('Estadísticas', 'Ver métricas de visitas');
          }
        },
        {
          id: 'promotions',
          title: 'Promociones',
          icon: 'megaphone',
          color: '#EC4899',
          onPress: () => {
            setShowMenu(false);
            Alert.alert('Promociones', 'Crear ofertas especiales');
          }
        }
      ];
    } else {
      return [
        {
          id: 'favorites',
          title: 'Favoritos',
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
          icon: 'search',
          color: '#3B82F6',
          onPress: () => {
            setShowMenu(false);
            Alert.alert('Buscar', 'Buscar centros turísticos cercanos');
          }
        },
        {
          id: 'history',
          title: 'Historial',
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
          icon: 'notifications',
          color: '#8B5CF6',
          onPress: () => {
            setShowMenu(false);
            Alert.alert('Notificaciones', 'Configurar notificaciones');
          }
        },
        {
          id: 'profile',
          title: 'Mi Perfil',
          icon: 'person',
          color: '#EC4899',
          onPress: () => {
            setShowMenu(false);
            navigation.navigate('Main', { screen: 'Perfil' });
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
                    color="#3B82F6" 
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
              {(userData?.role === 'centro_turistico' || userData?.tipoUsuario === 'CentroTuristico') && (
                <View style={styles.profileActionsContainer}>
                  <TouchableOpacity 
                    style={styles.editProfileButton}
                    onPress={() => {
                      console.log('Navegando a CentroTuristicoProfile');
                      navigation.navigate('CentroTuristicoProfile');
                    }}
                  >
                    <Ionicons name="create-outline" size={16} color="#3B82F6" />
                    <Text style={styles.editProfileButtonText}>Personalizar Perfil</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.refreshButton}
                    onPress={() => {
                      console.log('Refrescando datos...');
                      loadUserData();
                      loadCenters();
                    }}
                  >
                    <Ionicons name="refresh" size={16} color="#10B981" />
                    <Text style={styles.refreshButtonText}>Actualizar</Text>
                  </TouchableOpacity>
                  
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setShowMenu(true)}
          >
            <Ionicons name="menu" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Opciones de acción */}
        <View style={styles.optionsSection}>
          {(userData?.role === 'centro_turistico' || userData?.tipoUsuario === 'CentroTuristico') ? (
            <>
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={() => navigation.navigate('CentroTuristicoProfile')}
              >
                <Ionicons name="settings" size={20} color="#3B82F6" />
                <Text style={styles.optionButtonText}>Personalizar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={() => {
                  // Ir directamente a las coordenadas registradas del centro turístico
                  if (userData?.latitud && userData?.longitud) {
                    const centerCoords = {
                      latitude: parseFloat(userData.latitud),
                      longitude: parseFloat(userData.longitud),
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    };
                    setMapRegion(centerCoords);
                    Alert.alert(
                      'Ubicación del Centro',
                      `Te hemos dirigido a la ubicación registrada de ${userData.nombreNegocio || 'tu centro'}.`,
                      [{ text: 'Entendido' }]
                    );
                  } else {
                    Alert.alert(
                      'Ubicación No Registrada',
                      'No tienes una ubicación registrada. Ve a "Personalizar" para agregar la ubicación de tu centro.',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { 
                          text: 'Personalizar', 
                          style: 'default',
                          onPress: () => navigation.navigate('CentroTuristicoProfile')
                        }
                      ]
                    );
                  }
                }}
              >
                <Ionicons name="location" size={20} color="#10B981" />
                <Text style={styles.optionButtonText}>Ubicación</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={() => Alert.alert('Reservaciones', 'Gestionar reservas de visitantes')}
              >
                <Ionicons name="calendar" size={20} color="#10B981" />
                <Text style={styles.optionButtonText}>Reservas</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={() => Alert.alert('Estadísticas', 'Ver métricas de visitas')}
              >
                <Ionicons name="bar-chart" size={20} color="#8B5CF6" />
                <Text style={styles.optionButtonText}>Estadísticas</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={() => Alert.alert('Reseñas', 'Ver y responder reseñas')}
              >
                <Ionicons name="star" size={20} color="#F59E0B" />
                <Text style={styles.optionButtonText}>Reseñas</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={() => Alert.alert('Favoritos', 'Centros turísticos favoritos')}
              >
                <Ionicons name="heart" size={20} color="#EF4444" />
                <Text style={styles.optionButtonText}>Favoritos</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={() => Alert.alert('Buscar', 'Buscar centros turísticos cercanos')}
              >
                <Ionicons name="search" size={20} color="#3B82F6" />
                <Text style={styles.optionButtonText}>Buscar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={() => Alert.alert('Historial', 'Centros que has visitado')}
              >
                <Ionicons name="time" size={20} color="#10B981" />
                <Text style={styles.optionButtonText}>Historial</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={() => Alert.alert('Notificaciones', 'Configurar notificaciones')}
              >
                <Ionicons name="notifications" size={20} color="#8B5CF6" />
                <Text style={styles.optionButtonText}>Notificaciones</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Contenido del mapa */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={mapRegion}
          region={mapRegion}
          showsUserLocation
          showsMyLocationButton
          onPress={handleMapPress}
        >
          {/* Marcadores de centros turísticos registrados */}
          {centers.map((center) => (
            <Marker
              key={center.id}
              coordinate={center.coordinate}
              title={center.businessName || center.nombreNegocio || 'Centro Turístico'}
              description={center.description || center.descripcion || 'Sin descripción'}
              onPress={() => handleMarkerPress(center)}
            >
              {/* Marcador personalizado con icono de categoría y nombre */}
              <View style={styles.centerInfoMarker}>
                <View style={styles.centerInfoContent}>
                  <View style={styles.centerLogoContainer}>
                    <Ionicons 
                      name={getCategoryIcon(center.category || center.categoriaNegocio)} 
                      size={24} 
                      color="#FFFFFF" 
                    />
                  </View>
                  <View style={styles.centerInfoText}>
                    <Text style={styles.centerName}>{center.businessName || center.nombreNegocio || 'Centro Turístico'}</Text>
                    <Text style={styles.centerCategory}>{center.category || center.categoriaNegocio || 'Turismo'}</Text>
                  </View>
                </View>
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

        {/* Footer con acciones rápidas */}
        {authUser && userData && (
          <View style={[styles.footerContainer, { paddingBottom: insets.bottom }]}>
            <View style={styles.footerContent}>
              {(userData.role === 'centro_turistico' || userData.tipoUsuario === 'CentroTuristico') ? (
                <>
                  {userData.latitude && userData.longitude && (
                    <TouchableOpacity 
                      style={styles.footerButton}
                      onPress={() => {
                        setMapRegion({
                          latitude: parseFloat(userData.latitude),
                          longitude: parseFloat(userData.longitude),
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        });
                      }}
                    >
                      <Ionicons name="locate" size={20} color="#3B82F6" />
                      <Text style={styles.footerButtonText}>Mi Centro</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity 
                    style={styles.footerButton}
                    onPress={() => Alert.alert('Reseñas', 'Ver y responder reseñas')}
                  >
                    <Ionicons name="star" size={20} color="#F59E0B" />
                    <Text style={styles.footerButtonText}>Reseñas</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.footerButton}
                    onPress={() => Alert.alert('Promociones', 'Crear ofertas especiales')}
                  >
                    <Ionicons name="megaphone" size={20} color="#EC4899" />
                    <Text style={styles.footerButtonText}>Promociones</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.footerButton}
                    onPress={() => navigation.navigate('Main', { screen: 'Perfil' })}
                  >
                    <Ionicons name="settings" size={20} color="#6B7280" />
                    <Text style={styles.footerButtonText}>Perfil</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.footerButton}
                    onPress={() => {
                      // Abre el MapPicker centrado en la ubicación guardada y actualiza Firestore al confirmar
                      openMapPickerForUser(false);
                    }}
                  >
                    <Ionicons name="location" size={20} color="#EC4899" />
                    <Text style={styles.footerButtonText}>Ubicar</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity 
                    style={styles.footerButton}
                    onPress={() => Alert.alert('Favoritos', 'Centros turísticos favoritos')}
                  >
                    <Ionicons name="heart" size={20} color="#EF4444" />
                    <Text style={styles.footerButtonText}>Favoritos</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.footerButton}
                    onPress={() => Alert.alert('Buscar', 'Buscar centros turísticos cercanos')}
                  >
                    <Ionicons name="search" size={20} color="#3B82F6" />
                    <Text style={styles.footerButtonText}>Buscar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.footerButton}
                    onPress={() => Alert.alert('Mis Reseñas', 'Tus reseñas y calificaciones')}
                  >
                    <Ionicons name="star" size={20} color="#F59E0B" />
                    <Text style={styles.footerButtonText}>Reseñas</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.footerButton}
                    onPress={() => navigation.navigate('Main', { screen: 'Perfil' })}
                  >
                    <Ionicons name="person" size={20} color="#6B7280" />
                    <Text style={styles.footerButtonText}>Perfil</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Menú deslizable */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>
                {(userData?.role === 'centro_turistico' || userData?.tipoUsuario === 'CentroTuristico') ? 'Gestionar Centro' : 'Acciones Rápidas'}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowMenu(false)}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
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
                    <Text style={styles.quickActionTitle}>{action.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  optionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  optionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 60,
  },
  optionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 4,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
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
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
});

export default HomeScreen;

