import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './FirebaseConfig';

// Registrar usuario con email y contraseña
export const registerUser = async (userData) => {
  try {
    const { email, password, firstName, lastName, role, ...additionalData } = userData;
    
    // Validar datos requeridos
    if (!email || !password || !firstName || !lastName || !role) {
      return { success: false, error: 'Faltan datos requeridos' };
    }
    
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

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

    await setDoc(doc(db, 'users', user.uid), userDoc);

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
    }
    
    return { success: false, error: errorMessage };
  }
};

// Iniciar sesión con email y contraseña
export const loginUser = async (email, password) => {
  try {
    if (!email || !password) {
      return { success: false, error: 'Email y contraseña son requeridos' };
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Obtener datos adicionales del usuario desde Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.exists() ? userDoc.data() : null;

    return { success: true, user: { ...user, ...userData } };
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
    }
    
    return { success: false, error: errorMessage };
  }
};

// Cerrar sesión
export const logoutUser = async () => {
  try {
    await signOut(auth);
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
