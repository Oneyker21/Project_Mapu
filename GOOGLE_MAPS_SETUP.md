# 🗺️ Configuración de Google Maps API

## 📋 Pasos para Configurar Google Directions API

### 1. **Obtener API Key de Google Cloud Console**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Google Directions API**
4. Ve a "Credenciales" → "Crear credenciales" → "Clave de API"
5. Copia tu API Key

### 2. **Configurar la API Key en la App**

1. Abre el archivo `src/config/googleMaps.js`
2. Reemplaza `TU_GOOGLE_MAPS_API_KEY_AQUI` con tu API Key real:

```javascript
export const GOOGLE_MAPS_CONFIG = {
  API_KEY: 'TU_API_KEY_REAL_AQUI', // ← Reemplaza aquí
  // ... resto de la configuración
};
```

### 3. **Configurar Restricciones de API Key (Recomendado)**

1. En Google Cloud Console, ve a "Credenciales"
2. Haz clic en tu API Key
3. En "Restricciones de aplicación":
   - **Restricciones de API**: Selecciona "Google Directions API"
   - **Restricciones de aplicación**: Selecciona "Aplicaciones Android/iOS" según corresponda

### 4. **Verificar que Funciona**

1. Ejecuta la app
2. Ve a "Crear Ruta"
3. Selecciona un punto de inicio y centros
4. Presiona "Iniciar Ruta"
5. Deberías ver una ruta real siguiendo las carreteras

## 🔧 Configuraciones Disponibles

### **Modos de Transporte:**
- `driving` - En coche (por defecto)
- `walking` - Caminando
- `bicycling` - En bicicleta
- `transit` - Transporte público

### **Idiomas Soportados:**
- `es` - Español (por defecto)
- `en` - Inglés
- `fr` - Francés
- etc.

### **Regiones:**
- `ni` - Nicaragua (por defecto)
- `gt` - Guatemala
- `cr` - Costa Rica
- etc.

## 🚨 Solución de Problemas

### **Error: "API key not valid"**
- Verifica que la API Key esté correcta
- Asegúrate de que la Google Directions API esté habilitada
- Verifica las restricciones de la API Key

### **Error: "This API project is not authorized"**
- Habilita la Google Directions API en tu proyecto
- Espera unos minutos para que se propague

### **Error: "REQUEST_DENIED"**
- Verifica las restricciones de la API Key
- Asegúrate de que tu app esté autorizada

### **Ruta no aparece**
- Verifica la consola para errores
- La app usará ruta simulada como fallback

## 💰 Costos

- **Google Directions API**: $5 USD por 1000 requests
- **Primeros 1000 requests**: Gratis cada mes
- **Monitoreo**: Usa Google Cloud Console para ver el uso

## 🔒 Seguridad

- **Nunca** subas tu API Key a repositorios públicos
- Usa variables de entorno en producción
- Configura restricciones de API Key
- Monitorea el uso regularmente

## 📱 Funcionalidades Implementadas

✅ **Rutas Reales** - Sigue carreteras y calles
✅ **Múltiples Modos** - Coche, caminando, bicicleta
✅ **Instrucciones** - Paso a paso de la ruta
✅ **Tiempo Estimado** - Duración real del viaje
✅ **Fallback** - Ruta simulada si falla la API
✅ **Configuración Flexible** - Fácil de personalizar
