import React, { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Image, ScrollView, Modal, ActivityIndicator, PanResponder, Animated, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig.js';
import { useAuth } from '../../contexts/AuthContext';


const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const [centerStatus, setCenterStatus] = useState('abierto'); // 'abierto' o 'cerrado'
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [sliderAnimation] = useState(new Animated.Value(0));
  const [isDragging, setIsDragging] = useState(false);
  const [sliderWidth, setSliderWidth] = useState(300); // Ancho por defecto
  
  // PanResponder para el deslizamiento del slider
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !updatingStatus,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 5 && !updatingStatus;
    },
    onPanResponderGrant: () => {
      setIsDragging(true);
    },
    onPanResponderMove: (evt, gestureState) => {
      if (!updatingStatus) {
        const maxDistance = sliderWidth - 110;
        // Lógica corregida: deslizar hacia la izquierda va a abierto (0), hacia la derecha va a cerrado (1)
        const currentValue = centerStatus === 'abierto' ? 0 : 1;
        const newValue = Math.max(0, Math.min(1, currentValue - (gestureState.dx / maxDistance)));
        sliderAnimation.setValue(newValue);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      setIsDragging(false);
      
      if (updatingStatus) return;
      
      const threshold = (sliderWidth - 110) / 2;
      // Lógica corregida: deslizar hacia la izquierda va a abierto (0), hacia la derecha va a cerrado (1)
      const newStatus = gestureState.dx < -threshold ? 'abierto' : gestureState.dx > threshold ? 'cerrado' : centerStatus;
      
      // Actualizar estado
      if (newStatus !== centerStatus) {
        updateCenterStatus(newStatus);
      } else {
        // Regresar a la posición original
        Animated.timing(sliderAnimation, {
          toValue: centerStatus === 'abierto' ? 0 : 1,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    },
  });
  
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

  const updateCenterStatus = async (newStatus) => {
    if (!authUser || !isCenterUser || updatingStatus) return;
    
    console.log('Actualizando estado del centro:', newStatus);
    setUpdatingStatus(true);
    
    // Convertir string a boolean para Firebase
    const estadoBoolean = newStatus === 'abierto';
    
    // Actualizar estado local inmediatamente para feedback visual
    setCenterStatus(newStatus);
    
    try {
      await updateDoc(doc(db, 'centrosTuristicos', authUser.uid), {
        estado: estadoBoolean, // Guardar como boolean en Firebase
        ultimaActualizacion: new Date().toISOString(),
      });
      
      console.log('Estado guardado en Firebase:', estadoBoolean);
      showFloatingNotification(`Centro ${newStatus} correctamente`);
    } catch (error) {
      console.error('Error actualizando estado del centro:', error);
      // Revertir el estado si hay error
      setCenterStatus(centerStatus === 'abierto' ? 'cerrado' : 'abierto');
      Alert.alert('Error', 'No se pudo actualizar el estado del centro');
    } finally {
      setUpdatingStatus(false);
    }
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
          
          // Cargar estado del centro si es centro turístico
          if (isCenterUser && data.estado !== undefined) {
            console.log('Estado cargado desde Firebase:', data.estado, 'Tipo:', typeof data.estado);
            // Convertir boolean a string para la UI
            const estado = data.estado ? 'abierto' : 'cerrado';
            setCenterStatus(estado);
            // Inicializar animación según el estado
            sliderAnimation.setValue(estado === 'abierto' ? 0 : 1); // Abierto=0 (izquierda), Cerrado=1 (derecha)
          }
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
      const userLat = userData?.latitud || userData?.latitude;
      const userLng = userData?.longitud || userData?.longitude;
      
      if (isCenter && userLat && userLng) {
        const centerCoords = {
          latitude: parseFloat(userLat),
          longitude: parseFloat(userLng),
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        console.log('Centrando mapa en coordenadas del usuario:', centerCoords);
        
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
  }, [loadingUserData, userData, hasCenteredOnUser]);


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
      setMapRegion(centerCoords);
      showFloatingNotification(`Mostrando la ubicación de ${userData?.nombreNegocio || userData?.businessName || 'tu centro'}`);
    } else {
      // Sin alert intrusivo: notificación ligera
      showFloatingNotification('No tienes una ubicación registrada. Ve a Mis Servicios para agregarla.');
    }
  };

  // Funcion reusable para abrir MapPicker con la ubicacion guardada y acción de guardado
  const openMapPickerForUser = (closeMenu = true) => {
    if (closeMenu) setShowMenu(false);

    const initialCoords = userData?.latitude && userData?.longitude
      ? { latitude: parseFloat(userData?.latitude), longitude: parseFloat(userData?.longitude) }
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
          

          await loadCenters();

          Alert.alert('Ubicación Actualizada', `Nueva ubicación: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
        } catch (err) {
          console.error('Error actualizando ubicación:', err);
          Alert.alert('Error', 'No se pudo actualizar la ubicación.');
        }
      }
    });
  };

  // Función para obtener las acciones de turista optimizadas
  const getTouristQuickActions = () => {
    return [
      {
        id: 'explore_centers',
        title: 'Explorar',
        subtitle: 'Buscar centros turísticos',
        icon: 'search',
        color: '#3B82F6',
        onPress: () => {
          setShowMenu(false);
          navigation.navigate('UnifiedSearch', { initialTab: 'all' });
        }
      },
      {
        id: 'nearby_centers',
        title: 'Cercanos',
        subtitle: 'Lugares cerca de ti',
        icon: 'compass',
        color: '#EC4899',
        onPress: () => {
          setShowMenu(false);
          navigation.navigate('UnifiedSearch', { initialTab: 'nearby' });
        }
      },
      {
        id: 'share_routes',
        title: 'Compartir',
        subtitle: 'Rutas y experiencias',
        icon: 'share-social',
        color: '#10B981',
        onPress: () => {
          setShowMenu(false);
          Alert.alert('Compartir', 'Comparte tus rutas y experiencias');
        }
      },
      {
        id: 'photo_albums',
        title: 'Álbumes',
        subtitle: 'Fotos de tus viajes',
        icon: 'camera',
        color: '#8B5CF6',
        onPress: () => {
          setShowMenu(false);
          Alert.alert('Álbumes', 'Gestiona tus fotos de viajes');
        }
      }
    ];
  };

  // Función para opciones del menú (diferentes a las opciones principales)
  const getMenuActions = () => {
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
          id: 'group_tours',
          title: 'Giras Grupales',
          subtitle: 'Únete a tours con otros turistas',
          icon: 'people',
          color: '#10B981',
          onPress: () => {
            setShowMenu(false);
            openWhatsAppGroup();
          }
        },
        {
          id: 'share_routes',
          title: 'Compartir Rutas',
          subtitle: 'Comparte tus rutas favoritas',
          icon: 'share-social',
          color: '#3B82F6',
          onPress: () => {
            setShowMenu(false);
            Alert.alert('Compartir Rutas', 'Comparte tus rutas con otros turistas');
          }
        },
        {
          id: 'photo_albums',
          title: 'Álbumes de Fotos',
          subtitle: 'Crea álbumes de tus viajes',
          icon: 'camera',
          color: '#8B5CF6',
          onPress: () => {
            setShowMenu(false);
            Alert.alert('Álbumes', 'Gestiona tus fotos de viajes');
          }
        },
        {
          id: 'favorites',
          title: 'Favoritos',
          subtitle: 'Centros guardados',
          icon: 'heart',
          color: '#EF4444',
          onPress: () => {
            setShowMenu(false);
            Alert.alert('Favoritos', 'Centros turísticos favoritos');
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
            navigation.navigate('Reviews');
          }
        },
        {
          id: 'settings',
          title: 'Configuración',
          subtitle: 'Ajustes de la aplicación',
          icon: 'settings',
          color: '#6B7280',
          onPress: () => {
            setShowMenu(false);
            navigation.navigate('Settings');
          }
        }
      ];
    }
  };

  // Función para abrir WhatsApp para giras grupales
  const openWhatsAppGroup = () => {
    const phoneNumber = '+1234567890'; // Número de ejemplo
    const message = 'Hola! Me interesa unirme a una gira grupal. ¿Podrían ayudarme?';
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'WhatsApp no está instalado en tu dispositivo');
        }
      })
      .catch((err) => {
        Alert.alert('Error', 'No se pudo abrir WhatsApp');
      });
  };

  const getQuickActions = () => {
    return getMenuActions();
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
    <SafeAreaView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]} edges={[]}> 
      {/* Header personalizado */}
      <View style={styles.headerContainer}>
        {/* Información del perfil (tappable para visualizar perfil) */}
        <View style={styles.profileSection}>
          <View
            style={styles.profileInfo}
          >
            <View style={styles.profileContainer}>
              {userData?.imagenPerfil || userData?.logotipo ? (
                <Image 
                  source={{ uri: userData.imagenPerfil || userData.logotipo }} 
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
              <View style={styles.userTitleContainer}>
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
                {isCenterUser && (
                  <TouchableOpacity 
                    style={styles.notificationIcon}
                    onPress={() => navigation.navigate('Notifications')}
                  >
                    <Ionicons name="notifications" size={24} color="#3B82F6" />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.userRole}>
                {(userData?.role === 'centro_turistico' || userData?.tipoUsuario === 'CentroTuristico') ? 'Centro Turístico' : 'Turista'}
              </Text>
              {isCenterUser && userData?.calificacion && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.ratingText}>
                    {userData.calificacion.toFixed(1)} ({userData.totalResenas || 0} reseñas)
                  </Text>
                </View>
              )}
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
                onPress={() => navigation.navigate('MisServicios')}
              >
                <Ionicons name="analytics" size={24} color="#3B82F6" />
                <Text style={[styles.quickActionText, { color: '#3B82F6' }]}>Mis Servicios</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.quickActionCard, { backgroundColor: '#F0FDF4' }]}
                onPress={() => Alert.alert('Asistente Virtual', 'Próximamente: Chat con IA para gestión del centro')}
              >
                <Ionicons name="chatbubble-ellipses" size={24} color="#10B981" />
                <Text style={[styles.quickActionText, { color: '#10B981' }]}>Asistente Virtual</Text>
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

        {/* Estado del Centro - Solo para centros turísticos */}
          {isCenterUser && (
            <View style={styles.centerStatusSection}>
              <Text style={styles.statusSectionTitle}>Estado del Centro</Text>
              
              <View style={styles.statusContainer}>
                {/* Botones de Estado */}
                <View style={styles.statusButtonsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      {
                        backgroundColor: centerStatus === 'abierto' ? '#10B981' : '#F3F4F6',
                        borderColor: centerStatus === 'abierto' ? '#10B981' : '#D1D5DB',
                      }
                    ]}
                    onPress={() => updateCenterStatus('abierto')}
                    disabled={updatingStatus}
                  >
                    {updatingStatus && centerStatus === 'abierto' ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons 
                          name="checkmark-circle" 
                          size={20} 
                          color={centerStatus === 'abierto' ? '#FFFFFF' : '#6B7280'} 
                        />
                        <Text style={[
                          styles.statusButtonText,
                          {
                            color: centerStatus === 'abierto' ? '#FFFFFF' : '#6B7280',
                          }
                        ]}>
                          Abierto
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      {
                        backgroundColor: centerStatus === 'cerrado' ? '#EF4444' : '#F3F4F6',
                        borderColor: centerStatus === 'cerrado' ? '#EF4444' : '#D1D5DB',
                      }
                    ]}
                    onPress={() => updateCenterStatus('cerrado')}
                    disabled={updatingStatus}
                  >
                    {updatingStatus && centerStatus === 'cerrado' ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons 
                          name="close-circle" 
                          size={20} 
                          color={centerStatus === 'cerrado' ? '#FFFFFF' : '#6B7280'} 
                        />
                        <Text style={[
                          styles.statusButtonText,
                          {
                            color: centerStatus === 'cerrado' ? '#FFFFFF' : '#6B7280',
                          }
                        ]}>
                          Cerrado
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Promociones - Solo para centros turísticos */}
          {isCenterUser && (
            <View style={styles.promotionsSection}>
              <TouchableOpacity 
                style={styles.promotionCard}
                onPress={() => navigation.navigate('Promotions')}
              >
                <View style={styles.promotionContent}>
                  <Ionicons name="gift" size={24} color="#F59E0B" />
                  <View style={styles.promotionText}>
                    <Text style={styles.promotionTitle}>Promociones</Text>
                    <Text style={styles.promotionSubtitle}>Gestiona tus ofertas especiales</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>

      {/* Contenido principal con scroll */}
      <ScrollView 
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Sección "¿Qué quieres hacer hoy?" para turistas */}
      {!(userData?.role === 'centro_turistico' || userData?.tipoUsuario === 'CentroTuristico') && (
        <View style={styles.touristSection}>
          <View style={styles.touristSectionHeader}>
            <Text style={styles.touristSectionTitle}>¿Qué quieres hacer hoy?</Text>
            <Text style={styles.touristSectionSubtitle}>Explora y descubre nuevos lugares</Text>
          </View>
          
          {/* Botón principal de iniciar ruta */}
          <TouchableOpacity 
            style={styles.startRouteButton}
            onPress={() => navigation.navigate('RouteCreation')}
          >
            <View style={styles.startRouteContent}>
              <View style={styles.startRouteIcon}>
                <Ionicons name="map" size={32} color="#FFFFFF" />
              </View>
              <View style={styles.startRouteText}>
                <Text style={styles.startRouteTitle}>Iniciar Ruta</Text>
                <Text style={styles.startRouteSubtitle}>Crea tu recorrido personalizado</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          
          <View style={styles.touristActionsGrid}>
            {getTouristQuickActions().map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.touristActionCard, { borderLeftColor: action.color }]}
                onPress={action.onPress}
              >
                <View style={[styles.touristActionIcon, { backgroundColor: action.color + '20' }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.touristActionTitle}>{action.title}</Text>
                <Text style={styles.touristActionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      </ScrollView>

      {/* Footer de navegación fijo */}
      <View style={[styles.footerContainer, { paddingBottom: insets.bottom }]}>
        <View style={styles.footerContent}>
          {(userData?.role === 'centro_turistico' || userData?.tipoUsuario === 'CentroTuristico') ? (
            // Footer para centros turísticos
            <>
              <TouchableOpacity 
                style={styles.footerButton}
                onPress={() => navigation.navigate('Reservations')}
              >
                <Ionicons name="calendar" size={24} color="#F59E0B" />
                <Text style={styles.footerButtonText}>Reservas</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.footerButton}
                onPress={() => navigation.navigate('Statistics')}
              >
                <Ionicons name="bar-chart" size={24} color="#8B5CF6" />
                <Text style={styles.footerButtonText}>Estadísticas</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.footerButton}
                onPress={() => navigation.navigate('Settings')}
              >
                <Ionicons name="settings" size={24} color="#10B981" />
                <Text style={styles.footerButtonText}>Configurar</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Footer para turistas
            <>
              <TouchableOpacity 
                style={styles.footerButton}
                onPress={() => setShowMenu(true)}
              >
                <Ionicons name="menu" size={24} color="#6B7280" />
                <Text style={styles.footerButtonText}>Menú</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.footerButton}
                onPress={() => navigation.navigate('UnifiedSearch', { initialTab: 'nearby' })}
              >
                <Ionicons name="search" size={24} color="#10B981" />
                <Text style={styles.footerButtonText}>Buscar</Text>
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
            </>
          )}
        </View>
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
                {(userData?.role === 'centro_turistico' || userData?.tipoUsuario === 'CentroTuristico') ? 'Herramientas del Centro' : 'Más Opciones'}
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
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 0,
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
    height: 300, // Altura fija para el mapa
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    paddingBottom: 8,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  
  // Estilos para la sección de turistas
  touristSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  touristSectionHeader: {
    marginBottom: 12,
  },
  touristSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  touristSectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  startRouteButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  startRouteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  startRouteIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  startRouteText: {
    flex: 1,
  },
  startRouteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  startRouteSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  touristActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  touristActionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  touristActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  touristActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  touristActionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  centerStatusSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  userTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  notificationIcon: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  promotionsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  promotionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  promotionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promotionText: {
    flex: 1,
    marginLeft: 12,
  },
  promotionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  promotionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  sliderContainer: {
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  sliderTrack: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 16,
    paddingHorizontal: 5,
    borderWidth: 0, // Removed border
  },
  sliderThumb: {
    position: 'absolute',
    width: 80,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderThumbText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 15,
    position: 'absolute',
    zIndex: 10, // Increased zIndex to ensure visibility
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
  },
  sliderLabelText: {
    fontSize: 12,
    fontWeight: '600',
  },
});


export default HomeScreen;

