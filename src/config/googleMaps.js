// Configuración de Google Maps API
export const GOOGLE_MAPS_CONFIG = {
  // Usar API key desde variables de entorno (más seguro)
  API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || 'TU_GOOGLE_MAPS_API_KEY_AQUI',
  
  // Configuraciones de la API
  DIRECTIONS_API: {
    baseUrl: 'https://maps.googleapis.com/maps/api/directions/json',
    mode: 'driving', // driving, walking, bicycling, transit
    language: 'es', // español
    region: 'ni', // Nicaragua
    alternatives: false, // solo una ruta
    avoid: ['tolls', 'ferries'], // evitar peajes y ferries para rutas más directas
    units: 'metric', // metric o imperial
    traffic_model: 'best_guess', // modelo de tráfico
    departure_time: 'now' // tiempo de salida
  },
  
  // Configuraciones del mapa
  MAP_CONFIG: {
    defaultZoom: 15,
    minZoom: 10,
    maxZoom: 20,
    mapType: 'roadmap' // roadmap, satellite, hybrid, terrain
  }
};

// Función para construir URL de Directions API optimizada
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
    units: config.units,
    traffic_model: config.traffic_model,
    departure_time: config.departure_time === 'now' ? Math.floor(Date.now() / 1000).toString() : config.departure_time
  });
  
  // Manejar avoid como array o string
  if (config.avoid && config.avoid.length > 0) {
    const avoidStr = Array.isArray(config.avoid) ? config.avoid.join('|') : config.avoid;
    params.append('avoid', avoidStr);
  }
  
  // Agregar parámetros opcionales para ruta más precisa
  if (config.include_geometry) {
    params.append('include_geometry', config.include_geometry);
  }
  
  if (config.waypoints) {
    params.append('waypoints', config.waypoints);
  }
  
  if (config.optimize !== undefined) {
    params.append('optimize', config.optimize.toString());
  }
  
  return `${config.baseUrl}?${params.toString()}`;
};

// Función para validar API Key
export const validateApiKey = () => {
  return GOOGLE_MAPS_CONFIG.API_KEY !== 'TU_GOOGLE_MAPS_API_KEY_AQUI' && 
         GOOGLE_MAPS_CONFIG.API_KEY.length > 0;
};
