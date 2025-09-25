import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Image, ScrollView, Modal } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
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

  const loadUserData = async () => {
    try {
      if (authUser) {
        console.log('Current user:', authUser?.uid);
        
        // Obtener datos adicionales del usuario desde Firestore
        const userDoc = await getDoc(doc(db, 'users', authUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log('User data from Firestore:', data);
          setUserData(data);
          
          // Si es un centro turístico con coordenadas, centrar el mapa
          if (data.role === 'centro_turistico' && data.latitude && data.longitude) {
            console.log('Centering map on coordinates:', data.latitude, data.longitude);
            setMapRegion({
              latitude: parseFloat(data.latitude),
              longitude: parseFloat(data.longitude),
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          } else {
            console.log('No coordinates found or not a center:', data.role, data.latitude, data.longitude);
          }
        } else {
          console.log('User document does not exist');
        }
      } else {
        console.log('No current user');
      }
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
    }
  };

  const loadCenters = async () => {
    try {
      console.log('Loading centers from Firestore...');
      const centersSnapshot = await getDocs(collection(db, 'users'));
      const centersData = [];
      
      centersSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Found user:', doc.id, 'Role:', data.role, 'Coords:', data.latitude, data.longitude);
        
        if (data.role === 'centro_turistico' && data.latitude && data.longitude) {
          centersData.push({
            id: doc.id,
            ...data,
            coordinate: {
              latitude: parseFloat(data.latitude),
              longitude: parseFloat(data.longitude)
            }
          });
        }
      });
      
      console.log('Centers loaded:', centersData.length, centersData);
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

  const handleMapPress = (e) => {
    setSelectedLocation(e.nativeEvent.coordinate);
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

  const getQuickActions = () => {
    const isCenter = userData?.role === 'centro_turistico';
    
    if (isCenter) {
      return [
        {
          id: 'location',
          title: 'Actualizar Ubicación',
          icon: 'location',
          color: '#3B82F6',
          onPress: () => {
            setShowMenu(false);
            navigation.navigate('MapPicker', {
              onPick: (coords) => {
                Alert.alert('Ubicación Actualizada', `Nueva ubicación: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
              }
            });
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}> 
      {/* Header personalizado */}
      <View style={styles.headerContainer}>
        {/* Información del perfil */}
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <View style={styles.profileContainer}>
              {userData?.profileImage ? (
                <Image source={{ uri: userData.profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Ionicons 
                    name={userData?.role === 'centro_turistico' ? 'business' : 'person'} 
                    size={24} 
                    color="#3B82F6" 
                  />
                </View>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {userData?.businessName || userData?.firstName || authUser?.displayName || 'Usuario'}
              </Text>
              <Text style={styles.userRole}>
                {userData?.role === 'centro_turistico' ? 'Centro Turístico' : 'Turista'}
              </Text>
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
          {userData?.role === 'centro_turistico' ? (
            <>
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={() => navigation.navigate('MapPicker', {
                  onPick: (coords) => {
                    Alert.alert('Ubicación Actualizada', `Nueva ubicación: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
                  }
                })}
              >
                <Ionicons name="location" size={20} color="#3B82F6" />
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
              title={center.businessName || 'Centro Turístico'}
              description={center.description || 'Sin descripción'}
              onPress={() => handleMarkerPress(center)}
            >
              {authUser && userData && center.id === authUser.uid ? (
                // Marcador personalizado con información del centro del usuario
                <View style={styles.centerInfoMarker}>
                  <View style={styles.centerInfoContent}>
                    <View style={styles.centerLogoContainer}>
                      {center.logoUrl ? (
                        <Image source={{ uri: center.logoUrl }} style={styles.centerLogo} />
                      ) : (
                        <Ionicons name="business" size={20} color="#3B82F6" />
                      )}
                    </View>
                    <View style={styles.centerInfoText}>
                      <Text style={styles.centerName}>{center.businessName || 'Centro Turístico'}</Text>
                      <Text style={styles.centerAddress}>{center.address || 'Sin dirección'}</Text>
                    </View>
                  </View>
                </View>
              ) : (
                // Marcador normal para otros centros
                <View style={styles.customMarker}>
                  <Ionicons name="business" size={20} color="#FFFFFF" />
                </View>
              )}
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
              {userData.role === 'centro_turistico' ? (
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
                {userData?.role === 'centro_turistico' ? 'Gestionar Centro' : 'Acciones Rápidas'}
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#10B981',
    minWidth: 200,
  },
  centerInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerLogoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  centerLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  centerInfoText: {
    flex: 1,
  },
  centerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
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


