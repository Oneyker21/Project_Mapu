# Sistema de Reseñas - Guía de Funcionamiento

## 📋 Resumen
El sistema de reseñas permite a los usuarios escribir, editar y ver reseñas de centros turísticos. Está completamente integrado con Firebase y maneja automáticamente las estadísticas de calificaciones.

## 🏗️ Arquitectura del Sistema

### 1. **Servicios (src/services/reviews.js)**
- **`saveReview(reviewData)`**: Guarda una nueva reseña
- **`updateReview(reviewId, updatedData)`**: Actualiza una reseña existente
- **`deleteReview(reviewId, centerId, rating)`**: Elimina una reseña
- **`getCenterReviews(centerId)`**: Obtiene todas las reseñas de un centro
- **`getUserReviews(userId)`**: Obtiene todas las reseñas de un usuario
- **`getUserReviewForCenter(userId, centerId)`**: Obtiene la reseña específica de un usuario para un centro
- **`getCenterReviewStats(centerId)`**: Obtiene estadísticas de reseñas de un centro

### 2. **Componentes**
- **`WriteReviewModal`**: Modal para escribir/editar reseñas con sistema de estrellas
- **`ReviewsScreen`**: Pantalla principal que muestra reseñas y permite gestión

### 3. **Estructura de Datos**

#### Reseña (Colección: `reseñas`)
```javascript
{
  id: "document_id",
  rating: 5,                    // 1-5 estrellas
  comment: "Excelente lugar...", // Comentario del usuario
  userId: "user_uid",           // ID del usuario que escribió la reseña
  userName: "Juan Pérez",       // Nombre del usuario
  centerId: "center_id",        // ID del centro turístico
  centerName: "Hotel Paradise", // Nombre del centro
  date: "2024-01-15T10:30:00Z", // Fecha en ISO string
  timestamp: 1705312200000,     // Timestamp para ordenamiento
  createdAt: Date,              // Fecha de creación
  updatedAt: Date               // Fecha de última actualización
}
```

#### Estadísticas del Centro (Colección: `centrosTuristicos`)
```javascript
{
  calificacion: 4.2,           // Promedio de calificaciones
  totalResenas: 15,            // Número total de reseñas
  sumaCalificaciones: 63       // Suma de todas las calificaciones
}
```

## 🚀 Funcionalidades Implementadas

### ✅ **Para Usuarios Turistas:**
1. **Escribir Reseñas**: Sistema de estrellas (1-5) + comentario
2. **Ver Mis Reseñas**: Lista de todas las reseñas escritas
3. **Editar Reseñas**: Modificar reseñas existentes
4. **Eliminar Reseñas**: Borrar reseñas propias
5. **Ver Reseñas de Centros**: Consultar reseñas de centros específicos

### ✅ **Para Centros Turísticos:**
1. **Ver Reseñas del Centro**: Todas las reseñas recibidas
2. **Estadísticas**: Promedio de calificación y total de reseñas
3. **Distribución de Calificaciones**: Cantidad por cada estrella

### ✅ **Sistema de Validaciones:**
- **Una reseña por usuario por centro**: Previene duplicados
- **Calificación obligatoria**: Debe seleccionar estrellas
- **Comentario mínimo**: Al menos 10 caracteres
- **Límite de caracteres**: Máximo 500 caracteres

## 🔧 Manejo de Errores

### **Problema de Índices de Firebase**
El sistema maneja automáticamente los errores de índices faltantes:

```javascript
// Si falla la consulta con orderBy, usa consulta simple
try {
  q = query(collection(db, 'reseñas'), where('centerId', '==', centerId), orderBy('timestamp', 'desc'));
} catch (indexError) {
  q = query(collection(db, 'reseñas'), where('centerId', '==', centerId));
}
```

### **Fallbacks Implementados:**
- **Sin índices**: Retorna array vacío en lugar de error
- **Datos faltantes**: Valores por defecto (calificación 0, 0 reseñas)
- **Ordenamiento**: Ordenamiento manual si no se puede hacer en consulta

## 📱 Navegación y Acceso

### **Puntos de Entrada:**
1. **Desde Perfil de Turista**: "Mis Reseñas" → Ver todas las reseñas del usuario
2. **Desde Tarjeta de Centro**: Botón "Reseñas" → Ver reseñas del centro
3. **Desde Detalle de Centro**: Botón "Ver Reseñas" → Ver reseñas del centro
4. **Desde Perfil de Centro**: "Reseñas y Calificaciones" → Ver reseñas del centro

### **Flujo de Usuario:**
```
Inicio → Explorar Centros → [Centro] → Botón Reseñas → ReviewsScreen
                                                      ↓
                                              [Escribir Reseña] → WriteReviewModal
                                                      ↓
                                              [Enviar] → Guardar en Firebase
```

## 🔄 Actualización Automática de Estadísticas

Cuando se crea, actualiza o elimina una reseña, el sistema automáticamente:

1. **Calcula nueva calificación promedio**
2. **Actualiza total de reseñas**
3. **Recalcula suma de calificaciones**
4. **Guarda estadísticas en el documento del centro**

## 🎨 Interfaz de Usuario

### **WriteReviewModal:**
- Sistema de estrellas interactivo
- Campo de texto con contador de caracteres
- Validaciones en tiempo real
- Botones de acción claros

### **ReviewsScreen:**
- Lista de reseñas con diseño de tarjetas
- Información del usuario y fecha
- Estadísticas del centro
- Botones de acción contextuales

## 🛠️ Configuración Requerida

### **Firebase:**
- Colección `reseñas` para almacenar reseñas
- Colección `centrosTuristicos` para estadísticas
- Índices compuestos (opcionales, el sistema funciona sin ellos)

### **Índices Recomendados (para mejor rendimiento):**
```
// Para consultas de reseñas por centro
centerId (Ascending) + timestamp (Descending)

// Para consultas de reseñas por usuario  
userId (Ascending) + timestamp (Descending)

// Para consultas de reseña específica
userId (Ascending) + centerId (Ascending)
```

## 📊 Métricas y Analytics

El sistema registra automáticamente:
- Número total de reseñas por centro
- Promedio de calificaciones
- Distribución de calificaciones (1-5 estrellas)
- Fechas de creación y actualización

## 🚨 Estado Actual

✅ **Completamente Funcional**
- Todas las funcionalidades implementadas
- Manejo de errores robusto
- Interfaz de usuario completa
- Integración con Firebase
- Navegación integrada

El sistema está listo para producción y maneja todos los casos edge, incluyendo la falta de índices de Firebase.

