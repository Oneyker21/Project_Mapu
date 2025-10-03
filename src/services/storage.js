import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_CREDENTIALS: 'user_credentials',
  REMEMBER_USER: 'remember_user',
  USER_DATA: 'user_data'
};

// Obtener flag de "Recordarme"
export const getRememberUserFlag = async () => {
  try {
    const rememberUser = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_USER);
    return rememberUser === 'true';
  } catch (error) {
    console.error('Error al obtener flag RememberUser:', error);
    return false;
  }
};

// Guardar credenciales del usuario
export const saveUserCredentials = async (email, password, rememberUser = false) => {
  try {
    if (rememberUser) {
      const credentials = { email, password };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_CREDENTIALS, JSON.stringify(credentials));
      await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_USER, 'true');
    } else {
      // Si no quiere recordar, limpiar las credenciales guardadas
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_CREDENTIALS);
      await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_USER, 'false');
    }
    return { success: true };
  } catch (error) {
    console.error('Error al guardar credenciales:', error);
    return { success: false, error: error.message };
  }
};

// Obtener credenciales guardadas
export const getSavedCredentials = async () => {
  try {
    const rememberUser = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_USER);
    if (rememberUser === 'true') {
      const credentials = await AsyncStorage.getItem(STORAGE_KEYS.USER_CREDENTIALS);
      if (credentials) {
        return { success: true, credentials: JSON.parse(credentials), rememberUser: true };
      }
    }
    return { success: true, credentials: null, rememberUser: false };
  } catch (error) {
    console.error('Error al obtener credenciales:', error);
    return { success: false, error: error.message };
  }
};

// Guardar datos del usuario autenticado
export const saveUserData = async (userData) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    return { success: true };
  } catch (error) {
    console.error('Error al guardar datos del usuario:', error);
    return { success: false, error: error.message };
  }
};

// Obtener datos del usuario guardados
export const getSavedUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (userData) {
      return { success: true, userData: JSON.parse(userData) };
    }
    return { success: true, userData: null };
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    return { success: false, error: error.message };
  }
};

// Limpiar todos los datos guardados (logout)
export const clearStoredData = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_CREDENTIALS,
      STORAGE_KEYS.USER_DATA
    ]);
    await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_USER, 'false');
    return { success: true };
  } catch (error) {
    console.error('Error al limpiar datos:', error);
    return { success: false, error: error.message };
  }
};

// Verificar si hay una sesión guardada
export const hasStoredSession = async () => {
  try {
    // Solo considerar sesión válida si el usuario eligió "Recordarme"
    const rememberUser = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_USER);
    if (rememberUser !== 'true') {
      return false;
    }
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return !!userData;
  } catch (error) {
    console.error('Error al verificar sesión guardada:', error);
    return false;
  }
};
