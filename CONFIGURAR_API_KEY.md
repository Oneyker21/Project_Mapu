# 🔑 Configuración de Google Maps API Key

## 📋 Pasos para Configurar la API Key

### 1. **Obtener API Key de Google Cloud Console**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita estas APIs:
   - **Google Directions API** (para rutas)
   - **Maps JavaScript API** (para mapas)
   - **Geocoding API** (para direcciones)
4. Ve a "Credenciales" → "Crear credenciales" → "Clave de API"
5. Copia tu API key

### 2. **Configurar la API Key en tu proyecto**

**Opción A: Usando variables de entorno (Recomendado)**

1. Crea un archivo `.env` en la raíz del proyecto:
```bash
# Google Maps API Configuration
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

2. Agrega `.env` a tu `.gitignore` para no subirlo al repositorio

**Opción B: Configuración directa (Solo para desarrollo)**

1. Abre `src/config/googleMaps.js`
2. Reemplaza `'TU_GOOGLE_MAPS_API_KEY_AQUI'` con tu API Key real:
```javascript
API_KEY: 'TU_API_KEY_REAL_AQUI', // ← Tu API Key aquí
```

### 3. **Verificar que funciona**

1. Ejecuta la app: `expo start`
2. Ve a "Crear Ruta"
3. Selecciona un punto de inicio y centros
4. Presiona "Iniciar Ruta"
5. Deberías ver una ruta real siguiendo las carreteras

### 4. **Configurar Restricciones de Seguridad**

1. En Google Cloud Console, ve a "Credenciales"
2. Haz clic en tu API Key
3. En "Restricciones de aplicación":
   - **Restricciones de API**: Selecciona solo las APIs que necesitas
   - **Restricciones de aplicación**: Selecciona "Aplicaciones Android/iOS"

## 🔧 Configuraciones Disponibles

### **Modos de Transporte:**
- `driving` - En coche (por defecto)
- `walking` - Caminando
- `bicycling` - En bicicleta
- `transit` - Transporte público

### **Idiomas Soportados:**
- `es` - Español (por defecto)
- `en` - Inglés
- etc.

### **Regiones:**
- `ni` - Nicaragua (por defecto)
- `gt` - Guatemala
- `cr` - Costa Rica
- etc.

## 🚨 Solución de Problemas

### **Error: "API key not valid"**
- Verifica que la API Key esté correcta
- Asegúrate de que las APIs estén habilitadas
- Verifica las restricciones de la API Key

### **Error: "This API project is not authorized"**
- Habilita las APIs necesarias en tu proyecto
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
- **$200 USD de crédito gratuito** por mes
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

