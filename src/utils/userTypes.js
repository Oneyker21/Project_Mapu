// Utilidades para manejar tipos de usuario

export const USER_TYPES = {
  TURISTA: 'turista',
  CENTRO_TURISTICO: 'centro_turistico',
  ADMIN: 'admin'
};

export const COLLECTIONS = {
  TURISTAS: 'turistas',
  CENTROS_TURISTICOS: 'centrosTuristicos',
  ADMINISTRADORES: 'administradores'
};

export const getUserCollection = (userType) => {
  switch (userType) {
    case USER_TYPES.TURISTA:
      return COLLECTIONS.TURISTAS;
    case USER_TYPES.CENTRO_TURISTICO:
      return COLLECTIONS.CENTROS_TURISTICOS;
    case USER_TYPES.ADMIN:
      return COLLECTIONS.ADMINISTRADORES;
    default:
      return COLLECTIONS.TURISTAS;
  }
};

export const getUserTypeFromCollection = (collectionName) => {
  switch (collectionName) {
    case COLLECTIONS.TURISTAS:
      return USER_TYPES.TURISTA;
    case COLLECTIONS.CENTROS_TURISTICOS:
      return USER_TYPES.CENTRO_TURISTICO;
    case COLLECTIONS.ADMINISTRADORES:
      return USER_TYPES.ADMIN;
    default:
      return USER_TYPES.TURISTA;
  }
};

export const getDisplayName = (userType) => {
  switch (userType) {
    case USER_TYPES.TURISTA:
      return 'Turista';
    case USER_TYPES.CENTRO_TURISTICO:
      return 'Centro Turístico';
    case USER_TYPES.ADMIN:
      return 'Administrador';
    default:
      return 'Usuario';
  }
};

export const getRoleColor = (userType) => {
  switch (userType) {
    case USER_TYPES.TURISTA:
      return '#3B82F6'; // Azul
    case USER_TYPES.CENTRO_TURISTICO:
      return '#10B981'; // Verde
    case USER_TYPES.ADMIN:
      return '#F59E0B'; // Amarillo
    default:
      return '#6B7280'; // Gris
  }
};
