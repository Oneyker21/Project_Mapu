import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const requestPermission = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar si ya tenemos permisos
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      if (existingStatus === 'granted') {
        setPermissionStatus('granted');
        setIsInitialized(true);
        return true;
      }

      // Solicitar permisos
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      
      if (status !== 'granted') {
        setError('Permisos de ubicación denegados');
        Alert.alert(
          'Permisos de Ubicación',
          'Esta aplicación necesita acceso a tu ubicación para funcionar correctamente. Por favor, habilita los permisos de ubicación en la configuración de tu dispositivo.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Configuración', onPress: () => Location.enableNetworkProviderAsync() }
          ]
        );
        setIsInitialized(true);
        return false;
      }
      
      setIsInitialized(true);
      return true;
    } catch (err) {
      console.error('Error solicitando permisos:', err);
      setError('Error al solicitar permisos de ubicación');
      setIsInitialized(true);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async (options = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Verificar permisos primero
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        return null;
      }

      // Configuración por defecto más conservadora
      const defaultOptions = {
        accuracy: Location.Accuracy.Balanced, // Cambiar de High a Balanced para mayor compatibilidad
        timeout: 15000, // 15 segundos de timeout
        maximumAge: 10000, // Usar ubicación de hasta 10 segundos de antigüedad
        ...options
      };

      console.log('📍 Solicitando ubicación con opciones:', defaultOptions);
      
      const locationResult = await Location.getCurrentPositionAsync(defaultOptions);
      
      const locationData = {
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
        accuracy: locationResult.coords.accuracy,
        timestamp: locationResult.timestamp
      };

      console.log('📍 Ubicación obtenida:', locationData);
      setLocation(locationData);
      return locationData;

    } catch (err) {
      console.error('Error obteniendo ubicación:', err);
      
      let errorMessage = 'No se pudo obtener tu ubicación';
      
      if (err.code === 'E_LOCATION_SERVICES_DISABLED') {
        errorMessage = 'Los servicios de ubicación están deshabilitados';
      } else if (err.code === 'E_LOCATION_TIMEOUT') {
        errorMessage = 'Tiempo de espera agotado al obtener ubicación';
      } else if (err.code === 'E_LOCATION_UNAVAILABLE') {
        errorMessage = 'Ubicación no disponible';
      }
      
      setError(errorMessage);
      
      // No mostrar alerta automáticamente, dejar que el componente decida
      return null;
    } finally {
      setLoading(false);
    }
  };

  const watchLocation = async (callback, options = {}) => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        return null;
      }

      const defaultOptions = {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 1000,
        distanceInterval: 10,
        ...options
      };

      const watchId = await Location.watchPositionAsync(defaultOptions, callback);
      return watchId;
    } catch (err) {
      console.error('Error iniciando seguimiento de ubicación:', err);
      setError('Error al iniciar seguimiento de ubicación');
      return null;
    }
  };

  return {
    location,
    loading,
    error,
    permissionStatus,
    isInitialized,
    getCurrentLocation,
    requestPermission,
    watchLocation
  };
};






