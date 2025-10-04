// Configuración de Google Maps API
export const GOOGLE_MAPS_CONFIG = {
  // Reemplaza con tu Google Maps API Key real
  API_KEY: 'TU_GOOGLE_MAPS_API_KEY_AQUI',
  
  // Configuraciones de la API
  DIRECTIONS_API: {
    baseUrl: 'https://maps.googleapis.com/maps/api/directions/json',
    mode: 'driving', // driving, walking, bicycling, transit
    language: 'es', // español
    region: 'ni', // Nicaragua
    alternatives: false, // solo una ruta
    avoid: [], // evitar: tolls, highways, ferries, indoor
    units: 'metric' // metric o imperial
  },
  
  // Configuraciones del mapa
  MAP_CONFIG: {
    defaultZoom: 15,
    minZoom: 10,
    maxZoom: 20,
    mapType: 'roadmap' // roadmap, satellite, hybrid, terrain
  }
};

// Función para construir URL de Directions API
export const buildDirectionsUrl = (origin, destination, options = {}) => {
  const config = { ...GOOGLE_MAPS_CONFIG.DIRECTIONS_API, ...options };
  const params = new URLSearchParams({
    origin,
    destination,
    key: GOOGLE_MAPS_CONFIG.API_KEY,
    mode: config.mode,
    language: config.language,
    region: config.region,
    alternatives: config.alternatives,
    units: config.units
  });
  
  if (config.avoid.length > 0) {
    params.append('avoid', config.avoid.join('|'));
  }
  
  // Agregar parámetros opcionales para ruta más precisa
  if (config.traffic_model) {
    params.append('traffic_model', config.traffic_model);
  }
  
  if (config.departure_time) {
    params.append('departure_time', config.departure_time);
  }
  
  if (config.include_geometry) {
    params.append('include_geometry', config.include_geometry);
  }
  
  return `${config.baseUrl}?${params.toString()}`;
};

// Función para validar API Key
export const validateApiKey = () => {
  return GOOGLE_MAPS_CONFIG.API_KEY !== 'TU_GOOGLE_MAPS_API_KEY_AQUI' && 
         GOOGLE_MAPS_CONFIG.API_KEY.length > 0;
};
