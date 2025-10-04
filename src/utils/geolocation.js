// Utilidades para geolocalización y determinación de departamentos en Nicaragua

/**
 * Determina el departamento de Nicaragua basado en coordenadas de latitud y longitud
 * @param {number} latitude - Latitud
 * @param {number} longitude - Longitud
 * @returns {string} - Nombre del departamento
 */
export const getDepartmentFromCoordinates = (latitude, longitude) => {
  // Coordenadas aproximadas de los departamentos de Nicaragua
  const departments = [
    {
      name: 'Managua',
      bounds: {
        north: 12.4,
        south: 11.8,
        east: -86.0,
        west: -86.5
      }
    },
    {
      name: 'León',
      bounds: {
        north: 12.6,
        south: 12.2,
        east: -86.5,
        west: -87.0
      }
    },
    {
      name: 'Granada',
      bounds: {
        north: 11.9,
        south: 11.7,
        east: -85.8,
        west: -86.2
      }
    },
    {
      name: 'Masaya',
      bounds: {
        north: 12.1,
        south: 11.8,
        east: -86.0,
        west: -86.3
      }
    },
    {
      name: 'Carazo',
      bounds: {
        north: 11.8,
        south: 11.6,
        east: -86.0,
        west: -86.3
      }
    },
    {
      name: 'Rivas',
      bounds: {
        north: 11.6,
        south: 11.0,
        east: -85.5,
        west: -86.0
      }
    },
    {
      name: 'Chinandega',
      bounds: {
        north: 13.0,
        south: 12.4,
        east: -87.0,
        west: -87.5
      }
    },
    {
      name: 'Estelí',
      bounds: {
        north: 13.2,
        south: 12.8,
        east: -86.2,
        west: -86.8
      }
    },
    {
      name: 'Nueva Segovia',
      bounds: {
        north: 13.8,
        south: 13.2,
        east: -86.0,
        west: -86.8
      }
    },
    {
      name: 'Madriz',
      bounds: {
        north: 13.5,
        south: 13.0,
        east: -86.2,
        west: -86.8
      }
    },
    {
      name: 'Jinotega',
      bounds: {
        north: 13.5,
        south: 12.8,
        east: -85.5,
        west: -86.2
      }
    },
    {
      name: 'Matagalpa',
      bounds: {
        north: 13.2,
        south: 12.5,
        east: -85.5,
        west: -86.2
      }
    },
    {
      name: 'Boaco',
      bounds: {
        north: 12.5,
        south: 12.0,
        east: -85.5,
        west: -86.0
      }
    },
    {
      name: 'Chontales',
      bounds: {
        north: 12.5,
        south: 11.5,
        east: -85.0,
        west: -85.8
      }
    },
    {
      name: 'Río San Juan',
      bounds: {
        north: 11.5,
        south: 10.5,
        east: -84.0,
        west: -85.5
      }
    },
    {
      name: 'Atlántico Norte (RAAN)',
      bounds: {
        north: 14.5,
        south: 13.0,
        east: -83.0,
        west: -85.5
      }
    },
    {
      name: 'Atlántico Sur (RAAS)',
      bounds: {
        north: 13.0,
        south: 11.0,
        east: -83.0,
        west: -85.0
      }
    }
  ];

  // Verificar si las coordenadas están dentro de algún departamento
  for (const dept of departments) {
    if (
      latitude >= dept.bounds.south &&
      latitude <= dept.bounds.north &&
      longitude >= dept.bounds.west &&
      longitude <= dept.bounds.east
    ) {
      return dept.name;
    }
  }

  // Si no se encuentra en ningún departamento, retornar "No especificado"
  return 'No especificado';
};

/**
 * Valida si las coordenadas están dentro de Nicaragua
 * @param {number} latitude - Latitud
 * @param {number} longitude - Longitud
 * @returns {boolean} - True si está dentro de Nicaragua
 */
export const isWithinNicaragua = (latitude, longitude) => {
  // Límites aproximados de Nicaragua
  const nicaraguaBounds = {
    north: 15.0,
    south: 10.7,
    east: -82.7,
    west: -87.7
  };

  return (
    latitude >= nicaraguaBounds.south &&
    latitude <= nicaraguaBounds.north &&
    longitude >= nicaraguaBounds.west &&
    longitude <= nicaraguaBounds.east
  );
};

/**
 * Obtiene información detallada de ubicación basada en coordenadas
 * @param {number} latitude - Latitud
 * @param {number} longitude - Longitud
 * @returns {object} - Información de ubicación
 */
export const getLocationInfo = (latitude, longitude) => {
  const department = getDepartmentFromCoordinates(latitude, longitude);
  const isInNicaragua = isWithinNicaragua(latitude, longitude);

  return {
    department,
    isInNicaragua,
    coordinates: {
      latitude,
      longitude
    }
  };
};
