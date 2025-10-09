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
import MapView, { Marker, Polyline, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { buildDirectionsUrl, validateApiKey } from '../../config/googleMaps';

const RouteNavigationScreen = ({ navigation, route }) => {
  const { route: routeCenters, currentIndex = 0, userLocation: passedUserLocation } = route.params;
  const mapRef = useRef(null);
  
  const [userLocation, setUserLocation] = useState(passedUserLocation);
  const [currentCenter, setCurrentCenter] = useState(routeCenters[currentIndex + 1]);
  const [routePolyline, setRoutePolyline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [heading, setHeading] = useState(0); // Dirección del usuario
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [destinationBearing, setDestinationBearing] = useState(0);
  const [mapHeading, setMapHeading] = useState(0);
  const rotationAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (userLocation && currentCenter) {
      calculateRoute();
      calculateDistance();
    }
  }, [userLocation, currentCenter]);

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

  // Obtener ubicación actual del usuario
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Permisos de ubicación denegados');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(newLocation);
      
      // Obtener dirección del usuario
      if (location.coords.heading !== null) {
        setHeading(location.coords.heading);
      }
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación actual');
    }
  };

  // Calcular distancia entre dos puntos
  const calculateDistance = () => {
    if (!userLocation || !currentCenter) return;

    const R = 6371; // Radio de la Tierra en km
    const dLat = (currentCenter.coordinate.latitude - userLocation.latitude) * Math.PI / 180;
    const dLon = (currentCenter.coordinate.longitude - userLocation.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(currentCenter.coordinate.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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
    setIsNavigating(true);
    
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

  // Calcular ruta usando Google Directions API
  const calculateRoute = async () => {
    if (!userLocation || !currentCenter) return;
    
    setLoading(true);
    try {
      const origin = `${userLocation.latitude},${userLocation.longitude}`;
      const destination = `${currentCenter.coordinate.latitude},${currentCenter.coordinate.longitude}`;
      
      console.log('🗺️ Calculando ruta:', { origin, destination });
      console.log('🗺️ Ubicación usuario:', userLocation);
      console.log('🗺️ Centro destino:', currentCenter.coordinate);
      
      const routeCoordinates = await getGoogleDirections(origin, destination);
      
      if (routeCoordinates && routeCoordinates.length > 0) {
        console.log('✅ Ruta obtenida de Google con', routeCoordinates.length, 'puntos');
        setRoutePolyline(routeCoordinates);
        
        // Ajustar el mapa para mostrar toda la ruta con zoom apropiado
        if (mapRef.current) {
          // Calcular región óptima para la ruta
          const region = calculateOptimalRegion(routeCoordinates);
          
          mapRef.current.animateToRegion(region, 1000);
        }
        
        console.log('✅ Ruta aplicada al mapa exitosamente');
      } else {
        console.log('⚠️ Google API falló, usando ruta simulada mejorada');
        const fallbackRoute = generateRealisticRoute(userLocation, currentCenter.coordinate);
        console.log('🛣️ Ruta simulada generada con', fallbackRoute.length, 'puntos');
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
  const getGoogleDirections = async (origin, destination) => {
    try {
      // Usar la API key del servicio de GoogleMaps
      const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
      
      console.log('🔑 API Key disponible:', !!API_KEY);
      console.log('🔑 API Key (primeros 10 chars):', API_KEY ? API_KEY.substring(0, 10) + '...' : 'NO DISPONIBLE');
      
      if (!API_KEY || API_KEY === 'TU_GOOGLE_MAPS_API_KEY_AQUI') {
        console.warn('❌ Google Maps API Key no configurada o es placeholder');
        return null;
      }
      
      // Construir URL con parámetros optimizados para rutas detalladas
      const params = new URLSearchParams({
        origin: origin,
        destination: destination,
        key: API_KEY,
        mode: 'driving',
        language: 'es',
        region: 'ni',
        alternatives: false,
        avoid: 'tolls|ferries', // Evitar peajes y ferries para rutas más directas
        units: 'metric',
        traffic_model: 'best_guess',
        departure_time: Math.floor(Date.now() / 1000).toString(), // Timestamp actual
        // Parámetros críticos para obtener rutas detalladas
        waypoints: '', // Sin waypoints para ruta directa
        optimize: 'false'
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

  // Generar ruta simulada más realista como fallback
  const generateRealisticRoute = (start, end) => {
    const points = [];
    
    // Calcular distancia y dirección
    const deltaLat = end.latitude - start.latitude;
    const deltaLng = end.longitude - start.longitude;
    const distance = Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng);
    
    // Determinar número de puntos basado en la distancia (más puntos para distancias mayores)
    const steps = Math.max(50, Math.min(300, Math.floor(distance * 1000))); // 50-300 puntos
    
    console.log(`🛣️ Generando ruta simulada: ${distance.toFixed(3)}° de distancia, ${steps} puntos`);
    
    // Vector unitario de dirección
    const dirLat = deltaLat / distance;
    const dirLng = deltaLng / distance;
    
    // Vector perpendicular para curvas
    const perpLat = -dirLng;
    const perpLng = dirLat;
    
    // Agregar punto de inicio
    points.push({ latitude: start.latitude, longitude: start.longitude });
    
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      
      // Interpolación lineal básica
      let lat = start.latitude + deltaLat * t;
      let lng = start.longitude + deltaLng * t;
      
      // Simular rutas que siguen carreteras principales
      // Las carreteras en Nicaragua suelen seguir patrones más rectos con curvas suaves
      const curveIntensity = Math.min(distance * 0.02, 0.005); // Curvas más suaves
      
      // Patrón 1: Curvas suaves que simulan carreteras principales
      if (i > 5 && i < steps - 5) {
        // Simular giros suaves como en carreteras reales
        const smoothCurve = Math.sin(t * Math.PI * 1.5) * curveIntensity * 0.6;
        const roadVariation = Math.cos(t * Math.PI * 3) * curveIntensity * 0.3;
        
        // Aplicar variaciones perpendiculares (giros)
        lat += smoothCurve * perpLat;
        lng += smoothCurve * perpLng;
        
        // Aplicar variaciones en la dirección principal (curvas en la carretera)
        lat += roadVariation * dirLat;
        lng += roadVariation * dirLng;
      }
      
      // Patrón 2: Simular intersecciones y cambios de dirección
      const intersectionChance = Math.sin(t * Math.PI * 8) * curveIntensity * 0.4;
      if (Math.abs(intersectionChance) > curveIntensity * 0.2) {
        lat += intersectionChance * perpLat * 0.5;
        lng += intersectionChance * perpLng * 0.5;
      }
      
      // Patrón 3: Simular curvas más pronunciadas en ciertos puntos
      const sharpTurnPoints = [0.25, 0.5, 0.75]; // Puntos donde pueden haber giros más pronunciados
      for (const turnPoint of sharpTurnPoints) {
        const distanceFromTurn = Math.abs(t - turnPoint);
        if (distanceFromTurn < 0.1) {
          const turnIntensity = (0.1 - distanceFromTurn) * curveIntensity * 2;
          const turnDirection = Math.sin(t * Math.PI * 4) * turnIntensity;
          lat += turnDirection * perpLat;
          lng += turnDirection * perpLng;
          break;
        }
      }
      
      // Patrón 4: Simular variaciones menores como baches o curvas naturales
      const minorVariation = (Math.random() - 0.5) * curveIntensity * 0.1;
      lat += minorVariation * perpLat;
      lng += minorVariation * perpLng;
      
      // Validar coordenadas (no deben salir de Nicaragua)
      lat = Math.max(10.7, Math.min(15.0, lat));
      lng = Math.max(-87.7, Math.min(-82.7, lng));
      
      points.push({ latitude: lat, longitude: lng });
    }
    
    // Asegurar que el último punto sea exactamente el destino
    points.push({ latitude: end.latitude, longitude: end.longitude });
    
    console.log('🛣️ Ruta simulada generada con', points.length, 'puntos');
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
      <View style={styles.routeInfo}>
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
      </View>

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
          provider={PROVIDER_GOOGLE}
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
          {/* Marcador del usuario con flecha direccional */}
          {userLocation && (
            <Marker
              coordinate={userLocation}
              title="Tu ubicación"
              pinColor="transparent"
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={{
                transform: [{ rotate: `${heading}deg` }]
              }}>
                <Ionicons name="navigate" size={32} color="#10B981" />
              </View>
            </Marker>
          )}

          {/* Marcador del destino con pin personalizado */}
          {currentCenter && (
            <Marker
              coordinate={currentCenter.coordinate}
              title={currentCenter.businessName}
              description={`${currentCenter.category} • ${currentCenter.isOpen ? '🟢 Abierto' : '🔴 Cerrado'}`}
              pinColor="transparent"
              anchor={{ x: 0.5, y: 1 }}
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
              
              {/* Callout personalizado con más información */}
              <Callout style={styles.customCallout}>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>{currentCenter.businessName}</Text>
                  <Text style={styles.calloutCategory}>{currentCenter.category}</Text>
                  <View style={styles.calloutStatus}>
                    <Ionicons 
                      name={currentCenter.isOpen ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={currentCenter.isOpen ? "#10B981" : "#EF4444"} 
                    />
                    <Text style={[
                      styles.calloutStatusText,
                      { color: currentCenter.isOpen ? "#10B981" : "#EF4444" }
                    ]}>
                      {currentCenter.isOpen ? 'Abierto' : 'Cerrado'}
                    </Text>
                  </View>
                  {currentCenter.services && currentCenter.services.length > 0 && (
                    <View style={styles.calloutServices}>
                      <Text style={styles.calloutServicesTitle}>Servicios:</Text>
                      <Text style={styles.calloutServicesText}>
                        {currentCenter.services.slice(0, 3).join(', ')}
                        {currentCenter.services.length > 3 && '...'}
                      </Text>
                    </View>
                  )}
                </View>
              </Callout>
            </Marker>
          )}

          {/* Línea de ruta */}
          {routePolyline.length > 0 && (
            <Polyline
              coordinates={routePolyline}
              strokeColor="#3B82F6"
              strokeWidth={8}
              lineDashPattern={[20, 10]}
              lineCap="round"
              lineJoin="round"
            />
          )}

        </MapView>
      </View>

      {/* Botones de acción */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={getCurrentLocation}
        >
          <Ionicons name="locate" size={20} color="#3B82F6" />
          <Text style={styles.actionButtonText}>Mi ubicación</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryButton]}
          onPress={isNavigating ? () => {
            Alert.alert('Navegación', 'Ya estás navegando hacia el destino');
          } : startRotationAnimation}
          disabled={isRotating}
        >
          <Ionicons 
            name={isRotating ? "refresh" : isNavigating ? "navigate" : "navigate"} 
            size={20} 
            color="#FFFFFF" 
          />
          <Text style={[styles.actionButtonText, styles.primaryButtonText]}>
            {isRotating ? 'Girando...' : isNavigating ? 'Navegando...' : 'Iniciar Navegación'}
          </Text>
        </TouchableOpacity>
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