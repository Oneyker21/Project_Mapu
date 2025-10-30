import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';

/**
 * Función robusta para solicitar permisos de ubicación
 * @returns {Promise<boolean>} true si los permisos fueron concedidos
 */
export const requestLocationPermission = async () => {
  try {
    console.log('📍 Iniciando solicitud de permisos de ubicación...');
    
    // Verificar si los servicios de ubicación están habilitados
    const isLocationEnabled = await Location.hasServicesEnabledAsync();
    if (!isLocationEnabled) {
      console.log('📍 Servicios de ubicación deshabilitados');
      Alert.alert(
        'GPS Desactivado',
        'Por favor activa el GPS en la configuración de tu dispositivo para usar esta función.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Configuración', onPress: () => Location.enableNetworkProviderAsync() }
        ]
      );
      return false;
    }

    // Solicitar permisos de primer plano
    let { status } = await Location.requestForegroundPermissionsAsync();
    console.log('📍 Estado de permisos de primer plano:', status);
    
    if (status !== 'granted') {
      console.log('📍 Permisos de primer plano denegados');
      Alert.alert(
        'Permisos de Ubicación Necesarios',
        'Esta aplicación necesita acceso a tu ubicación para mostrar centros turísticos cercanos y crear rutas personalizadas.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Configuración', 
            onPress: () => {
              // Abrir configuración de la app
              Linking.openSettings();
            }
          }
        ]
      );
      return false;
    }

    // Solicitar permisos de fondo (opcional)
    try {
      let { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      console.log('📍 Estado de permisos de fondo:', backgroundStatus);
      
      if (backgroundStatus !== 'granted') {
        console.log('📍 Permisos de fondo no concedidos (esto es normal)');
      }
    } catch (backgroundError) {
      console.log('📍 Error solicitando permisos de fondo:', backgroundError);
      // No es crítico si fallan los permisos de fondo
    }

    console.log('📍 Permisos concedidos exitosamente');
    return true;
    
  } catch (error) {
    console.error('📍 Error solicitando permisos:', error);
    Alert.alert(
      'Error de Permisos',
      'Ocurrió un error al solicitar permisos de ubicación. Por favor, verifica que los servicios de ubicación estén habilitados.',
      [{ text: 'OK' }]
    );
    return false;
  }
};

/**
 * Función robusta para obtener la ubicación actual
 * @param {Object} options - Opciones para obtener la ubicación
 * @returns {Promise<Object|null>} Objeto con latitud, longitud y precisión o null si falla
 */
export const getCurrentLocation = async (options = {}) => {
  try {
    console.log('📍 Iniciando obtención de ubicación...');
    
    // Verificar permisos primero
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.log('📍 No se tienen permisos, abortando...');
      return null;
    }

    // Configuración por defecto
    const defaultOptions = {
      accuracy: Location.Accuracy.Balanced,
      timeout: 15000,
      maximumAge: 30000,
    };

    const finalOptions = { ...defaultOptions, ...options };
    console.log('📍 Opciones de ubicación:', finalOptions);

    // Intentar obtener ubicación con diferentes niveles de precisión
    let location = null;
    let lastError = null;

    // Intentar con alta precisión primero
    try {
      location = await Location.getCurrentPositionAsync({
        ...finalOptions,
        accuracy: Location.Accuracy.High,
        timeout: 10000,
      });
      console.log('📍 Ubicación obtenida con alta precisión:', location.coords);
    } catch (highAccuracyError) {
      console.log('📍 Error con alta precisión, intentando con precisión balanceada...');
      lastError = highAccuracyError;
      
      try {
        location = await Location.getCurrentPositionAsync({
          ...finalOptions,
          accuracy: Location.Accuracy.Balanced,
          timeout: 15000,
        });
        console.log('📍 Ubicación obtenida con precisión balanceada:', location.coords);
      } catch (balancedError) {
        console.log('📍 Error con precisión balanceada, intentando con baja precisión...');
        lastError = balancedError;
        
        try {
          location = await Location.getCurrentPositionAsync({
            ...finalOptions,
            accuracy: Location.Accuracy.Low,
            timeout: 20000,
          });
          console.log('📍 Ubicación obtenida con baja precisión:', location.coords);
        } catch (lowAccuracyError) {
          console.log('📍 Error con baja precisión, intentando con precisión más baja...');
          lastError = lowAccuracyError;
          
          // Último intento con la precisión más baja
          location = await Location.getCurrentPositionAsync({
            ...finalOptions,
            accuracy: Location.Accuracy.Lowest,
            timeout: 30000,
          });
          console.log('📍 Ubicación obtenida con precisión más baja:', location.coords);
        }
      }
    }

    if (!location) {
      throw lastError || new Error('No se pudo obtener ubicación con ninguna configuración');
    }

    const result = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      altitude: location.coords.altitude,
      heading: location.coords.heading,
      speed: location.coords.speed,
      timestamp: location.timestamp,
    };

    console.log('📍 Ubicación final obtenida:', result);
    return result;
    
  } catch (error) {
    console.error('📍 Error obteniendo ubicación:', error);
    
    let errorMessage = 'No se pudo obtener tu ubicación';
    let errorTitle = 'Error de Ubicación';
    
    if (error.code === 'E_LOCATION_SERVICES_DISABLED') {
      errorMessage = 'Los servicios de ubicación están deshabilitados en tu dispositivo. Por favor, actívalos en la configuración.';
      errorTitle = 'GPS Desactivado';
    } else if (error.code === 'E_LOCATION_TIMEOUT') {
      errorMessage = 'Tiempo de espera agotado al obtener ubicación. Intenta nuevamente en un lugar con mejor señal.';
      errorTitle = 'Tiempo Agotado';
    } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
      errorMessage = 'Ubicación no disponible en este momento. Verifica tu conexión a internet y que el GPS esté activado.';
      errorTitle = 'Ubicación No Disponible';
    } else if (error.message === 'No se pudo obtener ubicación con ninguna configuración') {
      errorMessage = 'No se pudo obtener tu ubicación. Verifica que los servicios de ubicación estén habilitados y que tengas una buena señal.';
      errorTitle = 'Error de Ubicación';
    }
    
    Alert.alert(errorTitle, errorMessage, [
      { text: 'OK' },
      { 
        text: 'Configuración', 
        onPress: () => {
          Linking.openSettings();
        }
      }
    ]);
    
    return null;
  }
};

/**
 * Función con timeout para obtener ubicación
 * @param {number} timeoutMs - Tiempo límite en milisegundos
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object|null>} Ubicación o null si falla
 */
export const getCurrentLocationWithTimeout = async (timeoutMs = 10000, options = {}) => {
  try {
    const locationPromise = getCurrentLocation(options);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    );
    
    const location = await Promise.race([locationPromise, timeoutPromise]);
    return location;
    
  } catch (error) {
    if (error.message === 'Timeout') {
      Alert.alert(
        'Tiempo Agotado', 
        'No se pudo obtener la ubicación a tiempo. Intenta nuevamente.',
        [{ text: 'OK' }]
      );
    } else {
      console.error('📍 Error en getCurrentLocationWithTimeout:', error);
    }
    return null;
  }
};

/**
 * Verificar si la ubicación está disponible
 * @returns {Promise<boolean>} true si está disponible
 */
export const isLocationAvailable = async () => {
  try {
    const isEnabled = await Location.hasServicesEnabledAsync();
    const { status } = await Location.getForegroundPermissionsAsync();
    return isEnabled && status === 'granted';
  } catch (error) {
    console.error('📍 Error verificando disponibilidad de ubicación:', error);
    return false;
  }
};





