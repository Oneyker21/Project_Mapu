import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert,
  Linking,
  Modal,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { collection, query, where, getDocs, orderBy, addDoc, updateDoc, doc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig';
import { useAuth } from '../../contexts/AuthContext';
import { colors, withOpacity } from '../../config/colors';

const CenterDetailScreen = ({ navigation, route }) => {
  const { center } = route.params;
  const { user: authUser } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isOpen, setIsOpen] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [likedReviews, setLikedReviews] = useState(new Set());
  const [replies, setReplies] = useState({});
  const [showRepliesModal, setShowRepliesModal] = useState(false);
  const [selectedReviewForReplies, setSelectedReviewForReplies] = useState(null);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [navigationSteps, setNavigationSteps] = useState([]);
  const [mapRegion, setMapRegion] = useState(null);
  const [transportMode, setTransportMode] = useState('driving');
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [centerServices, setCenterServices] = useState([]);
  const [centerProducts, setCenterProducts] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const getCategoryIcon = (category) => {
    const categoryIcons = {
      'Hoteles': 'bed',
      'Restaurantes': 'restaurant',
      'Museos': 'library',
      'Parques': 'leaf',
      'Playas': 'water',
      'Montañas': 'trending-up',
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

  const checkIfOpen = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const currentDay = now.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    
    // Horarios por defecto si no hay información
    const defaultHours = {
      monday: { open: 8, close: 18 },
      tuesday: { open: 8, close: 18 },
      wednesday: { open: 8, close: 18 },
      thursday: { open: 8, close: 18 },
      friday: { open: 8, close: 18 },
      saturday: { open: 9, close: 17 },
      sunday: { open: 9, close: 17 }
    };
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = dayNames[currentDay];
    
    // Si hay horarios del centro, usarlos
    if (center.horarios && typeof center.horarios === 'object') {
      const todayHours = center.horarios[today];
      if (todayHours && todayHours.open !== undefined && todayHours.close !== undefined) {
        const openTime = todayHours.open * 60;
        const closeTime = todayHours.close * 60;
        return currentTime >= openTime && currentTime <= closeTime;
      }
    }
    
    // Si hay horarios como string, intentar parsearlos
    if (center.horarios && typeof center.horarios === 'string') {
      // Intentar extraer horarios del string
      const hoursMatch = center.horarios.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
      if (hoursMatch) {
        const openHour = parseInt(hoursMatch[1]);
        const openMin = parseInt(hoursMatch[2]);
        const closeHour = parseInt(hoursMatch[3]);
        const closeMin = parseInt(hoursMatch[4]);
        
        const openTime = openHour * 60 + openMin;
        const closeTime = closeHour * 60 + closeMin;
        return currentTime >= openTime && currentTime <= closeTime;
      }
    }
    
    // Usar horarios por defecto
    const todayHours = defaultHours[today];
    const openTime = todayHours.open * 60;
    const closeTime = todayHours.close * 60;
    return currentTime >= openTime && currentTime <= closeTime;
  };

  const getCurrentDayHours = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayLabels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const today = dayNames[currentDay];
    const todayLabel = dayLabels[currentDay];
    
    // Horarios por defecto
    const defaultHours = {
      monday: { open: 8, close: 18 },
      tuesday: { open: 8, close: 18 },
      wednesday: { open: 8, close: 18 },
      thursday: { open: 8, close: 18 },
      friday: { open: 8, close: 18 },
      saturday: { open: 9, close: 17 },
      sunday: { open: 9, close: 17 }
    };
    
    // Si hay horarios del centro
    if (center.horarios && typeof center.horarios === 'object') {
      const todayHours = center.horarios[today];
      if (todayHours && todayHours.open !== undefined && todayHours.close !== undefined) {
        return {
          day: todayLabel,
          open: todayHours.open,
          close: todayHours.close
        };
      }
    }
    
    // Usar horarios por defecto
    const todayHours = defaultHours[today];
    return {
      day: todayLabel,
      open: todayHours.open,
      close: todayHours.close
    };
  };

  const formatTo12Hour = (hour24) => {
    if (hour24 === 0) return '12:00 AM';
    if (hour24 < 12) return `${hour24}:00 AM`;
    if (hour24 === 12) return '12:00 PM';
    return `${hour24 - 12}:00 PM`;
  };

  const getThreeDaysHours = () => {
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayLabels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    const defaultHours = {
      monday: { open: 8, close: 18 },
      tuesday: { open: 8, close: 18 },
      wednesday: { open: 8, close: 18 },
      thursday: { open: 8, close: 18 },
      friday: { open: 8, close: 18 },
      saturday: { open: 9, close: 17 },
      sunday: { open: 9, close: 17 }
    };

    const days = [];
    
    // Obtener ayer, hoy y mañana
    for (let i = -1; i <= 1; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      const dayIndex = date.getDay();
      const dayName = dayNames[dayIndex];
      const dayLabel = dayLabels[dayIndex];
      
      let hours;
      if (center.horarios && typeof center.horarios === 'object') {
        hours = center.horarios[dayName];
        if (!hours || hours.open === undefined || hours.close === undefined) {
          hours = defaultHours[dayName];
        }
      } else {
        hours = defaultHours[dayName];
      }
      
      const periodLabel = i === -1 ? 'Ayer' : i === 0 ? 'Hoy' : 'Mañana';
      
      days.push({
        periodLabel,
        dayLabel,
        open: hours.open,
        close: hours.close
      });
    }
    
    return days;
  };

  useEffect(() => {
    setIsOpen(checkIfOpen());
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoadingReviews(true);
      console.log('🔍 Cargando reseñas para centro:', center.id);
      
      const reviewsRef = collection(db, 'reseñas');
      const q = query(
        reviewsRef,
        where('centerId', '==', center.id)
      );
      const querySnapshot = await getDocs(q);
      
      console.log('📊 Documentos encontrados:', querySnapshot.docs.length);
      
      const reviewsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('📝 Datos de reseñas:', reviewsData);
      
      // Ordenar client-side para evitar el error de índice
      reviewsData.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.fechaCreacion || 0);
        const dateB = new Date(b.createdAt || b.fechaCreacion || 0);
        return dateB - dateA; // Descendente
      });
      
      console.log('✅ Reseñas ordenadas:', reviewsData.length);
      
      // Inicializar likes del usuario actual
      if (authUser?.uid) {
        const userLikedReviews = new Set();
        reviewsData.forEach(review => {
          if (review.likes && review.likes.includes(authUser.uid)) {
            userLikedReviews.add(review.id);
          }
        });
        setLikedReviews(userLikedReviews);
      }
      
      setReviews(reviewsData);
    } catch (error) {
      console.error('❌ Error cargando reseñas:', error);
      // Si hay error, mostrar array vacío para que se muestre el placeholder
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleCall = () => {
    const telefono = center.telefonoNegocio || center.telefono;
    if (telefono) {
      Linking.openURL(`tel:${telefono}`);
    } else {
      Alert.alert('Información', 'No hay número de teléfono disponible');
    }
  };

  const handleWebsite = () => {
    if (center.sitioWeb) {
      Linking.openURL(center.sitioWeb);
    } else {
      Alert.alert('Información', 'No hay sitio web disponible');
    }
  };

  const handleEmail = () => {
    const email = center.emailNegocio || center.email;
    if (email) {
      Linking.openURL(`mailto:${email}`);
    } else {
      Alert.alert('Información', 'No hay email disponible');
    }
  };


  const handleLikeReview = async (reviewId) => {
    try {
      if (!authUser?.uid) {
        Alert.alert('Error', 'Debes estar logueado para dar me gusta');
        return;
      }

      const reviewRef = doc(db, 'reseñas', reviewId);
      const isLiked = likedReviews.has(reviewId);

      if (isLiked) {
        // Quitar like
        await updateDoc(reviewRef, {
          likes: arrayRemove(authUser.uid),
          likeCount: increment(-1)
        });
        setLikedReviews(prev => {
          const newSet = new Set(prev);
          newSet.delete(reviewId);
          return newSet;
        });
      } else {
        // Agregar like
        await updateDoc(reviewRef, {
          likes: arrayUnion(authUser.uid),
          likeCount: increment(1)
        });
        setLikedReviews(prev => new Set([...prev, reviewId]));
      }

      // Actualizar la lista de reseñas localmente
      setReviews(prevReviews =>
        prevReviews.map(review => {
          if (review.id === reviewId) {
            return {
              ...review,
              likeCount: isLiked ? (review.likeCount || 1) - 1 : (review.likeCount || 0) + 1,
              likes: isLiked 
                ? (review.likes || []).filter(uid => uid !== authUser.uid)
                : [...(review.likes || []), authUser.uid]
            };
          }
          return review;
        })
      );

    } catch (error) {
      console.error('Error liking review:', error);
      Alert.alert('Error', 'No se pudo dar me gusta a la reseña');
    }
  };

  const handleReplyToReview = (review) => {
    setSelectedReview(review);
    setReplyText('');
    setShowReplyModal(true);
  };

  const handleCloseReplyModal = () => {
    setShowReplyModal(false);
    setSelectedReview(null);
    setReplyText('');
  };

  const loadReplies = async (reviewId) => {
    try {
      const repliesRef = collection(db, 'respuestas');
      const q = query(
        repliesRef,
        where('reviewId', '==', reviewId)
      );
      const querySnapshot = await getDocs(q);
      
      const repliesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Ordenar por fecha (más recientes primero)
      repliesData.sort((a, b) => {
        const dateA = a.createdAt || new Date(0);
        const dateB = b.createdAt || new Date(0);
        return new Date(dateB) - new Date(dateA);
      });
      
      setReplies(prev => ({
        ...prev,
        [reviewId]: repliesData
      }));
      
      return repliesData;
    } catch (error) {
      console.error('Error cargando respuestas:', error);
      return [];
    }
  };

  const handleViewReplies = async (review) => {
    setSelectedReviewForReplies(review);
    
    // Cargar respuestas si no están cargadas
    if (!replies[review.id]) {
      await loadReplies(review.id);
    }
    
    setShowRepliesModal(true);
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos de ubicación para mostrar direcciones');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'No se pudo obtener la ubicación actual');
      return null;
    }
  };

  const getDirections = async (start, end, mode = 'driving') => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&mode=${mode}&key=${apiKey}`;
      
      console.log('Requesting directions from:', url, 'mode:', mode);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Directions API response:', data);
      
      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const encodedPolyline = route.overview_polyline.points;
        const leg = route.legs[0];
        
        // Extraer instrucciones paso a paso
        const steps = [];
        leg.steps.forEach((step, index) => {
          steps.push({
            instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remover HTML
            distance: step.distance.text,
            duration: step.duration.text,
            startLocation: step.start_location,
            endLocation: step.end_location,
          });
        });
        
        return {
          coordinates: decodePolyline(encodedPolyline),
          distance: leg.distance.text,
          duration: leg.duration.text,
          steps: steps,
        };
      } else {
        console.error('Directions API error:', data.status, data.error_message);
        // Fallback a línea recta si la API falla
        return {
          coordinates: getStraightLineRoute(start, end),
          distance: 'N/A',
          duration: 'N/A',
          steps: [],
        };
      }
    } catch (error) {
      console.error('Error getting directions:', error);
      // Fallback a línea recta si hay error de red
      return {
        coordinates: getStraightLineRoute(start, end),
        distance: 'N/A',
        duration: 'N/A',
        steps: [],
      };
    }
  };

  const decodePolyline = (encoded) => {
    const points = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }
    return points;
  };

  const getStraightLineRoute = (start, end) => {
    // Fallback: línea recta entre puntos
    const points = [];
    const steps = 20;
    
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const lat = start.latitude + (end.latitude - start.latitude) * ratio;
      const lng = start.longitude + (end.longitude - start.longitude) * ratio;
      points.push({ latitude: lat, longitude: lng });
    }
    
    return points;
  };

  const geocodeAddress = async (address) => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      const encodedAddress = encodeURIComponent(address);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng,
        };
      }
      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  };

  const handleShowDirections = async () => {
    setLoadingRoute(true);
    
    try {
      // Obtener ubicación del usuario
      const currentLocation = await getCurrentLocation();
      if (!currentLocation) {
        setLoadingRoute(false);
        return;
      }

      // Asegurar que las coordenadas del usuario sean números válidos
      const validUserLocation = {
        latitude: parseFloat(currentLocation.latitude) || 12.1364,
        longitude: parseFloat(currentLocation.longitude) || -86.2514,
      };

      setUserLocation(validUserLocation);

      // Log de todos los campos disponibles del centro para debug
      console.log('Center data available:', {
        latitude: center.latitude,
        lat: center.lat,
        longitude: center.longitude,
        lng: center.lng,
        coordinates: center.coordinates,
        location: center.location,
        position: center.position,
        geo: center.geo,
        address: center.address,
        allKeys: Object.keys(center)
      });

      // Coordenadas del centro - buscar en múltiples campos posibles
      let centerLatitude = null;
      let centerLongitude = null;

      // Buscar latitud en múltiples campos
      if (center.latitude) centerLatitude = parseFloat(center.latitude);
      else if (center.lat) centerLatitude = parseFloat(center.lat);
      else if (center.coordinates?.latitude) centerLatitude = parseFloat(center.coordinates.latitude);
      else if (center.coordinates?.lat) centerLatitude = parseFloat(center.coordinates.lat);
      else if (center.location?.latitude) centerLatitude = parseFloat(center.location.latitude);
      else if (center.location?.lat) centerLatitude = parseFloat(center.location.lat);
      else if (center.position?.latitude) centerLatitude = parseFloat(center.position.latitude);
      else if (center.geo?.latitude) centerLatitude = parseFloat(center.geo.latitude);

      // Buscar longitud en múltiples campos
      if (center.longitude) centerLongitude = parseFloat(center.longitude);
      else if (center.lng) centerLongitude = parseFloat(center.lng);
      else if (center.coordinates?.longitude) centerLongitude = parseFloat(center.coordinates.longitude);
      else if (center.coordinates?.lng) centerLongitude = parseFloat(center.coordinates.lng);
      else if (center.location?.longitude) centerLongitude = parseFloat(center.location.longitude);
      else if (center.location?.lng) centerLongitude = parseFloat(center.location.lng);
      else if (center.position?.longitude) centerLongitude = parseFloat(center.position.longitude);
      else if (center.geo?.longitude) centerLongitude = parseFloat(center.geo.longitude);

      console.log('Found coordinates:', { centerLatitude, centerLongitude });

      let centerLocation = {
        latitude: centerLatitude || 12.1364,
        longitude: centerLongitude || -86.2514,
      };

      // Si no hay coordenadas válidas, intentar geocodificar la dirección
      if ((!centerLatitude || !centerLongitude) && center.address) {
        console.log('No valid coordinates found, geocoding address:', center.address);
        const geocodedLocation = await geocodeAddress(center.address);
        if (geocodedLocation) {
          centerLocation = geocodedLocation;
          console.log('Using geocoded location:', centerLocation);
        }
      }

      // Calcular ruta usando Google Directions API
      const routeData = await getDirections(validUserLocation, centerLocation, transportMode);
      setRouteCoordinates(routeData.coordinates);
      setRouteInfo({
        distance: routeData.distance,
        duration: routeData.duration,
      });
      setNavigationSteps(routeData.steps);
      
      setShowDirectionsModal(true);
    } catch (error) {
      console.error('Error showing directions:', error);
      Alert.alert('Error', 'No se pudieron calcular las direcciones');
    } finally {
      setLoadingRoute(false);
    }
  };

  const getMapRegion = () => {
    if (!userLocation || !center) {
      return {
        latitude: 12.1364,
        longitude: -86.2514,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    // Obtener coordenadas del centro
    const centerLatitude = parseFloat(
      center.latitude || center.lat || 
      center.coordinates?.latitude || center.coordinates?.lat ||
      center.location?.latitude || center.location?.lat ||
      center.position?.latitude || center.position?.lat ||
      center.geo?.latitude || center.geo?.lat
    );
    
    const centerLongitude = parseFloat(
      center.longitude || center.lng || 
      center.coordinates?.longitude || center.coordinates?.lng ||
      center.location?.longitude || center.location?.lng ||
      center.position?.longitude || center.position?.lng ||
      center.geo?.longitude || center.geo?.lng
    );

    if (!centerLatitude || !centerLongitude) {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    // Calcular el centro entre las dos ubicaciones
    const centerLat = (userLocation.latitude + centerLatitude) / 2;
    const centerLng = (userLocation.longitude + centerLongitude) / 2;

    // Calcular la distancia entre los puntos
    const latDiff = Math.abs(userLocation.latitude - centerLatitude);
    const lngDiff = Math.abs(userLocation.longitude - centerLongitude);

    // Agregar padding para que se vea bien
    const padding = 1.5;
    const latitudeDelta = Math.max(latDiff * padding, 0.01);
    const longitudeDelta = Math.max(lngDiff * padding, 0.01);

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta,
      longitudeDelta,
    };
  };


  const loadCenterServices = async () => {
    if (!center?.id) return;
    
    setLoadingServices(true);
    try {
      // Cargar servicios
      const servicesRef = collection(db, 'servicios');
      const servicesQuery = query(
        servicesRef,
        where('centroId', '==', center.id),
        where('activo', '==', true)
      );
      const servicesSnapshot = await getDocs(servicesQuery);
      
      const servicesData = servicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCenterServices(servicesData);
      
      // Cargar productos
      const productsRef = collection(db, 'productos');
      const productsQuery = query(
        productsRef,
        where('centroId', '==', center.id),
        where('disponible', '==', true)
      );
      const productsSnapshot = await getDocs(productsQuery);
      
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCenterProducts(productsData);
      
      console.log('✅ Servicios cargados:', servicesData.length);
      console.log('✅ Productos cargados:', productsData.length);
    } catch (error) {
      console.error('Error cargando servicios y productos:', error);
    } finally {
      setLoadingServices(false);
    }
  };

  const changeTransportMode = async (newMode) => {
    setTransportMode(newMode);
    setLoadingRoute(true);
    
    try {
      if (userLocation && center) {
        // Obtener coordenadas del centro
        const centerLatitude = parseFloat(
          center.latitude || center.lat || 
          center.coordinates?.latitude || center.coordinates?.lat ||
          center.location?.latitude || center.location?.lat ||
          center.position?.latitude || center.position?.lat ||
          center.geo?.latitude || center.geo?.lat
        );
        
        const centerLongitude = parseFloat(
          center.longitude || center.lng || 
          center.coordinates?.longitude || center.coordinates?.lng ||
          center.location?.longitude || center.location?.lng ||
          center.position?.longitude || center.position?.lng ||
          center.geo?.longitude || center.geo?.lng
        );

        if (centerLatitude && centerLongitude) {
          const centerLocation = { latitude: centerLatitude, longitude: centerLongitude };
          
          // Recalcular ruta con nuevo modo de transporte
          const routeData = await getDirections(userLocation, centerLocation, newMode);
          setRouteCoordinates(routeData.coordinates);
          setRouteInfo({
            distance: routeData.distance,
            duration: routeData.duration,
          });
          setNavigationSteps(routeData.steps);
        }
      }
    } catch (error) {
      console.error('Error updating route:', error);
    } finally {
      setLoadingRoute(false);
    }
  };

  const startTurnByTurnNavigation = () => {
    setIsNavigating(true);
    setCurrentStep(0);
    
    // Hacer zoom a la ubicación del usuario
    if (userLocation) {
      setMapRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.005, // Zoom más cercano
        longitudeDelta: 0.005,
      });
    }
    
    console.log('Navigation started');
  };

  const finishNavigation = () => {
    setIsNavigating(false);
    setCurrentStep(0);
    setMapRegion(null); // Resetear la región del mapa
    setShowDirectionsModal(false);
    Alert.alert(
      '¡Navegación completada!',
      'Has llegado a tu destino. ¡Esperamos que hayas disfrutado tu visita!',
      [
        {
          text: 'Finalizar',
          onPress: () => {
            console.log('Navigation completed');
          }
        }
      ]
    );
  };

  const openInGoogleMaps = () => {
    // Usar la misma lógica para obtener coordenadas
    const centerLatitude = parseFloat(
      center.latitude || center.lat || 
      center.coordinates?.latitude || center.coordinates?.lat ||
      center.location?.latitude || center.location?.lat ||
      center.position?.latitude || center.geo?.latitude || 12.1364
    );
    
    const centerLongitude = parseFloat(
      center.longitude || center.lng || 
      center.coordinates?.longitude || center.coordinates?.lng ||
      center.location?.longitude || center.location?.lng ||
      center.position?.longitude || center.geo?.longitude || -86.2514
    );

    const centerLocation = {
      latitude: centerLatitude,
      longitude: centerLongitude,
    };

    console.log('Opening Google Maps with coordinates:', centerLocation);

    const url = `https://www.google.com/maps/dir/?api=1&destination=${centerLocation.latitude},${centerLocation.longitude}&travelmode=driving`;
    
    Linking.openURL(url).catch(err => {
      console.error('Error opening Google Maps:', err);
      Alert.alert('Error', 'No se pudo abrir Google Maps');
    });
  };

  const handleSubmitReply = async () => {
    try {
      if (!authUser?.uid) {
        Alert.alert('Error', 'Debes estar logueado para responder');
        return;
      }

      if (!replyText.trim()) {
        Alert.alert('Error', 'Por favor escribe una respuesta');
        return;
      }

      // Crear la respuesta en Firebase
      const replyData = {
        reviewId: selectedReview.id,
        centerId: center.id,
        userId: authUser.uid,
        userName: authUser.displayName || authUser.email || 'Usuario',
        replyText: replyText.trim(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'respuestas'), replyData);

      // Actualizar la reseña con el contador de respuestas
      const reviewRef = doc(db, 'reseñas', selectedReview.id);
      await updateDoc(reviewRef, {
        replyCount: increment(1),
        updatedAt: new Date()
      });

      // Actualizar la lista de reseñas localmente
      setReviews(prevReviews =>
        prevReviews.map(review => {
          if (review.id === selectedReview.id) {
            return {
              ...review,
              replyCount: (review.replyCount || 0) + 1
            };
          }
          return review;
        })
      );

      // Agregar la nueva respuesta a las respuestas locales
      const newReply = {
        id: 'temp-' + Date.now(),
        reviewId: selectedReview.id,
        centerId: center.id,
        userId: authUser.uid,
        userName: authUser.displayName || authUser.email || 'Usuario',
        replyText: replyText.trim(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setReplies(prev => ({
        ...prev,
        [selectedReview.id]: [newReply, ...(prev[selectedReview.id] || [])]
      }));

      Alert.alert('Éxito', 'Respuesta enviada correctamente');
      setShowReplyModal(false);
      setSelectedReview(null);
      setReplyText('');
    } catch (error) {
      console.error('Error replying to review:', error);
      Alert.alert('Error', 'No se pudo enviar la respuesta');
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    Alert.alert(
      isFavorite ? 'Eliminado de Favoritos' : 'Agregado a Favoritos',
      isFavorite ? 'El centro ha sido eliminado de tus favoritos' : 'El centro ha sido agregado a tus favoritos'
    );
  };

  const handleReservation = () => {
    Alert.alert(
      'Reservación',
      '¿Deseas hacer una reservación en este centro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Reservar', onPress: () => {
          // Aquí implementarías la lógica de reservación
          Alert.alert('Reservación', 'Funcionalidad de reservación próximamente');
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {center.nombreNegocio || 
           (typeof center.businessName === 'string' ? center.businessName : 
            (center.businessName?.nombre || 'Centro Turístico'))}
        </Text>
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={toggleFavorite}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={20} 
            color={isFavorite ? colors.error : colors.text.muted} 
          />
          <Text style={styles.favoriteText}>Favorito</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Imagen del centro */}
        <View style={styles.imageContainer}>
          {center.imagenPerfil || center.logotipo || center.imagenPrincipal || center.fotoPrincipal || center.image ? (
            <Image 
              source={{ 
                uri: center.imagenPerfil || center.logotipo || center.imagenPrincipal || center.fotoPrincipal || center.image
              }} 
              style={styles.centerImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons 
                name={getCategoryIcon(center.categoriaNegocio || center.category)} 
                size={48} 
                color={colors.text.muted} 
              />
            </View>
          )}
        </View>

        {/* Información principal */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={styles.centerName}>
              {center.nombreNegocio || 
               (typeof center.businessName === 'string' ? center.businessName : 
                (center.businessName?.nombre || 'Centro Turístico'))}
            </Text>
            <View style={styles.categoryBadge}>
              <Ionicons 
                name={getCategoryIcon(center.categoriaNegocio || center.category)} 
                size={16} 
                color={colors.primary} 
              />
              <Text style={styles.categoryText}>
                {center.categoriaNegocio || 
                 (typeof center.category === 'string' ? center.category : 
                  (center.category?.nombre || 'Otros'))}
              </Text>
            </View>
          </View>
          
          <Text style={styles.department}>
            {center.departamento || 
             (typeof center.department === 'string' ? center.department : 
              (center.department?.nombre || 'Departamento'))}
          </Text>
          
          {center.description && (
            <Text style={styles.description}>
              {typeof center.description === 'string' ? center.description : 
               JSON.stringify(center.description)}
            </Text>
          )}
        </View>

        {/* Información de contacto */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Información de Contacto</Text>
          
          {(center.telefonoNegocio || center.telefono) && (
            <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
              <Ionicons name="call" size={20} color={colors.success} />
              <Text style={[styles.contactText, styles.clickableText]}>
                {center.telefonoNegocio || center.telefono}
              </Text>
            </TouchableOpacity>
          )}
          
          {(center.emailNegocio || center.email) && (
            <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
              <Ionicons name="mail" size={20} color={colors.primary} />
              <Text style={[styles.contactText, styles.clickableText]}>
                {center.emailNegocio || center.email}
              </Text>
            </TouchableOpacity>
          )}
          
          {center.address && (
            <View style={styles.contactItem}>
              <Ionicons name="location" size={20} color={colors.text.muted} />
              <Text style={styles.contactText}>{center.address}</Text>
            </View>
          )}
        </View>

        {/* Servicios */}
        {center.servicios && (
          <View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>Servicios</Text>
            <Text style={styles.servicesText}>
              {typeof center.servicios === 'string' ? center.servicios : 
               (center.servicios?.tipoCentro || 
                (center.servicios?.categorias ? center.servicios.categorias.join(', ') : 
                 JSON.stringify(center.servicios)))}
            </Text>
          </View>
        )}

        {/* Horarios */}
          <View style={styles.hoursSection}>
          <View style={styles.hoursHeader}>
            <Text style={styles.sectionTitle}>Horarios</Text>
            {isOpen !== null && (
              <View style={[styles.statusBadge, { backgroundColor: isOpen ? withOpacity(colors.success, 0.1) : withOpacity(colors.error, 0.1) }]}>
                <Ionicons 
                  name={isOpen ? "checkmark-circle" : "close-circle"} 
                  size={16} 
                  color={isOpen ? colors.success : colors.error} 
                />
                <Text style={styles.statusText}>
                  {isOpen ? 'Abierto' : 'Cerrado'}
                </Text>
          </View>
        )}
          </View>
          
          {getThreeDaysHours().map((day, index) => (
            <View key={index} style={styles.dayHours}>
              <Text style={styles.dayLabel}>{day.periodLabel} - {day.dayLabel}</Text>
              <View style={styles.hoursRow}>
                <View style={styles.hourItem}>
                  <Ionicons name="time" size={16} color={colors.success} />
                  <Text style={styles.hourText}>
                    Abre: {formatTo12Hour(day.open)}
                  </Text>
                </View>
                <View style={styles.hourItem}>
                  <Ionicons name="time" size={16} color={colors.error} />
                  <Text style={styles.hourText}>
                    Cierra: {formatTo12Hour(day.close)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
          
          {center.horarios && typeof center.horarios === 'string' && (
            <Text style={styles.hoursText}>
              {center.horarios}
            </Text>
          )}
        </View>

        {/* Sección de Reseñas */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Reseñas</Text>
        </View>
        
          {/* Mostrar reseñas reales */}
          {loadingReviews ? (
            <View style={styles.reviewsPlaceholder}>
              <Text style={styles.loadingText}>Cargando reseñas...</Text>
            </View>
          ) : reviews.length > 0 ? (
            reviews.slice(0, 3).map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>
                    {review.userName || review.nombreUsuario || review.displayName || 'Usuario'}
                  </Text>
                  <View style={styles.reviewRating}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= (review.rating || review.calificacion || 5) ? "star" : "star-outline"}
                        size={16}
                        color={colors.warning}
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewText} numberOfLines={3}>
                  {review.comment || review.comentario || review.descripcion || 'Sin comentario'}
                </Text>
                
                <View style={styles.reviewActions}>
                <Text style={styles.reviewDate}>
                  {(() => {
                    const dateField = review.createdAt || review.fechaCreacion || review.date || review.timestamp;
                    console.log('Date field for review:', dateField);
                    
                    if (dateField) {
                      try {
                        let date;
                        if (dateField.toDate && typeof dateField.toDate === 'function') {
                          // Si es un Timestamp de Firebase
                          date = dateField.toDate();
                        } else if (typeof dateField === 'string') {
                          date = new Date(dateField);
                        } else if (dateField instanceof Date) {
                          date = dateField;
                        } else if (dateField.seconds) {
                          // Si es un objeto con seconds (Firebase Timestamp)
                          date = new Date(dateField.seconds * 1000);
                        } else {
                          date = new Date(dateField);
                        }
                        
                        console.log('Parsed date:', date);
                        if (!isNaN(date.getTime())) {
                          return date.toLocaleDateString('es-ES');
                        }
                      } catch (error) {
                        console.log('Error parsing date:', dateField, error);
                      }
                    }
                    return 'Fecha no disponible';
                  })()}
                </Text>
                  
                  <View style={styles.reviewActionButtons}>
          <TouchableOpacity 
                      style={styles.reviewActionButton}
                      onPress={() => handleLikeReview(review.id)}
                    >
                      <Ionicons 
                        name={likedReviews.has(review.id) ? "heart" : "heart-outline"} 
                        size={16} 
                        color={colors.error} 
                      />
                      <Text style={styles.reviewActionText}>
                        {review.likeCount || 0} Me gusta
                      </Text>
          </TouchableOpacity>
          
                    <TouchableOpacity 
                      style={styles.reviewActionButton}
                      onPress={() => (review.replyCount > 0 ? handleViewReplies(review) : handleReplyToReview(review))}
                    >
                      <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
                      <Text style={styles.reviewActionText}>
                        {review.replyCount || 0} Respuestas
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.reviewsPlaceholder}>
              <Ionicons name="star-outline" size={48} color={colors.text.muted} />
              <Text style={styles.reviewsPlaceholderText}>No hay reseñas aún</Text>
              <Text style={styles.reviewsPlaceholderSubtext}>
                Sé el primero en dejar una reseña
              </Text>
            </View>
          )}
        </View>
        
      </ScrollView>

      {/* Modal para responder a reseñas */}
      <Modal
        visible={showReplyModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={handleCloseReplyModal}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Responder a Reseña</Text>
            <View style={styles.modalRight} />
          </View>
          
          {selectedReview && (
            <ScrollView style={styles.replyModalContent}>
              <View style={styles.reviewToReply}>
                <Text style={styles.reviewToReplyTitle}>Reseña original:</Text>
                <View style={styles.reviewToReplyContent}>
                  <Text style={styles.reviewToReplyAuthor}>
                    {selectedReview.userName || selectedReview.nombreUsuario || selectedReview.displayName || 'Usuario'}
                  </Text>
                  <Text style={styles.reviewToReplyText}>
                    {selectedReview.comment || selectedReview.comentario || selectedReview.descripcion || 'Sin comentario'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.replyForm}>
                <Text style={styles.replyFormTitle}>Tu respuesta:</Text>
                <TextInput
                  style={styles.replyTextInput}
                  placeholder="Escribe tu respuesta aquí..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={replyText}
                  onChangeText={setReplyText}
                />
                
                <TouchableOpacity
                  style={styles.sendReplyButton}
                  onPress={handleSubmitReply}
                >
                  <Text style={styles.sendReplyButtonText}>Enviar Respuesta</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Modal para ver respuestas existentes */}
      <Modal
        visible={showRepliesModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowRepliesModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Respuestas</Text>
            <View style={styles.modalRight} />
          </View>
          
          {selectedReviewForReplies && (
            <ScrollView style={styles.repliesModalContent}>
              {/* Reseña original */}
              <View style={styles.originalReview}>
                <Text style={styles.originalReviewTitle}>Reseña original:</Text>
                <View style={styles.originalReviewContent}>
                  <Text style={styles.originalReviewAuthor}>
                    {selectedReviewForReplies.userName || selectedReviewForReplies.nombreUsuario || selectedReviewForReplies.displayName || 'Usuario'}
                  </Text>
                  <Text style={styles.originalReviewText}>
                    {selectedReviewForReplies.comment || selectedReviewForReplies.comentario || selectedReviewForReplies.descripcion || 'Sin comentario'}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.replyToOriginalButton}
                  onPress={() => {
                    setShowRepliesModal(false);
                    handleReplyToReview(selectedReviewForReplies);
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
                  <Text style={styles.replyToOriginalText}>Responder</Text>
                </TouchableOpacity>
              </View>

              {/* Lista de respuestas */}
              <View style={styles.repliesList}>
                <Text style={styles.repliesListTitle}>
                  Respuestas ({replies[selectedReviewForReplies.id]?.length || 0})
                </Text>
                
                {replies[selectedReviewForReplies.id]?.map((reply) => (
                  <View key={reply.id} style={styles.replyItem}>
                    <View style={styles.replyHeader}>
                      <Text style={styles.replyAuthor}>{reply.userName}</Text>
                      <Text style={styles.replyDate}>
                        {(() => {
                          try {
                            const date = reply.createdAt?.toDate ? reply.createdAt.toDate() : new Date(reply.createdAt);
                            return date.toLocaleDateString('es-ES');
                          } catch {
                            return 'Fecha no disponible';
                          }
                        })()}
                      </Text>
                    </View>
                    <Text style={styles.replyText}>{reply.replyText}</Text>
                    <TouchableOpacity 
                      style={styles.replyToReplyButton}
                      onPress={() => {
                        setShowRepliesModal(false);
                        handleReplyToReview(selectedReviewForReplies);
                      }}
                    >
                      <Ionicons name="chatbubble-outline" size={14} color={colors.primary} />
                      <Text style={styles.replyToReplyText}>Responder</Text>
                    </TouchableOpacity>
                  </View>
                )) || []}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Modal con mapa de direcciones */}
      <Modal
        visible={showDirectionsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDirectionsModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isNavigating ? "Navegando..." : "Cómo llegar"}
            </Text>
            <View style={styles.modalRight} />
          </View>
          
          <View style={styles.mapContainer}>
            {isNavigating && (
              <View style={styles.navigationIndicator}>
                <View style={styles.navigationPulse} />
                <Text style={styles.navigationText}>Navegación activa</Text>
              </View>
            )}
            <MapView
              style={styles.map}
              initialRegion={getMapRegion()}
              region={mapRegion || getMapRegion()}
              showsUserLocation={true}
              showsMyLocationButton={true}
            >
              {/* Marcador de ubicación del usuario */}
              {userLocation && userLocation.latitude && userLocation.longitude && (
                <Marker
                  coordinate={{
                    latitude: parseFloat(userLocation.latitude),
                    longitude: parseFloat(userLocation.longitude),
                  }}
                  title="Tu ubicación"
                  description="Tu ubicación actual"
                  pinColor="blue"
                />
              )}
              
              {/* Marcador del centro turístico */}
              <Marker
                coordinate={{
                  latitude: parseFloat(
                    center.latitude || center.lat || 
                    center.coordinates?.latitude || center.coordinates?.lat ||
                    center.location?.latitude || center.location?.lat ||
                    center.position?.latitude || center.geo?.latitude || 12.1364
                  ),
                  longitude: parseFloat(
                    center.longitude || center.lng || 
                    center.coordinates?.longitude || center.coordinates?.lng ||
                    center.location?.longitude || center.location?.lng ||
                    center.position?.longitude || center.geo?.longitude || -86.2514
                  ),
                }}
                title={center.nombreNegocio || center.businessName || 'Centro Turístico'}
                description={center.address || 'Dirección del centro'}
                pinColor="red"
              />
              
              {/* Línea de ruta */}
              {routeCoordinates.length > 0 && (
                <Polyline
                  coordinates={routeCoordinates}
                  strokeColor="#3B82F6"
                  strokeWidth={4}
                  lineJoin="round"
                  lineCap="round"
                />
              )}
            </MapView>
            
            {/* Información de la ruta */}
            <View style={styles.routeInfo}>
              <View style={styles.routeInfoItem}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <Text style={styles.routeInfoText}>
                  {center.nombreNegocio || center.businessName || 'Centro Turístico'}
                </Text>
              </View>
              {center.address && (
                <View style={styles.routeInfoItem}>
                  <Ionicons name="map" size={20} color={colors.text.muted} />
                  <Text style={styles.routeInfoAddress}>{center.address}</Text>
                </View>
              )}
              
              {routeInfo && (
                <View style={styles.routeStats}>
                  <View style={styles.routeStatItem}>
                    <Ionicons name="speedometer" size={16} color={colors.success} />
                    <Text style={styles.routeStatText}>{routeInfo.duration}</Text>
                  </View>
                  <View style={styles.routeStatItem}>
                    <Ionicons name="resize" size={16} color={colors.primary} />
                    <Text style={styles.routeStatText}>{routeInfo.distance}</Text>
                  </View>
                </View>
              )}

              {/* Opciones de transporte */}
              <View style={styles.transportOptions}>
                <Text style={styles.transportTitle}>Modo de transporte</Text>
                <View style={styles.transportButtons}>
                  <TouchableOpacity 
                    style={[styles.transportButton, transportMode === 'driving' && styles.transportButtonActive]}
                    onPress={() => changeTransportMode('driving')}
                    disabled={loadingRoute}
                  >
                    <Ionicons 
                      name="car" 
                      size={20} 
                      color={transportMode === 'driving' ? colors.text.primary : colors.text.muted} 
                    />
                    <Text style={[styles.transportButtonText, transportMode === 'driving' && styles.transportButtonTextActive]}>
                      Vehículo
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.transportButton, transportMode === 'walking' && styles.transportButtonActive]}
                    onPress={() => changeTransportMode('walking')}
                    disabled={loadingRoute}
                  >
                    <Ionicons 
                      name="walk" 
                      size={20} 
                      color={transportMode === 'walking' ? colors.text.primary : colors.text.muted} 
                    />
                    <Text style={[styles.transportButtonText, transportMode === 'walking' && styles.transportButtonTextActive]}>
                      A pie
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.transportButton, transportMode === 'bicycling' && styles.transportButtonActive]}
                    onPress={() => changeTransportMode('bicycling')}
                    disabled={loadingRoute}
                  >
                    <Ionicons 
                      name="bicycle" 
                      size={20} 
                      color={transportMode === 'bicycling' ? colors.text.primary : colors.text.muted} 
                    />
                    <Text style={[styles.transportButtonText, transportMode === 'bicycling' && styles.transportButtonTextActive]}>
                      Bicicleta
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.transportButton, transportMode === 'motorcycle' && styles.transportButtonActive]}
                    onPress={() => changeTransportMode('motorcycle')}
                    disabled={loadingRoute}
                  >
                    <Ionicons 
                      name="bicycle" 
                      size={20} 
                      color={transportMode === 'motorcycle' ? colors.text.primary : colors.text.muted} 
                    />
                    <Text style={[styles.transportButtonText, transportMode === 'motorcycle' && styles.transportButtonTextActive]}>
                      Moto
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              
              <TouchableOpacity 
                style={[styles.startJourneyButton, isNavigating && styles.arrivalButton]}
                onPress={isNavigating ? finishNavigation : startTurnByTurnNavigation}
              >
                <Ionicons 
                  name={isNavigating ? "checkmark-circle" : "navigate"} 
                  size={20} 
                  color="white" 
                />
                <Text style={styles.startJourneyText}>
                  {isNavigating ? "Llegué a mi destino" : "Comenzar viaje"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal de Servicios y Productos */}
      <Modal
        visible={showServicesModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowServicesModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Productos y Servicios</Text>
            <View style={styles.modalRight} />
          </View>
          
          <ScrollView style={styles.servicesContent} showsVerticalScrollIndicator={false}>
            {/* Información del Centro */}
            <View style={styles.centerInfoHeader}>
              <Text style={styles.centerName}>{center.nombre}</Text>
              <Text style={styles.centerCategory}>{center.categoria}</Text>
            </View>


            {/* Loading indicator */}
            {loadingServices && (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Cargando servicios y productos...</Text>
              </View>
            )}

            {/* Servicios */}
            {centerServices.length > 0 && (
              <View style={styles.servicesSection}>
                <Text style={styles.sectionTitle}>Servicios</Text>
                {centerServices.map((servicio, index) => (
                  <View key={servicio.id || index} style={styles.serviceItem}>
                    <View style={styles.serviceIcon}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    </View>
                    <View style={styles.serviceContent}>
                      <Text style={styles.serviceName}>
                        {servicio.nombre || servicio.titulo || servicio.name || 'Servicio'}
                      </Text>
                      {servicio.descripcion && (
                        <Text style={styles.serviceDescription}>{servicio.descripcion}</Text>
                      )}
                      {servicio.precio && (
                        <Text style={styles.servicePrice}>${servicio.precio}</Text>
                      )}
                      {servicio.tipo && (
                        <Text style={styles.serviceType}>Tipo: {servicio.tipo}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Productos */}
            {centerProducts.length > 0 && (
              <View style={styles.servicesSection}>
                <Text style={styles.sectionTitle}>Productos</Text>
                {centerProducts.map((producto, index) => (
                  <View key={producto.id || index} style={styles.serviceItem}>
                    <View style={styles.serviceIcon}>
                      <Ionicons name="bag" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.serviceContent}>
                      <Text style={styles.serviceName}>
                        {producto.nombre || producto.titulo || producto.name || 'Producto'}
                      </Text>
                      {producto.descripcion && (
                        <Text style={styles.serviceDescription}>{producto.descripcion}</Text>
                      )}
                      {producto.precio && (
                        <Text style={styles.servicePrice}>${producto.precio}</Text>
                      )}
                      {producto.categoria && (
                        <Text style={styles.serviceType}>Categoría: {producto.categoria}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Menú (si es restaurante) */}
            {center.menu && center.menu.length > 0 && (
              <View style={styles.servicesSection}>
                <Text style={styles.sectionTitle}>Menú</Text>
                {center.menu.map((item, index) => (
                  <View key={index} style={styles.serviceItem}>
                    <View style={styles.serviceIcon}>
                      <Ionicons name="restaurant" size={20} color={colors.warning} />
                    </View>
                    <View style={styles.serviceContent}>
                      <Text style={styles.serviceName}>{item.nombre || item}</Text>
                      {item.descripcion && (
                        <Text style={styles.serviceDescription}>{item.descripcion}</Text>
                      )}
                      {item.precio && (
                        <Text style={styles.servicePrice}>${item.precio}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Habitaciones (si es hotel) */}
            {center.habitaciones && center.habitaciones.length > 0 && (
              <View style={styles.servicesSection}>
                <Text style={styles.sectionTitle}>Habitaciones</Text>
                {center.habitaciones.map((habitacion, index) => (
                  <View key={index} style={styles.serviceItem}>
                    <View style={styles.serviceIcon}>
                      <Ionicons name="bed" size={20} color={colors.secondary} />
                    </View>
                    <View style={styles.serviceContent}>
                      <Text style={styles.serviceName}>{habitacion.tipo || habitacion}</Text>
                      {habitacion.descripcion && (
                        <Text style={styles.serviceDescription}>{habitacion.descripcion}</Text>
                      )}
                      {habitacion.precio && (
                        <Text style={styles.servicePrice}>${habitacion.precio}/noche</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Mensaje si no hay servicios */}
            {!loadingServices && centerServices.length === 0 && centerProducts.length === 0 && (
              <View style={styles.noServicesContainer}>
                <Ionicons name="information-circle" size={48} color={colors.text.muted} />
                <Text style={styles.noServicesText}>
                  No hay servicios o productos registrados
                </Text>
                <Text style={styles.noServicesSubtext}>
                  El centro turístico aún no ha agregado información sobre sus servicios
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  favoriteText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.muted,
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    height: 200,
    backgroundColor: colors.background,
  },
  centerImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  infoSection: {
    padding: 20,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  centerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
    marginRight: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withOpacity(colors.primary, 0.1),
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  department: {
    fontSize: 16,
    color: colors.text.muted,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  contactSection: {
    padding: 20,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    color: colors.text.primary,
    marginLeft: 12,
    flex: 1,
  },
  clickableText: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  servicesSection: {
    padding: 20,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  servicesText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  hoursSection: {
    padding: 20,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  hoursHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  todayHours: {
    marginBottom: 12,
  },
  todayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  dayHours: {
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hourItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  hourText: {
    fontSize: 14,
    color: colors.text.muted,
    marginLeft: 6,
  },
  hoursText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  reviewButton: {
    backgroundColor: withOpacity(colors.warning, 0.1),
    borderWidth: 1,
    borderColor: colors.warning,
  },
  reviewsSection: {
    backgroundColor: colors.surface,
    padding: 16,
    marginBottom: 12,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
  },
  writeReviewText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4,
  },
  reviewsPlaceholder: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  reviewsPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 12,
    marginBottom: 4,
  },
  reviewsPlaceholderSubtext: {
    fontSize: 14,
    color: colors.text.muted,
    textAlign: 'center',
  },
  reviewItem: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewText: {
    fontSize: 14,
    color: colors.text.muted,
    lineHeight: 20,
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  loadingText: {
    fontSize: 14,
    color: colors.text.muted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  reviewActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  reviewActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.background,
    borderRadius: 6,
  },
  reviewActionText: {
    fontSize: 12,
    color: colors.text.muted,
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 8,
  },
  modalRight: {
    flex: 1,
  },
  replyModalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  reviewToReply: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  reviewToReplyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  reviewToReplyContent: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
  },
  reviewToReplyAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  reviewToReplyText: {
    fontSize: 14,
    color: colors.text.muted,
    lineHeight: 20,
  },
  replyForm: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  replyFormTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  replyTextInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text.primary,
    minHeight: 100,
    marginBottom: 16,
  },
  sendReplyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendReplyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  repliesModalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  originalReview: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  originalReviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  originalReviewContent: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
  },
  originalReviewAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  originalReviewText: {
    fontSize: 14,
    color: colors.text.muted,
    lineHeight: 20,
  },
  repliesList: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  repliesListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  replyItem: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  replyAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  replyDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  replyText: {
    fontSize: 14,
    color: colors.text.muted,
    lineHeight: 20,
    marginBottom: 8,
  },
  replyToOriginalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: withOpacity(colors.primary, 0.1),
    borderRadius: 8,
    marginTop: 8,
  },
  replyToOriginalText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4,
  },
  replyToReplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: withOpacity(colors.primary, 0.1),
    borderRadius: 6,
  },
  replyToReplyText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  routeInfo: {
    backgroundColor: colors.surface,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  routeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 8,
  },
  routeInfoAddress: {
    fontSize: 14,
    color: colors.text.muted,
    marginLeft: 8,
    flex: 1,
  },
  startJourneyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 12,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  startJourneyText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  arrivalButton: {
    backgroundColor: colors.success, // Verde para indicar llegada
    shadowColor: '#10B981',
  },
  navigationIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
  },
  navigationPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 8,
  },
  navigationText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  transportOptions: {
    marginVertical: 16,
  },
  transportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  transportButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  transportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  transportButtonActive: {
    backgroundColor: colors.primary,
    borderColor: '#3B82F6',
  },
  transportButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.muted,
    marginLeft: 6,
  },
  transportButtonTextActive: {
    color: 'white',
  },
  // Estilos para modal de servicios
  servicesContent: {
    flex: 1,
    padding: 20,
  },
  centerInfoHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  centerName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  centerCategory: {
    fontSize: 16,
    color: colors.text.muted,
    textAlign: 'center',
  },
  servicesSection: {
    marginBottom: 24,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  serviceIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  serviceContent: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: colors.text.muted,
    lineHeight: 20,
    marginBottom: 8,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  serviceType: {
    fontSize: 12,
    color: colors.text.muted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.muted,
  },
  // Estilos para búsqueda y filtros
  searchAndFiltersContainer: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: 4,
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withOpacity(colors.primary, 0.1),
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginHorizontal: 6,
  },
  filtersPanel: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  categoriesScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: '#3B82F6',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.muted,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  noServicesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noServicesText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.muted,
    marginTop: 16,
    textAlign: 'center',
  },
  noServicesSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  debugInfo: {
    backgroundColor: withOpacity(colors.warning, 0.1),
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  debugText: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 4,
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
    paddingVertical: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  routeStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeStatText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 4,
  },
});

export default CenterDetailScreen;
