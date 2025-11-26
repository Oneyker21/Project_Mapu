import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { buildDirectionsUrl, validateApiKey } from '../../config/googleMaps';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig.js';

const RouteNavigationScreen = ({ navigation, route }) => {
  const { route: routeCenters, currentIndex = 0, userLocation: passedUserLocation, transportMode = 'driving' } = route.params;
  const mapRef = useRef(null);

  const [userLocation, setUserLocation] = useState(passedUserLocation);

  // Obtener ubicación actual del usuario al inicializar
  useEffect(() => {
    const initializeUserLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

          const currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          console.log('📍 Ubicación actual obtenida:', currentLocation);
          setUserLocation(currentLocation);
        } else {
          console.log('⚠️ Permisos de ubicación denegados, usando ubicación pasada');
        }
      } catch (error) {
        console.error('❌ Error obteniendo ubicación actual:', error);
        console.log('⚠️ Usando ubicación pasada como fallback');
      }
    };

    initializeUserLocation();
  }, []);
  const [currentDestinationIndex, setCurrentDestinationIndex] = useState(0);
  const [currentCenter, setCurrentCenter] = useState(() => {
    // Validar que routeCenters sea un array válido
    if (!Array.isArray(routeCenters)) {
      console.error('routeCenters no es un array:', routeCenters);
      return null;
    }

    // Siempre empezar con el primer centro real (no el punto de inicio)
    const selectedCenters = routeCenters.filter(c => c && c.id !== 'start' && c.coordinate);
    return selectedCenters[0] || null;
  });
  const [routePolyline, setRoutePolyline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [heading, setHeading] = useState(0); // Dirección del usuario
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [destinationBearing, setDestinationBearing] = useState(0);
  const [mapHeading, setMapHeading] = useState(0);
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const [navigating, setNavigating] = useState(false);
  const [centers, setCenters] = useState([]);
  const [routeCompleted, setRouteCompleted] = useState(false);

  useEffect(() => {
    if (userLocation && currentCenter) {
      calculateRoute();
      calculateDistance();
    }
  }, [userLocation, currentCenter]);

  // Cargar todos los centros registrados para mostrarlos como marcadores de referencia
  useEffect(() => {
    const loadCenters = async () => {
      try {
        const centersSnapshot = await getDocs(collection(db, 'centrosTuristicos'));
        const centersData = [];
        centersSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const lat = parseFloat(data.latitud || data.latitude);
          const lng = parseFloat(data.longitud || data.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            centersData.push({
              id: docSnap.id,
              businessName: data.nombreNegocio || data.businessName,
              category: data.categoriaNegocio || data.category,
              isOpen: data.isOpen || data.abierto || true,
              coordinate: { latitude: lat, longitude: lng },
            });
          }
        });
        setCenters(centersData);
      } catch (err) {
        console.log('Error cargando centros para navegación:', err?.message || err);
      }
    };
    loadCenters();
  }, []);

  // Obtener dirección del móvil en tiempo real
  useEffect(() => {
    let watchId = null;

    const startWatching = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          watchId = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.BestForNavigation,
              timeInterval: 500, // Actualizar cada 500ms para mayor fluidez
              distanceInterval: 0.5, // Cada 0.5 metros
            },
            (location) => {
              if (location.coords.heading !== null) {
                console.log('🧭 Heading actualizado:', location.coords.heading);
                setHeading(location.coords.heading);
              }
            }
          );
        }
      } catch (error) {
        console.log('Error obteniendo dirección del móvil:', error);
      }
    };

    startWatching();

    return () => {
      if (watchId) {
        watchId.remove();
      }
    };
  }, []);

  // Centrar mapa en ubicación del usuario (simple y rápido)
  const getCurrentLocation = () => {
    if (!userLocation || !mapRef.current) {
      console.log('⚠️ No hay ubicación del usuario disponible');
      return;
    }

    console.log('🎯 Centrando mapa en mi ubicación:', userLocation);

    // Centrar el mapa INMEDIATAMENTE en la ubicación actual del usuario
    mapRef.current.animateToRegion({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  };

  // Centrar mapa en el destino actual
  const centerOnDestination = () => {
    if (!currentCenter || !mapRef.current) return;

    const destinationLocation = {
      latitude: currentCenter.coordinate.latitude,
      longitude: currentCenter.coordinate.longitude,
    };

    console.log('🎯 Centrando mapa en destino:', currentCenter.businessName);
    console.log('📍 Coordenadas del destino:', destinationLocation);

    // Centrar el mapa en el destino con animación
    mapRef.current.animateToRegion({
      latitude: destinationLocation.latitude,
      longitude: destinationLocation.longitude,
      latitudeDelta: 0.01, // Zoom más cercano para ver mejor el destino
      longitudeDelta: 0.01,
    }, 1000);
  };

  // Calcular distancia entre dos puntos
  const calculateDistance = () => {
    if (!userLocation || !currentCenter) return;

    const R = 6371; // Radio de la Tierra en km
    const dLat = (currentCenter.coordinate.latitude - userLocation.latitude) * Math.PI / 180;
    const dLon = (currentCenter.coordinate.longitude - userLocation.longitude) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(currentCenter.coordinate.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    setDistance(distance);
  };

  // Calcular bearing (dirección) hacia el destino
  const calculateBearing = (lat1, lon1, lat2, lon2) => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360; // Normalizar a 0-360
  };

  // Animación de rotación 360 grados hacia el destino
  const startRotationAnimation = () => {
    if (!userLocation || !currentCenter) return;

    const bearing = calculateBearing(
      userLocation.latitude,
      userLocation.longitude,
      currentCenter.coordinate.latitude,
      currentCenter.coordinate.longitude
    );

    setDestinationBearing(bearing);
    setIsRotating(true);

    // Resetear animación
    rotationAnim.setValue(0);

    console.log('🔄 Iniciando rotación hacia bearing:', bearing);

    // Animar el overlay de rotación
    Animated.timing(rotationAnim, {
      toValue: bearing,
      duration: 2000, // 2 segundos
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsRotating(false);
        setMapHeading(bearing);
        startNavigation();
      }
    });

    // También animar el mapa hacia la región
    if (mapRef.current) {
      const region = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current.animateToRegion(region, 1000);
    }
  };

  // Iniciar navegación
  const startNavigation = () => {
    setNavigating(true);

    // Centrar el mapa en la ruta completa
    if (mapRef.current && routePolyline.length > 0) {
      const coordinates = routePolyline.map(point => ({
        latitude: point.latitude,
        longitude: point.longitude
      }));

      // Ajustar el mapa para mostrar toda la ruta
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
        animated: true,
      });
    }

    // Mostrar alerta de navegación iniciada
    Alert.alert(
      'Navegación Iniciada',
      `Dirigiéndose a ${currentCenter?.businessName}`,
      [
        {
          text: 'Continuar',
          style: 'default'
        }
      ]
    );
  };

  // Ir al siguiente destino
  const goToNextDestination = async () => {
    const nextIndex = currentDestinationIndex + 1;
    const selectedCenters = (routeCenters || []).filter(c => c && c.id !== 'start' && c.coordinate);

    if (nextIndex < selectedCenters.length) {
      // Obtener ubicación actual del usuario antes de avanzar
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

          const currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          console.log('📍 Ubicación actualizada para siguiente destino:', currentLocation);
          setUserLocation(currentLocation);
        }
      } catch (error) {
        console.error('❌ Error obteniendo ubicación actual:', error);
      }

      setCurrentDestinationIndex(nextIndex);
      setCurrentCenter(selectedCenters[nextIndex]);
      setNavigating(false); // Resetear navegación para el nuevo destino
      setRoutePolyline([]); // Limpiar ruta anterior

      // Recalcular ruta automáticamente al nuevo destino
      setTimeout(() => {
        if (userLocation && selectedCenters[nextIndex]) {
          calculateRoute();
        }
      }, 500);

      Alert.alert(
        'Siguiente Destino',
        `Ahora te diriges a ${selectedCenters[nextIndex].businessName}`,
        [
          {
            text: 'Continuar',
            style: 'default'
          }
        ]
      );
    } else {
      // Ruta completada
      setRouteCompleted(true);
      Alert.alert(
        '¡Ruta Completada!',
        'Has llegado a todos los destinos. ¿Cómo te pareció el recorrido?',
        [
          {
            text: 'Evaluar Ruta',
            style: 'default',
            onPress: () => {
              // Navegar a pantalla de evaluación
              navigation.navigate('RouteEvaluation', {
                routeCenters: routeCenters,
                userLocation: userLocation,
                transportMode: transportMode
              });
            }
          }
        ]
      );
    }
  };

  // Completar ruta actual
  const completeCurrentDestination = () => {
    const selectedCenters = (routeCenters || []).filter(c => c && c.id !== 'start' && c.coordinate);

    if (currentDestinationIndex < selectedCenters.length - 1) {
      Alert.alert(
        '¿Qué quieres hacer?',
        `Has llegado a ${currentCenter?.businessName}. ¿Qué te gustaría hacer ahora?`,
        [
          {
            text: 'Dar Reseña',
            style: 'default',
            onPress: () => {
              // Navegar a pantalla de reseñas para este centro
              navigation.navigate('Reviews', {
                center: currentCenter,
                fromRoute: true,
                routeData: {
                  routeCenters: routeCenters,
                  currentDestinationIndex: currentDestinationIndex,
                  userLocation: userLocation,
                  transportMode: transportMode
                }
              });
            }
          },
          {
            text: 'Omitir y Continuar',
            style: 'default',
            onPress: goToNextDestination
          },
          {
            text: 'Seguir aquí',
            style: 'cancel'
          }
        ]
      );
    } else {
      // Último destino - completar ruta
      Alert.alert(
        '¡Último Destino Completado!',
        `Has llegado a ${currentCenter?.businessName}. ¿Qué te gustaría hacer?`,
        [
          {
            text: 'Dar Reseña',
            style: 'default',
            onPress: () => {
              // Navegar a pantalla de reseñas para este centro
              navigation.navigate('Reviews', {
                center: currentCenter,
                fromRoute: true,
                routeData: {
                  routeCenters: routeCenters,
                  currentDestinationIndex: currentDestinationIndex,
                  userLocation: userLocation,
                  transportMode: transportMode
                }
              });
            }
          },
          {
            text: 'Evaluar Ruta Completa',
            style: 'default',
            onPress: () => {
              navigation.navigate('RouteEvaluation', {
                routeCenters: routeCenters,
                userLocation: userLocation,
                transportMode: transportMode
              });
            }
          }
        ]
      );
    }
  };

  // Calcular ruta usando Google Directions API
  const calculateRoute = async () => {
    console.log('🚀 INICIANDO calculateRoute...');
    console.log('🚀 userLocation:', userLocation);
    console.log('🚀 currentCenter:', currentCenter);
    console.log('🚀 currentDestinationIndex:', currentDestinationIndex);

    if (!userLocation || !currentCenter) {
      console.log('❌ No se puede calcular ruta: userLocation o currentCenter faltantes');
      return;
    }

    setLoading(true);
    try {
      const origin = `${userLocation.latitude},${userLocation.longitude}`;
      const destination = `${currentCenter.coordinate.latitude},${currentCenter.coordinate.longitude}`;

      console.log('🗺️ Calculando ruta por ETAPAS:', {
        origin,
        destination,
        currentDestination: currentCenter.businessName,
        stage: `${currentDestinationIndex + 1} de ${(routeCenters || []).filter(c => c && c.id !== 'start' && c.coordinate).length}`
      });

      // Calcular ruta directa al destino actual (sin waypoints)
      const routeCoordinates = await getGoogleDirections(origin, destination, [], transportMode);

      if (routeCoordinates && routeCoordinates.length > 0) {
        console.log('✅ Ruta obtenida de Google con', routeCoordinates.length, 'puntos');
        console.log('✅ Primeros 3 puntos de la ruta:', routeCoordinates.slice(0, 3));
        console.log('✅ Últimos 3 puntos de la ruta:', routeCoordinates.slice(-3));
        setRoutePolyline(routeCoordinates);

        // Ajustar el mapa para mostrar la ruta con zoom apropiado
        if (mapRef.current) {
          // Calcular región óptima para la ruta
          const region = calculateOptimalRegion(routeCoordinates);
          console.log('🗺️ Región calculada para el mapa:', region);

          mapRef.current.animateToRegion(region, 1000);
        }

        console.log('✅ Ruta aplicada al mapa exitosamente');
      } else {
        console.log('⚠️ Google API falló, usando ruta simulada mejorada');
        const fallbackRoute = generateRealisticRoute(userLocation, currentCenter.coordinate);
        console.log('🛣️ Ruta simulada generada con', fallbackRoute.length, 'puntos');
        console.log('🛣️ Primeros 3 puntos de ruta simulada:', fallbackRoute.slice(0, 3));
        setRoutePolyline(fallbackRoute);
      }
    } catch (error) {
      console.error('❌ Error calculando ruta:', error);
      console.log('🛣️ Usando ruta simulada como último recurso');
      const fallbackRoute = generateRealisticRoute(userLocation, currentCenter.coordinate);
      setRoutePolyline(fallbackRoute);
    } finally {
      setLoading(false);
    }
  };

  // Obtener ruta real usando Google Directions API
  const getGoogleDirections = async (origin, destination, waypointsArr = [], mode = 'driving') => {
    try {
      // Usar la API key del servicio de GoogleMaps
      const API_KEY = "AIzaSyAQpx1uTt5cv4GdPuim1LN7jxyNtHiSGDM";

      console.log('🔑 API Key disponible:', !!API_KEY);
      console.log('🔑 API Key (primeros 10 chars):', API_KEY ? API_KEY.substring(0, 10) + '...' : 'NO DISPONIBLE');

      if (!API_KEY || API_KEY === 'TU_GOOGLE_MAPS_API_KEY_AQUI' || !API_KEY.startsWith('AIzaSy')) {
        console.warn('❌ Google Maps API Key no configurada o es placeholder');
        return null;
      }

      // Construir URL con parámetros optimizados para rutas detalladas
      // Construir parámetros; para optimizar el orden de paradas usa 'optimize:true|'
      const waypointsParam = waypointsArr.length > 0
        ? `optimize:true|${waypointsArr.join('|')}`
        : '';

      const params = new URLSearchParams({
        origin: origin,
        destination: destination,
        key: API_KEY,
        mode: mode, // Usar el modo de transporte seleccionado
        language: 'es',
        region: 'ni',
        alternatives: false,
        avoid: mode === 'driving' ? 'tolls|ferries' : '', // Solo evitar peajes/ferries para coche
        units: 'metric',
        traffic_model: mode === 'driving' ? 'best_guess' : '',
        departure_time: Math.floor(Date.now() / 1000).toString(), // Timestamp actual
        // Parámetros críticos para obtener rutas detalladas
        waypoints: waypointsParam
      });

      const url = `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`;

      console.log('🌐 Llamando a Google Directions API...');
      console.log('🌐 URL (sin API key):', url.replace(API_KEY, 'API_KEY_HIDDEN'));

      const response = await fetch(url);
      console.log('📡 Respuesta HTTP:', response.status, response.statusText);

      const data = await response.json();

      console.log('📊 Respuesta completa de Google Directions:', {
        status: data.status,
        routes: data.routes?.length || 0,
        legs: data.routes?.[0]?.legs?.length || 0,
        steps: data.routes?.[0]?.legs?.[0]?.steps?.length || 0,
        overview_polyline: !!data.routes?.[0]?.overview_polyline?.points,
        error_message: data.error_message
      });

      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];

        // Actualizar duración y distancia
        if (leg.duration) {
          setDuration(leg.duration.value);
        }

        const coordinates = [];

        // PRIORIDAD 1: Usar overview_polyline que contiene la ruta completa optimizada
        if (route.overview_polyline && route.overview_polyline.points) {
          const decodedPoints = decodePolyline(route.overview_polyline.points);
          coordinates.push(...decodedPoints);
          console.log('✅ Usando overview_polyline con', decodedPoints.length, 'puntos detallados');

          // Verificar que la ruta no esté vacía
          if (coordinates.length === 0) {
            console.error('❌ Ruta vacía recibida de Google overview_polyline');
            return null;
          }

          return coordinates;
        }

        // PRIORIDAD 2: Usar steps detallados si overview_polyline no está disponible
        if (leg.steps && leg.steps.length > 0) {
          console.log('📍 Procesando', leg.steps.length, 'steps detallados');

          // Procesar cada step para obtener la ruta exacta
          leg.steps.forEach((step, stepIndex) => {
            if (step.polyline && step.polyline.points) {
              const stepPoints = decodePolyline(step.polyline.points);
              coordinates.push(...stepPoints);
              console.log(`📍 Step ${stepIndex + 1}: ${stepPoints.length} puntos - ${step.html_instructions || 'Instrucción no disponible'}`);
            }
          });

          console.log('✅ Usando steps detallados con', coordinates.length, 'puntos totales');

          // Verificar que la ruta no esté vacía
          if (coordinates.length === 0) {
            console.error('❌ Ruta vacía de steps');
            return null;
          }

          return coordinates;
        }

        // PRIORIDAD 3: Fallback con solo inicio y fin (NO USAR - genera línea recta)
        console.warn('⚠️ Solo hay inicio y fin - esto generará línea recta');
        return null; // No devolver línea recta

      } else {
        console.error('❌ Error en Google Directions API:', {
          status: data.status,
          error_message: data.error_message,
          origin,
          destination
        });
        return null;
      }
    } catch (error) {
      console.error('❌ Error llamando a Google Directions API:', error);
      return null;
    }
  };

  // Calcular región óptima para mostrar la ruta
  const calculateOptimalRegion = (coordinates) => {
    if (!coordinates || coordinates.length === 0) {
      return {
        latitude: userLocation?.latitude || 12.1167,
        longitude: userLocation?.longitude || -85.3667,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    // Encontrar límites de la ruta
    let minLat = coordinates[0].latitude;
    let maxLat = coordinates[0].latitude;
    let minLng = coordinates[0].longitude;
    let maxLng = coordinates[0].longitude;

    coordinates.forEach(coord => {
      minLat = Math.min(minLat, coord.latitude);
      maxLat = Math.max(maxLat, coord.latitude);
      minLng = Math.min(minLng, coord.longitude);
      maxLng = Math.max(maxLng, coord.longitude);
    });

    // Calcular centro
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Calcular deltas con margen apropiado
    const latDelta = Math.max(maxLat - minLat, 0.01) * 1.3; // 30% de margen
    const lngDelta = Math.max(maxLng - minLng, 0.01) * 1.3; // 30% de margen

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  };


  // Decodificar polyline de Google
  const decodePolyline = (encoded) => {
    const points = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charAt(index++).charCodeAt(0) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charAt(index++).charCodeAt(0) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5
      });
    }

    return points;
  };

  // Generar ruta simulada que SIGUE CARRETERAS (NO línea recta)
  const generateRealisticRoute = (start, end) => {
    const points = [];

    // Calcular distancia y dirección
    const deltaLat = end.latitude - start.latitude;
    const deltaLng = end.longitude - start.longitude;
    const distance = Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng);

    // Determinar número de puntos basado en la distancia (más puntos para distancias mayores)
    const steps = Math.max(80, Math.min(400, Math.floor(distance * 2000))); // 80-400 puntos para más detalle

    console.log(`🛣️ Generando ruta simulada REALISTA: ${distance.toFixed(3)}° de distancia, ${steps} puntos`);

    // Vector unitario de dirección
    const dirLat = deltaLat / distance;
    const dirLng = deltaLng / distance;

    // Vector perpendicular para curvas
    const perpLat = -dirLng;
    const perpLng = dirLat;

    // Agregar punto de inicio
    points.push({ latitude: start.latitude, longitude: start.longitude });

    // Crear una ruta que simule carreteras reales con múltiples segmentos
    const segments = Math.max(3, Math.floor(distance * 500)); // Más segmentos para distancias mayores
    const segmentLength = 1 / segments;

    console.log(`🛣️ Creando ${segments} segmentos de carretera`);

    for (let segment = 0; segment < segments; segment++) {
      const segmentStart = segment * segmentLength;
      const segmentEnd = (segment + 1) * segmentLength;
      const segmentSteps = Math.floor(steps / segments);

      // Dirección base del segmento
      let segmentDirLat = dirLat;
      let segmentDirLng = dirLng;

      // Variar la dirección del segmento para simular cambios de carretera
      const segmentVariation = Math.sin(segment * Math.PI * 0.8) * 0.3;
      segmentDirLat += segmentVariation * perpLat;
      segmentDirLng += segmentVariation * perpLng;

      // Normalizar dirección del segmento
      const segmentDist = Math.sqrt(segmentDirLat * segmentDirLat + segmentDirLng * segmentDirLng);
      segmentDirLat /= segmentDist;
      segmentDirLng /= segmentDist;

      // Generar puntos del segmento
      for (let i = 0; i < segmentSteps; i++) {
        const t = segmentStart + (i / segmentSteps) * segmentLength;

        // Interpolación base
        let lat = start.latitude + deltaLat * t;
        let lng = start.longitude + deltaLng * t;

        // Intensidad de curvas basada en la distancia total
        const curveIntensity = Math.min(distance * 0.08, 0.02); // Curvas más pronunciadas

        // Patrón 1: Curvas principales del segmento
        const segmentCurve = Math.sin(t * Math.PI * 3) * curveIntensity * 0.8;
        const roadVariation = Math.cos(t * Math.PI * 5) * curveIntensity * 0.4;

        // Aplicar curvas perpendiculares (giros)
        lat += segmentCurve * perpLat;
        lng += segmentCurve * perpLng;

        // Aplicar variaciones en la dirección principal
        lat += roadVariation * segmentDirLat;
        lng += roadVariation * segmentDirLng;

        // Patrón 2: Simular intersecciones importantes
        const intersectionPoints = [0.2, 0.4, 0.6, 0.8];
        for (const intersectionPoint of intersectionPoints) {
          const distanceFromIntersection = Math.abs(t - intersectionPoint);
          if (distanceFromIntersection < 0.08) {
            const intersectionIntensity = (0.08 - distanceFromIntersection) * curveIntensity * 3;
            const intersectionDirection = Math.sin(t * Math.PI * 8) * intersectionIntensity;
            lat += intersectionDirection * perpLat;
            lng += intersectionDirection * perpLng;
            break;
          }
        }

        // Patrón 3: Curvas pronunciadas en puntos específicos
        const sharpTurnPoints = [0.15, 0.35, 0.65, 0.85];
        for (const turnPoint of sharpTurnPoints) {
          const distanceFromTurn = Math.abs(t - turnPoint);
          if (distanceFromTurn < 0.06) {
            const turnIntensity = (0.06 - distanceFromTurn) * curveIntensity * 4;
            const turnDirection = Math.cos(t * Math.PI * 6) * turnIntensity;
            lat += turnDirection * perpLat;
            lng += turnDirection * perpLng;
            break;
          }
        }

        // Patrón 4: Variaciones menores para simular irregularidades de la carretera
        const minorVariation = (Math.random() - 0.5) * curveIntensity * 0.15;
        lat += minorVariation * perpLat;
        lng += minorVariation * perpLng;

        // Patrón 5: Simular cambios de dirección en carreteras principales
        if (t > 0.3 && t < 0.7) {
          const mainRoadVariation = Math.sin(t * Math.PI * 4) * curveIntensity * 0.6;
          lat += mainRoadVariation * perpLat;
          lng += mainRoadVariation * perpLng;
        }

        // Validar coordenadas (no deben salir de Nicaragua)
        lat = Math.max(10.7, Math.min(15.0, lat));
        lng = Math.max(-87.7, Math.min(-82.7, lng));

        // Solo agregar si no es el último punto del último segmento
        if (segment < segments - 1 || i < segmentSteps - 1) {
          points.push({ latitude: lat, longitude: lng });
        }
      }
    }

    // Asegurar que el último punto sea exactamente el destino
    points.push({ latitude: end.latitude, longitude: end.longitude });

    console.log('🛣️ Ruta simulada REALISTA generada con', points.length, 'puntos');
    console.log('🛣️ Primeros 3 puntos:', points.slice(0, 3));
    console.log('🛣️ Últimos 3 puntos:', points.slice(-3));

    return points;
  };


  // Obtener icono según la categoría del centro
  const getCategoryIcon = (category) => {
    const categoryLower = category?.toLowerCase() || '';

    if (categoryLower.includes('restaurante') || categoryLower.includes('comida')) {
      return 'restaurant';
    } else if (categoryLower.includes('hotel') || categoryLower.includes('hospedaje')) {
      return 'bed';
    } else if (categoryLower.includes('turismo') || categoryLower.includes('tour')) {
      return 'camera';
    } else if (categoryLower.includes('recreativo') || categoryLower.includes('parque')) {
      return 'leaf';
    } else if (categoryLower.includes('museo') || categoryLower.includes('cultural')) {
      return 'library';
    } else if (categoryLower.includes('playa') || categoryLower.includes('mar')) {
      return 'water';
    } else if (categoryLower.includes('montaña') || categoryLower.includes('volcán')) {
      return 'mountain';
    } else if (categoryLower.includes('iglesia') || categoryLower.includes('religioso')) {
      return 'church';
    } else if (categoryLower.includes('mercado') || categoryLower.includes('comercial')) {
      return 'storefront';
    } else {
      return 'location'; // Icono por defecto
    }
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}min`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Calculando ruta...</Text>
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
          <Ionicons name="arrow-back" size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Navegación</Text>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={getCurrentLocation}
        >
          <Ionicons name="locate" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Información de la ruta */}
      <TouchableOpacity
        style={styles.routeInfo}
        onPress={centerOnDestination}
        activeOpacity={0.7}
      >
        <View style={styles.destinationInfo}>
          <Text style={styles.destinationName}>{currentCenter?.businessName}</Text>
          <Text style={styles.destinationCategory}>{currentCenter?.category}</Text>
        </View>
        <View style={styles.distanceInfo}>
          <Text style={styles.distanceText}>{distance.toFixed(1)} km</Text>
          {duration > 0 && (
            <Text style={styles.durationText}>{formatDuration(duration)}</Text>
          )}
        </View>
        <View style={styles.tapIndicator}>
          <Ionicons name="location" size={20} color="#3B82F6" />
        </View>
      </TouchableOpacity>

      {/* Indicador de rotación */}
      {isRotating && (
        <View style={styles.rotationIndicator}>
          <Animated.View style={[
            styles.rotationSpinner,
            {
              transform: [{
                rotate: rotationAnim.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg'],
                })
              }]
            }
          ]}>
            <Ionicons name="refresh" size={24} color="#3B82F6" />
          </Animated.View>
          <Text style={styles.rotationText}>Orientando hacia el destino...</Text>
        </View>
      )}

      {/* Overlay de rotación del mapa */}
      {isRotating && (
        <Animated.View style={[
          styles.mapRotationOverlay,
          {
            transform: [{
              rotate: rotationAnim.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              })
            }]
          }
        ]} />
      )}

      {/* Mapa */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: userLocation?.latitude || 12.1167,
            longitude: userLocation?.longitude || -85.3667,
            latitudeDelta: 0.05, // Zoom más amplio inicialmente
            longitudeDelta: 0.05,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
          followsUserLocation={false}
          // Aplicar rotación hacia el destino
          rotateEnabled={!isRotating}
          pitchEnabled={false}
          // Rotación del mapa hacia el destino
          region={{
            latitude: userLocation?.latitude || 12.1167,
            longitude: userLocation?.longitude || -85.3667,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          // Rotación deshabilitada temporalmente
          // heading={mapHeading}
          scrollEnabled={true}
          zoomEnabled={true}
          // Configuración de zoom más controlada
          minZoomLevel={10}
          maxZoomLevel={18}
          customMapStyle={[
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "poi.business",
              stylers: [{ visibility: "off" }]
            }
          ]}
        >
          {/* Ocultamos el marcador personalizado del usuario para que solo se vea el punto azul nativo */}

          {/* Marcadores: antes de navegar -> todos; en navegación -> solo los centros seleccionados de la ruta */}
          {(
            (navigating
              ? (routeCenters || []).filter(c => c && c.id !== 'start' && c.coordinate)
              : centers
            ).map((center, idx) => (
              <Marker
                key={center.id || `route-center-${idx}`}
                coordinate={center.coordinate}
                title={center.businessName}
                description={`${center.category} • ${center.isOpen ? 'Abierto' : 'Cerrado'}`}
                pinColor={center.isOpen ? '#10B981' : '#EF4444'}
              />
            ))
          )}

          {/* Marcador del destino con pin personalizado */}
          {currentCenter && (
            <Marker
              coordinate={currentCenter.coordinate}
              pinColor="transparent"
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={false}
            >
              {/* Pin de ubicación estilo imagen - gota blanca con círculo de color */}
              <View style={styles.destinationPin}>
                {/* Pin principal - gota blanca */}
                <View style={styles.pinDroplet}>
                  {/* Círculo de color en la parte superior */}
                  <View style={[
                    styles.pinCircle,
                    { backgroundColor: currentCenter.isOpen ? '#10B981' : '#EF4444' }
                  ]}>
                    {/* Icono de categoría en el centro del círculo */}
                    <Ionicons
                      name={getCategoryIcon(currentCenter.category)}
                      size={16}
                      color="#FFFFFF"
                    />
                  </View>
                </View>

                {/* Información del centro debajo del pin */}
                <View style={styles.pinInfo}>
                  <Text style={styles.pinName} numberOfLines={1}>
                    {currentCenter.businessName}
                  </Text>
                  <Text style={[
                    styles.pinStatus,
                    { color: currentCenter.isOpen ? '#10B981' : '#EF4444' }
                  ]}>
                    {currentCenter.isOpen ? 'Abierto' : 'Cerrado'}
                  </Text>
                  <Text style={styles.pinCategory}>
                    {currentCenter.category}
                  </Text>
                </View>
              </View>
            </Marker>
          )}

          {/* Línea de ruta continua */}
          {routePolyline.length > 0 && (
            <Polyline
              coordinates={routePolyline}
              strokeColor="#3B82F6"
              strokeWidth={6}
              lineCap="round"
              lineJoin="round"
              strokePattern={null}
            />
          )}

        </MapView>
      </View>

      {/* Información del progreso de la ruta */}
      <View style={styles.routeProgress}>
        <Text style={styles.progressText}>
          Destino {currentDestinationIndex + 1} de {routeCenters.filter(c => c && c.id !== 'start' && c.coordinate).length}
        </Text>
        <Text style={styles.currentDestination}>
          {currentCenter?.businessName || currentCenter?.nombreNegocio}
        </Text>
      </View>

      {/* Botones de acción */}
      <View style={styles.actionButtons}>
        {navigating ? (
          // Botones cuando está navegando
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={getCurrentLocation}
            >
              <Ionicons name="locate" size={20} color="#3B82F6" />
              <Text style={styles.actionButtonText}>Mi ubicación</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.successButton]}
              onPress={completeCurrentDestination}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={[styles.actionButtonText, styles.successButtonText]}>
                Llegué aquí
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          // Botones cuando no está navegando
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={getCurrentLocation}
            >
              <Ionicons name="locate" size={20} color="#3B82F6" />
              <Text style={styles.actionButtonText}>Mi ubicación</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={startRotationAnimation}
              disabled={isRotating}
            >
              <Ionicons
                name={isRotating ? "refresh" : "navigate"}
                size={20}
                color="#FFFFFF"
              />
              <Text style={[styles.actionButtonText, styles.primaryButtonText]}>
                {isRotating ? 'Girando...' : 'Iniciar Navegación'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  locationButton: {
    padding: 8,
  },
  routeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderRightWidth: 3,
    borderRightColor: '#3B82F6', // Indicador visual de que es tocable
  },
  destinationInfo: {
    flex: 1,
  },
  destinationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  destinationCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  distanceInfo: {
    alignItems: 'flex-end',
  },
  distanceText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3B82F6',
  },
  durationText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  tapIndicator: {
    marginLeft: 12,
    padding: 4,
  },
  transportModeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  transportModeText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  arrowContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  routeProgress: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  currentDestination: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  successButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  successButtonText: {
    color: '#FFFFFF',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  rotationIndicator: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  rotationSpinner: {
    marginRight: 12,
  },
  rotationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  mapRotationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    zIndex: 500,
    pointerEvents: 'none',
  },
  customCallout: {
    width: 250,
    padding: 0,
  },
  calloutContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  calloutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  calloutCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  calloutStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  calloutStatusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  calloutServices: {
    marginTop: 4,
  },
  calloutServicesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  calloutServicesText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  centerMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxWidth: 200,
  },
  centerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  centerInfo: {
    flex: 1,
    minWidth: 0,
  },
  centerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  centerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  centerStatusText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
  centerServices: {
    fontSize: 10,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  destinationPin: {
    alignItems: 'center',
  },
  pinDroplet: {
    width: 24,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 2,
  },
  pinCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  pinInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    minWidth: 120,
  },
  pinName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
    textAlign: 'center',
  },
  pinStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  pinCategory: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default RouteNavigationScreen;