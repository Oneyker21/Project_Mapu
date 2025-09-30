# Estructura de Base de Datos Firebase - Mapu

## 📊 **Colecciones Principales**

### 1. **Colección `roles`**
Contiene los tipos de usuario disponibles en el sistema.

```javascript
// Documento: turista
{
  id: "turista",
  nombre: "Turista",
  descripcion: "Usuario que busca lugares turísticos y experiencias",
  activo: true,
  fechaCreacion: "2024-01-01T00:00:00.000Z"
}

// Documento: centro_turistico
{
  id: "centro_turistico",
  nombre: "Centro Turístico", 
  descripcion: "Negocio o lugar que ofrece servicios turísticos",
  activo: true,
  fechaCreacion: "2024-01-01T00:00:00.000Z"
}
```

### 2. **Colección `turistas`**
Almacena información de usuarios turistas.

```javascript
// Documento: {user_uid}
{
  uid: "user_uid",
  email: "turista@email.com",
  roleId: "turista", // Referencia a roles/turista
  nombres: "Juan",
  apellidos: "Pérez",
  telefono: "8888-8888",
  tipoDocumento: "cedula",
  numeroDocumento: "001-080800-0000A",
  ciudad: "Managua",
  pais: "Nicaragua",
  residencia: "Managua, Nicaragua",
  imagenPerfil: "https://firebasestorage.googleapis.com/.../profile/user123_1234567890.jpg",
  portada: "https://firebasestorage.googleapis.com/.../cover/user123_1234567891.jpg",
  fechaCreacion: "2024-01-01T00:00:00.000Z",
  activo: true,
  tipoUsuario: "Turista"
}
```

### 3. **Colección `centrosTuristicos`**
Almacena información de centros turísticos.

```javascript
// Documento: {user_uid}
{
  uid: "user_uid",
  email: "centro@email.com",
  roleId: "centro_turistico", // Referencia a roles/centro_turistico
  nombrePropietario: "María García",
  emailPropietario: "centro@email.com",
  nombreNegocio: "Hotel Paradise",
  categoriaNegocio: "Hoteles",
  emailNegocio: "reservas@hotelparadise.com",
  telefonoNegocio: "2222-2222",
  direccion: "Calle Principal, Granada",
  latitud: "11.9344",
  longitud: "-85.9560",
  horario: "Lunes - Viernes: 9:00 AM - 6:00 PM\nSábado: 9:00 AM - 4:00 PM",
  horarioDetallado: {
    lunes: { open: "09:00", close: "18:00", enabled: true },
    martes: { open: "09:00", close: "18:00", enabled: true },
    miercoles: { open: "09:00", close: "18:00", enabled: true },
    jueves: { open: "09:00", close: "18:00", enabled: true },
    viernes: { open: "09:00", close: "18:00", enabled: true },
    sabado: { open: "09:00", close: "16:00", enabled: true },
    domingo: { open: "09:00", close: "18:00", enabled: false }
  },
  costo: "Desde $50/noche",
  logotipo: "https://firebasestorage.googleapis.com/.../logo/user456_1234567892.jpg",
  portada: "https://firebasestorage.googleapis.com/.../business_cover/user456_1234567893.jpg",
  ultimaActualizacion: "2024-01-15T10:30:00.000Z",
  servicios: {
    tipoCentro: "hotel", // hotel, restaurante, museo, parque, mixto
    categorias: [
      {
        id: "habitaciones",
        nombre: "Habitaciones",
        icono: "bed",
        servicios: [
          {
            id: "habitacion_individual",
            nombre: "Habitación Individual",
            precio: 50,
            moneda: "USD",
            descripcion: "Habitación con cama individual, baño privado",
            imagen: "https://firebasestorage.googleapis.com/.../habitacion1.jpg",
            disponible: true,
            caracteristicas: ["WiFi", "Aire acondicionado", "TV"],
            fechaCreacion: "2024-01-15T10:30:00.000Z"
          }
        ]
      }
    ]
  },
  fechaCreacion: "2024-01-01T00:00:00.000Z",
  activo: true,
  tipoUsuario: "CentroTuristico"
}
```

## 🗂️ **Firebase Storage**

### Estructura de Carpetas

```
📁 Firebase Storage
├── 📁 turistas
│   └── 📁 {user_uid}
│       ├── 📁 profile
│       │   └── 📄 {user_uid}_{timestamp}.jpg
│       └── 📁 cover
│           └── 📄 {user_uid}_{timestamp}.jpg
└── 📁 centros_turisticos
    └── 📁 {user_uid}
        ├── 📁 profile
        │   └── 📄 {user_uid}_{timestamp}.jpg
        ├── 📁 cover
        │   └── 📄 {user_uid}_{timestamp}.jpg
        ├── 📁 logo
        │   └── 📄 {user_uid}_{timestamp}.jpg
        └── 📁 business_cover
            └── 📄 {user_uid}_{timestamp}.jpg
```

### Reglas de Storage

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Reglas para turistas
    match /turistas/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Reglas para centros turísticos
    match /centros_turisticos/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Permitir lectura pública de imágenes de centros turísticos (para mostrar en el mapa)
    match /centros_turisticos/{userId}/logo/{fileName} {
      allow read: if true; // Público para mostrar en el mapa
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /centros_turisticos/{userId}/business_cover/{fileName} {
      allow read: if true; // Público para mostrar en el mapa
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🛍️ **Sistema de Servicios y Costos**

### Estructura del Campo `servicios`

El campo `servicios` contiene información estructurada sobre los servicios ofrecidos por el centro turístico:

```javascript
servicios: {
  tipoCentro: "hotel", // hotel, restaurante, museo, parque, mixto
  categorias: [
    {
      id: "habitaciones",
      nombre: "Habitaciones",
      icono: "bed",
      servicios: [
        {
          id: "habitacion_individual",
          nombre: "Habitación Individual",
          precio: 50,
          moneda: "USD",
          descripcion: "Habitación con cama individual, baño privado",
          imagen: "https://firebasestorage.googleapis.com/.../habitacion1.jpg",
          disponible: true,
          caracteristicas: ["WiFi", "Aire acondicionado", "TV"],
          fechaCreacion: "2024-01-15T10:30:00.000Z"
        }
      ]
    }
  ]
}
```

### Tipos de Centro Soportados

- **Hotel**: Habitaciones, servicios adicionales, paquetes
- **Restaurante**: Menús, platos, bebidas, especialidades
- **Museo**: Entradas, tours, exposiciones temporales
- **Parque/Atracción**: Actividades, entradas, alquiler de equipos
- **Mixto**: Múltiples tipos de servicios combinados

### Ventajas del Sistema Modular

- ✅ **Flexibilidad**: Cada centro puede configurar sus propios servicios
- ✅ **Organización**: Servicios agrupados por categorías
- ✅ **Escalabilidad**: Fácil agregar nuevos tipos de centro
- ✅ **Consistencia**: Estructura uniforme para todos los servicios

## ⏰ **Campos de Horario Detallado**

### Estructura del Campo `horarioDetallado`

El campo `horarioDetallado` contiene información estructurada sobre los horarios de atención por día de la semana:

```javascript
horarioDetallado: {
  lunes: { 
    open: "09:00",    // Hora de apertura en formato 24h
    close: "18:00",   // Hora de cierre en formato 24h
    enabled: true     // Si el día está habilitado
  },
  martes: { open: "09:00", close: "18:00", enabled: true },
  miercoles: { open: "09:00", close: "18:00", enabled: true },
  jueves: { open: "09:00", close: "18:00", enabled: true },
  viernes: { open: "09:00", close: "18:00", enabled: true },
  sabado: { open: "09:00", close: "16:00", enabled: true },
  domingo: { open: "09:00", close: "18:00", enabled: false }
}
```

### Campos de Horario

- **`horario`**: Texto formateado para mostrar al usuario (ej: "Lunes - Viernes: 9:00 AM - 6:00 PM")
- **`horarioDetallado`**: Datos estructurados para procesamiento y edición
- **`ultimaActualizacion`**: Timestamp de la última modificación del perfil

### Ventajas de esta Estructura

- ✅ **Datos estructurados**: Fácil consulta y procesamiento
- ✅ **Formato legible**: Texto formateado para mostrar
- ✅ **Flexibilidad**: Cada día puede tener horarios diferentes
- ✅ **Compatibilidad**: Mantiene el campo `horario` existente

## 🔗 **Relaciones entre Colecciones**

### Flujo de Datos

1. **Registro de Usuario:**
   - Se crea en Firebase Auth
   - Se guarda en `turistas` o `centrosTuristicos`
   - Se suben imágenes a Storage
   - Se almacenan URLs en Firestore

2. **Login de Usuario:**
   - Se autentica en Firebase Auth
   - Se busca en `turistas` o `centrosTuristicos`
   - Se obtiene `roleId` para determinar tipo
   - Se cargan datos completos del usuario

3. **Referencias:**
   - `roleId` en usuarios → `id` en roles
   - URLs de imágenes → Firebase Storage

## 📱 **Uso en la Aplicación**

### Identificación de Usuario

```javascript
// Al hacer login, el usuario tendrá:
{
  uid: "user_uid",
  roleId: "turista", // o "centro_turistico"
  userType: "tourist", // o "centro_turistico"
  role: "tourist", // o "centro_turistico"
  imagenPerfil: "https://firebasestorage.googleapis.com/...",
  // ... otros datos del usuario
}
```

### Validaciones

- **Email único:** Se valida en Firebase Auth
- **Teléfono único:** Se valida en Firestore
- **Cédula única:** Se valida en Firestore
- **Imágenes:** Se validan en Storage

## 🚀 **Ventajas de esta Estructura**

### Escalabilidad
- ✅ Fácil agregar nuevos roles
- ✅ Separación clara de datos
- ✅ Referencias consistentes

### Seguridad
- ✅ Solo el propietario puede modificar sus datos
- ✅ Imágenes de centros públicas para el mapa
- ✅ Validaciones de datos únicos

### Mantenibilidad
- ✅ Estructura organizada
- ✅ Fácil consultas
- ✅ Datos normalizados

## 🔧 **Configuración Requerida**

### Firebase Auth
- Email/Password habilitado
- Validación de email único

### Firestore
- Reglas de seguridad configuradas
- Índices para consultas

### Storage
- Reglas de acceso configuradas
- Estructura de carpetas organizada

---

*Última actualización: Enero 2024*