// Versión de prueba simple del AuthService para debugging
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Importar configuración de Firebase
import { auth, db } from './FirebaseConfig.js';

// Función de prueba simple
export const testFirebaseConnection = () => {
  try {
    console.log('Testing Firebase connection...');
    console.log('Auth object:', auth);
    console.log('DB object:', db);
    return { success: true, message: 'Firebase connection OK' };
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return { success: false, error: error.message };
  }
};

// Registrar usuario con email y contraseña (versión simplificada)
export const registerUser = async (userData) => {
  try {
    console.log('Starting user registration...');
    console.log('User data:', userData);
    
    if (!auth || !db) {
      return { success: false, error: 'Firebase no está configurado correctamente' };
    }

    const { email, password, firstName, lastName, role } = userData;
    
    // Validar datos requeridos
    if (!email || !password || !firstName || !lastName || !role) {
      return { success: false, error: 'Faltan datos requeridos' };
    }
    
    console.log('Creating user with email:', email);
    
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('User created successfully:', user.uid);

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
    };

    await setDoc(doc(db, 'users', user.uid), userDoc);
    
    console.log('User document saved to Firestore');

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

// Iniciar sesión con email y contraseña (versión simplificada)
export const loginUser = async (email, password) => {
  try {
    console.log('Starting user login...');
    
    if (!auth || !db) {
      return { success: false, error: 'Firebase no está configurado correctamente' };
    }

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
    }
    
    return { success: false, error: errorMessage };
  }
};
