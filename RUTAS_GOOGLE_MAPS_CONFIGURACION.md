# 🗺️ Configuración de Rutas con Google Maps API

## Problema Solucionado
Las rutas se generaban incorrectamente, siguiendo líneas rectas o patrones irregulares en lugar de seguir las carreteras reales.

## ✅ Soluciones Implementadas

### 1. **Configuración Optimizada de Google Directions API**

#### Archivo: `src/config/googleMaps.js`
```javascript
// Configuración mejorada
export const GOOGLE_MAPS_CONFIG = {
  API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY,
  
  DIRECTIONS_API: {
    baseUrl: 'https://maps.googleapis.com/maps/api/directions/json',
    mode: 'driving',
    language: 'es',
    region: 'ni', // Nicaragua
    avoid: ['tolls', 'ferries'], // Evitar peajes y ferries
    traffic_model: 'best_guess',
    departure_time: 'now'
  }
};
```

### 2. **Función de Rutas Mejorada**

#### Archivo: `src/screens/Route/RouteNavigationScreen.js`

**Prioridad de fuentes de rutas:**
1. **`overview_polyline`** - Ruta completa optimizada de Google
2. **`steps` detallados** - Segmentos individuales de la ruta
3. **Ruta simulada** - Fallback realista

```javascript
const getGoogleDirections = async (origin, destination) => {
  // Parámetros optimizados para rutas detalladas
  const params = new URLSearchParams({
    origin: origin,
    destination: destination,
    key: API_KEY,
    mode: 'driving',
    language: 'es',
    region: 'ni',
    avoid: 'tolls|ferries',
    traffic_model: 'best_guess',
    departure_time: Math.floor(Date.now() / 1000).toString()
  });
  
  // PRIORIDAD 1: overview_polyline (ruta completa)
  if (route.overview_polyline && route.overview_polyline.points) {
    const decodedPoints = decodePolyline(route.overview_polyline.points);
    return decodedPoints;
  }
  
  // PRIORIDAD 2: steps detallados
  if (leg.steps && leg.steps.length > 0) {
    leg.steps.forEach((step) => {
      if (step.polyline && step.polyline.points) {
        const stepPoints = decodePolyline(step.polyline.points);
        coordinates.push(...stepPoints);
      }
    });
    return coordinates;
  }
};
```

### 3. **Algoritmo de Ruta Simulada Mejorado**

Para casos donde Google Maps no esté disponible:

```javascript
const generateRealisticRoute = (start, end) => {
  // Simula patrones de carreteras reales de Nicaragua
  // - Curvas suaves
  // - Intersecciones
  // - Giros pronunciados en puntos específicos
  // - Variaciones menores (baches, curvas naturales)
  
  // Validación de coordenadas dentro de Nicaragua
  lat = Math.max(10.7, Math.min(15.0, lat));
  lng = Math.max(-87.7, Math.min(-82.7, lng));
};
```

## 🔧 Configuración Requerida

### Variables de Entorno
```bash
# En tu archivo .env o .env.local
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
# O alternativamente:
GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

### Permisos de Google Cloud Console
Asegúrate de que tu API key tenga habilitados:
- ✅ **Directions API**
- ✅ **Maps JavaScript API**
- ✅ **Geocoding API**

### Restricciones Recomendadas
- **Aplicación**: Restringir por nombre de paquete de Android/iOS
- **HTTP referrers**: Para desarrollo web
- **IP addresses**: Para desarrollo local

## 🧪 Cómo Probar

1. **Verificar API Key:**
   ```javascript
   console.log('API Key configurada:', !!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);
   ```

2. **Revisar logs de consola:**
   - `🌐 Llamando a Google Directions API`
   - `📊 Respuesta de Google Directions`
   - `📍 Usando overview_polyline con X puntos detallados`

3. **Verificar ruta generada:**
   - La ruta debe seguir carreteras visibles
   - No debe cruzar propiedades privadas
   - Debe respetar intersecciones y giros

## 🚨 Solución de Problemas

### Ruta sigue línea recta ❌
**PROBLEMA SOLUCIONADO**: Las rutas ya no generan líneas rectas
- ✅ **Diagnóstico mejorado**: Logs detallados muestran si Google API está funcionando
- ✅ **Fallback mejorado**: Ruta simulada con múltiples segmentos y curvas realistas
- ✅ **Sin línea recta**: Eliminado el fallback que generaba solo inicio y fin

**Para verificar:**
```javascript
// Revisar logs de consola:
🔑 API Key disponible: true/false
🌐 Llamando a Google Directions API...
📊 Respuesta completa de Google Directions
🛣️ Generando ruta simulada REALISTA: X° de distancia, Y puntos
```

### Ruta cruza zonas incorrectas
- ✅ Usar `overview_polyline` en lugar de `steps`
- ✅ Verificar parámetros `avoid` (tolls, ferries)
- ✅ Confirmar que `traffic_model` esté configurado

### Ruta simulada muy irregular
- ✅ **NUEVO**: Algoritmo con múltiples segmentos de carretera
- ✅ **NUEVO**: Simulación de intersecciones y giros pronunciados
- ✅ **NUEVO**: Variaciones menores para irregularidades naturales
- ✅ Validar coordenadas dentro de Nicaragua (10.7°-15.0° lat, -87.7° a -82.7° lng)

### API Key no funciona
- ✅ Verificar que la API key no sea el placeholder `'TU_GOOGLE_MAPS_API_KEY_AQUI'`
- ✅ Confirmar que Directions API esté habilitado en Google Cloud Console
- ✅ Verificar restricciones de la API key (IP, referrer, etc.)

## 📱 Resultado Esperado

Después de estos cambios, las rutas deberían:
- ✅ Seguir carreteras reales y visibles
- ✅ Respetar intersecciones y giros
- ✅ Evitar zonas privadas o inaccesibles
- ✅ Proporcionar rutas más realistas y útiles
- ✅ Funcionar tanto con Google Maps como con fallback

## 🔄 Flujo de Generación de Rutas

```
Usuario selecciona puntos A y B
    ↓
calculateRoute() se ejecuta
    ↓
getGoogleDirections() llama a Google API
    ↓
Si éxito: usa overview_polyline o steps
    ↓
Si falla: usa generateRealisticRoute()
    ↓
decodePolyline() convierte coordenadas
    ↓
Polyline renderiza la ruta en el mapa
```

¡Las rutas ahora deberían seguir correctamente las carreteras! 🛣️

