# 🗺️ Configuración Detallada de Google Maps API

## 📋 **¿Qué es Google Directions API?**

Google Directions API es un servicio que permite obtener **rutas reales** entre dos puntos, siguiendo las carreteras establecidas por Google Maps. Esto significa que:

- ✅ **Rutas reales** - Sigue las carreteras, no líneas rectas
- ✅ **Tiempo estimado** - Duración real del viaje
- ✅ **Distancia real** - Kilómetros reales por carretera
- ✅ **Instrucciones** - Paso a paso de la ruta
- ✅ **Múltiples opciones** - Coche, caminando, bicicleta

## 🚀 **Paso 1: Obtener API Key de Google**

### **1.1 Ir a Google Cloud Console**
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Inicia sesión con tu cuenta de Google
3. Crea un nuevo proyecto o selecciona uno existente

### **1.2 Habilitar APIs necesarias**
1. Ve a **"APIs y servicios"** > **"Biblioteca"**
2. Busca y habilita estas APIs:
   - **Directions API** (para rutas)
   - **Maps JavaScript API** (para mapas)
   - **Geocoding API** (para direcciones)

### **1.3 Crear credenciales**
1. Ve a **"APIs y servicios"** > **"Credenciales"**
2. Haz clic en **"Crear credenciales"** > **"Clave de API"**
3. Copia la API Key generada

## 🔧 **Paso 2: Configurar en tu App**

### **2.1 Actualizar archivo de configuración**
Edita el archivo `src/config/googleMaps.js`:

```javascript
export const GOOGLE_MAPS_CONFIG = {
  // Reemplaza con tu API Key real
  API_KEY: 'TU_API_KEY_AQUI', // ← Pega tu API Key aquí
  
  DIRECTIONS_API: {
    baseUrl: 'https://maps.googleapis.com/maps/api/directions/json',
    mode: 'driving', // driving, walking, bicycling, transit
    language: 'es', // español
    region: 'ni', // Nicaragua
    alternatives: false, // solo una ruta
    avoid: [], // evitar: tolls, highways, ferries, indoor
    units: 'metric' // metric o imperial
  }
};
```

### **2.2 Restricciones de seguridad (Recomendado)**
1. En Google Cloud Console, ve a **"Credenciales"**
2. Haz clic en tu API Key
3. En **"Restricciones de aplicación"**, selecciona **"Aplicaciones Android"** o **"Aplicaciones iOS"**
4. Agrega el nombre de tu paquete de la app

## 🧪 **Paso 3: Probar la configuración**

### **3.1 Verificar en consola**
Cuando uses la app, deberías ver estos logs:

```
🗺️ === CALCULANDO RUTA CON GOOGLE DIRECTIONS API ===
📍 Origen: 12.123456, -85.123456
🎯 Destino: 12.234567, -85.234567
✅ Ruta real de Google calculada exitosamente con 150 puntos
🛣️ La ruta sigue las carreteras reales de Google Maps
```

### **3.2 Si no funciona**
Si ves este mensaje:
```
⚠️ Google Directions API no disponible, usando ruta simulada
```

**Posibles causas:**
- ❌ API Key no configurada
- ❌ Directions API no habilitada
- ❌ Límites de cuota excedidos
- ❌ Restricciones de API Key

## 💰 **Paso 4: Costos y límites**

### **4.1 Precios (Aproximados)**
- **Directions API**: $5.00 por 1000 requests
- **Maps JavaScript API**: $2.00 por 1000 cargas
- **Geocoding API**: $5.00 por 1000 requests

### **4.2 Límites gratuitos**
- **$200 USD** de crédito gratuito por mes
- **28,000 requests** de Directions API por mes
- **28,000 cargas** de Maps por mes

### **4.3 Monitoreo de uso**
1. Ve a **"APIs y servicios"** > **"Cuotas"**
2. Revisa el uso de cada API
3. Configura alertas de límites

## 🔒 **Paso 5: Seguridad**

### **5.1 Restricciones de API Key**
- **Restricciones de aplicación**: Solo tu app
- **Restricciones de API**: Solo APIs necesarias
- **Restricciones de IP**: Solo IPs específicas (opcional)

### **5.2 Rotación de claves**
- Cambia tu API Key regularmente
- Usa diferentes claves para desarrollo y producción
- Monitorea el uso anómalo

## 🚨 **Solución de problemas**

### **Error: "API key not valid"**
- Verifica que la API Key esté correcta
- Asegúrate de que las APIs estén habilitadas
- Revisa las restricciones de la API Key

### **Error: "Quota exceeded"**
- Has excedido el límite de requests
- Espera hasta el próximo mes o actualiza tu plan
- Revisa si hay requests innecesarios

### **Error: "Request denied"**
- La API Key tiene restricciones muy estrictas
- Revisa las restricciones de aplicación
- Asegúrate de que tu app esté autorizada

## 📱 **Resultado final**

Con la configuración correcta, tu app mostrará:

1. **Rutas reales** que siguen las carreteras
2. **Tiempo estimado** de viaje
3. **Distancia real** por carretera
4. **Instrucciones paso a paso**
5. **Múltiples opciones** de transporte

¡Tu app tendrá la misma funcionalidad de navegación que Google Maps! 🎉
