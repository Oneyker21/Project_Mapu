import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../database/FirebaseConfig.js';
import { saveUserCredentials, saveUserData, clearStoredData, getSavedCredentials } from './storage.js';

// Registrar usuario con email y contraseña
export const registerUser = async (userData) => {
  try {
    console.log('Iniciando registro de usuario...');
    const { email, password, firstName, lastName, role, ...additionalData } = userData;
    
    // Validar datos requeridos
    if (!email || !password || !firstName || !lastName || !role) {
      return { success: false, error: 'Faltan datos requeridos' };
    }
    
    console.log('Creando usuario en Firebase Auth...');
    
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('Usuario creado exitosamente:', user.uid);

    // Actualizar perfil con nombre completo
    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`,
    });

    // Guardar datos adicionales en Firestore
    const userDoc = {
      uid: user.uid,
      email: user.email,
      firstName,
      lastName,
      role,
      createdAt: new Date().toISOString(),
      ...additionalData
    };

    console.log('Guardando datos en Firestore...');
    console.log('UserDoc to save:', userDoc);
    await setDoc(doc(db, 'users', user.uid), userDoc);
    
    console.log('Registro completado exitosamente');

    return { success: true, user: userDoc };
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    
    // Manejar errores específicos de Firebase
    let errorMessage = 'Error al registrarse. Inténtalo de nuevo.';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Este email ya está registrado.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'La contraseña es muy débil.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'El email no es válido.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Error de conexión. Verifica tu internet.';
    }
    
    return { success: false, error: errorMessage };
  }
};

// Iniciar sesión con email y contraseña
export const loginUser = async (email, password, rememberUser = false) => {
  try {
    console.log('Iniciando sesión...');
    
    if (!email || !password) {
      return { success: false, error: 'Email y contraseña son requeridos' };
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('Sesión iniciada exitosamente:', user.uid);

    // Obtener datos adicionales del usuario desde Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.exists() ? userDoc.data() : null;

    const completeUserData = { ...user, ...userData };

    // Guardar credenciales si el usuario quiere ser recordado
    if (rememberUser) {
      await saveUserCredentials(email, password, true);
    }

    // Guardar datos del usuario para la sesión
    await saveUserData(completeUserData);

    return { success: true, user: completeUserData };
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    
    // Manejar errores específicos de Firebase
    let errorMessage = 'Error al iniciar sesión. Inténtalo de nuevo.';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No existe una cuenta con este email.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Contraseña incorrecta.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'El email no es válido.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Demasiados intentos fallidos. Inténtalo más tarde.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Error de conexión. Verifica tu internet.';
    }
    
    return { success: false, error: errorMessage };
  }
};

// Cerrar sesión
export const logoutUser = async () => {
  try {
    await signOut(auth);
    // Limpiar datos guardados excepto las credenciales si el usuario quiere ser recordado
    await clearStoredData();
    return { success: true };
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    return { success: false, error: error.message };
  }
};

// Obtener usuario actual
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Verificar si el usuario está autenticado
export const isUserAuthenticated = () => {
  return !!auth.currentUser;
};

// Auto-login con credenciales guardadas
export const autoLogin = async () => {
  try {
    const credentialsResult = await getSavedCredentials();
    
    if (credentialsResult.success && credentialsResult.rememberUser && credentialsResult.credentials) {
      const { email, password } = credentialsResult.credentials;
      const loginResult = await loginUser(email, password, true);
      
      if (loginResult.success) {
        return { success: true, user: loginResult.user };
      }
    }
    
    return { success: false, error: 'No hay credenciales guardadas' };
  } catch (error) {
    console.error('Error en auto-login:', error);
    return { success: false, error: error.message };
  }
};

// Verificar estado de autenticación
export const checkAuthState = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

// Restablecer contraseña
export const resetPassword = async (email) => {
  try {
    if (!email) {
      return { success: false, error: 'El email es requerido' };
    }

    // Validar formato de email
    if (!/\S+@\S+\.\S+/.test(email)) {
      return { success: false, error: 'El email no es válido' };
    }

    await sendPasswordResetEmail(auth, email);

    return { success: true, message: 'Se ha enviado un enlace de restablecimiento a tu correo electrónico' };
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    
    // Manejar errores específicos de Firebase
    let errorMessage = 'Error al enviar el email de restablecimiento. Inténtalo de nuevo.';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No existe una cuenta con este email.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'El email no es válido.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Demasiados intentos. Inténtalo más tarde.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Error de conexión. Verifica tu internet.';
    }
    
    return { success: false, error: errorMessage };
  }
};
