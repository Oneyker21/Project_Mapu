import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../database/FirebaseConfig.js';
import { saveUserCredentials, saveUserData, clearStoredData, getSavedCredentials } from './storage.js';
import { uploadImage, getStoragePaths } from './imageStorage.js';

// Validar si el email ya existe en Firestore
const validateEmailExists = async (email) => {
  try {
    // Buscar en turistas
    const turistasQuery = query(collection(db, 'turistas'), where('email', '==', email));
    const turistasSnapshot = await getDocs(turistasQuery);
    
    if (!turistasSnapshot.empty) {
      return { exists: true, message: 'Este correo electrónico ya está registrado.' };
    }
    
    // Buscar en centros turísticos
    const centrosQuery = query(collection(db, 'centrosTuristicos'), where('email', '==', email));
    const centrosSnapshot = await getDocs(centrosQuery);
    
    if (!centrosSnapshot.empty) {
      return { exists: true, message: 'Este correo electrónico ya está registrado.' };
    }
    
    return { exists: false };
  } catch (error) {
    console.error('Error validando email:', error);
    return { exists: false };
  }
};

// Validar si el teléfono ya existe
const validatePhoneExists = async (phone) => {
  try {
    // Buscar en turistas
    const turistasQuery = query(collection(db, 'turistas'), where('telefono', '==', phone));
    const turistasSnapshot = await getDocs(turistasQuery);
    
    if (!turistasSnapshot.empty) {
      return { exists: true, message: 'Este número de teléfono ya está registrado.' };
    }
    
    // Buscar en centros turísticos
    const centrosQuery = query(collection(db, 'centrosTuristicos'), where('telefonoNegocio', '==', phone));
    const centrosSnapshot = await getDocs(centrosQuery);
    
    if (!centrosSnapshot.empty) {
      return { exists: true, message: 'Este número de teléfono ya está registrado.' };
    }
    
    return { exists: false };
  } catch (error) {
    console.error('Error validando teléfono:', error);
    return { exists: false };
  }
};

// Validar si la cédula ya existe
const validateCedulaExists = async (cedula) => {
  try {
    // Buscar en turistas
    const turistasQuery = query(collection(db, 'turistas'), where('numeroDocumento', '==', cedula));
    const turistasSnapshot = await getDocs(turistasQuery);
    
    if (!turistasSnapshot.empty) {
      return { exists: true, message: 'Esta cédula ya está registrada.' };
    }
    
    return { exists: false };
  } catch (error) {
    console.error('Error validando cédula:', error);
    return { exists: false };
  }
};

// Crear roles en la colección roles si no existen
const createRolesIfNotExist = async () => {
  try {
    // Verificar si ya existen los roles
    const turistaRole = await getDoc(doc(db, 'roles', 'turista'));
    const centroRole = await getDoc(doc(db, 'roles', 'centro_turistico'));
    
    if (!turistaRole.exists()) {
      await setDoc(doc(db, 'roles', 'turista'), {
        id: 'turista',
        nombre: 'Turista',
        descripcion: 'Usuario que busca lugares turísticos y experiencias',
        activo: true,
        fechaCreacion: new Date().toISOString()
      });
    }
    
    if (!centroRole.exists()) {
      await setDoc(doc(db, 'roles', 'centro_turistico'), {
        id: 'centro_turistico',
        nombre: 'Centro Turístico',
        descripcion: 'Negocio o lugar que ofrece servicios turísticos',
        activo: true,
        fechaCreacion: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error creando roles:', error);
  }
};

// Registrar usuario con email y contraseña
export const registerUser = async (userData) => {
  try {
    console.log('Iniciando registro de usuario...');
    const { email, password, firstName, lastName, role, ...additionalData } = userData;
    
    // Validar datos requeridos
    if (!email || !password || !firstName || !lastName || !role) {
      return { success: false, error: 'Faltan datos requeridos' };
    }
    
    // Validar que el email no exista
    const emailValidation = await validateEmailExists(email);
    if (emailValidation.exists) {
      return { success: false, error: emailValidation.message };
    }
    
    // Validar teléfono si es turista
    if (role === 'tourist' && additionalData.phone) {
      const phoneValidation = await validatePhoneExists(additionalData.phone);
      if (phoneValidation.exists) {
        return { success: false, error: phoneValidation.message };
      }
    }
    
    // Validar cédula si es turista y tiene cédula
    if (role === 'tourist' && additionalData.documentType === 'cedula' && additionalData.documentNumber) {
      const cedulaValidation = await validateCedulaExists(additionalData.documentNumber);
      if (cedulaValidation.exists) {
        return { success: false, error: cedulaValidation.message };
      }
    }
    
    // Crear roles si no existen
    await createRolesIfNotExist();
    
    console.log('Creando usuario en Firebase Auth...');
    
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('Usuario creado exitosamente:', user.uid);

    // Actualizar perfil con nombre completo
    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`,
    });

    // Obtener rutas de almacenamiento
    const storagePaths = getStoragePaths(user.uid, role);
    
    // Subir imágenes a Firebase Storage
    let profileImageUrl = null;
    let coverImageUrl = null;
    let businessLogoUrl = null;
    let businessCoverUrl = null;

    try {
      // Subir imagen de perfil si existe
      if (additionalData.profileImage) {
        console.log('Subiendo imagen de perfil...');
        const profileResult = await uploadImage(additionalData.profileImage.uri, storagePaths.profileImage, user.uid);
        if (profileResult.success) {
          profileImageUrl = profileResult.url;
          console.log('Imagen de perfil subida exitosamente');
        } else {
          console.warn('Error al subir imagen de perfil:', profileResult.error);
        }
      }

      // Subir portada si existe
      if (additionalData.coverImage) {
        console.log('Subiendo portada...');
        const coverResult = await uploadImage(additionalData.coverImage.uri, storagePaths.coverImage, user.uid);
        if (coverResult.success) {
          coverImageUrl = coverResult.url;
          console.log('Portada subida exitosamente');
        } else {
          console.warn('Error al subir portada:', coverResult.error);
        }
      }

      // Subir logo del negocio si existe (solo para centros turísticos)
      if (role === 'centro_turistico' && additionalData.businessLogo) {
        console.log('Subiendo logo del negocio...');
        const logoResult = await uploadImage(additionalData.businessLogo.uri, storagePaths.businessLogo, user.uid);
        if (logoResult.success) {
          businessLogoUrl = logoResult.url;
          console.log('Logo del negocio subido exitosamente');
        } else {
          console.warn('Error al subir logo del negocio:', logoResult.error);
        }
      }

      // Subir portada del negocio si existe (solo para centros turísticos)
      if (role === 'centro_turistico' && additionalData.businessCover) {
        console.log('Subiendo portada del negocio...');
        const businessCoverResult = await uploadImage(additionalData.businessCover.uri, storagePaths.businessCover, user.uid);
        if (businessCoverResult.success) {
          businessCoverUrl = businessCoverResult.url;
          console.log('Portada del negocio subida exitosamente');
        } else {
          console.warn('Error al subir portada del negocio:', businessCoverResult.error);
        }
      }
    } catch (error) {
      console.error('Error al subir imágenes:', error);
      // Continuar con el registro aunque falle la subida de imágenes
    }

    // Preparar datos según el tipo de usuario
    let userDoc = {};
    let collectionName = '';

    if (role === 'centro_turistico') {
      // Estructura para Centro Turístico
      userDoc = {
        uid: user.uid,
        email: user.email,
        roleId: 'centro_turistico', // Referencia al rol
        nombrePropietario: firstName + ' ' + lastName,
        emailPropietario: user.email,
        nombreNegocio: additionalData.businessName || '',
        categoriaNegocio: additionalData.businessCategory || '',
        emailNegocio: additionalData.businessEmail || '',
        telefonoNegocio: additionalData.businessPhone || '',
        direccion: additionalData.address || '',
        latitud: additionalData.latitude || '',
        longitud: additionalData.longitude || '',
        departamento: additionalData.department || '',
        horario: additionalData.businessSchedule || '',
        costo: additionalData.businessCost || '',
        logotipo: businessLogoUrl, // URL de Firebase Storage
        portada: businessCoverUrl, // URL de Firebase Storage
        fechaCreacion: new Date().toISOString(),
        activo: true,
        tipoUsuario: 'CentroTuristico'
      };
      collectionName = 'centrosTuristicos';
    } else if (role === 'tourist') {
      // Estructura para Turista
      userDoc = {
        uid: user.uid,
        email: user.email,
        roleId: 'turista', // Referencia al rol
        nombres: firstName,
        apellidos: lastName,
        telefono: additionalData.phone || '',
        tipoDocumento: additionalData.documentType || '',
        numeroDocumento: additionalData.documentNumber || '',
        ciudad: additionalData.city || '',
        pais: additionalData.country || '',
        residencia: additionalData.residence || '',
        imagenPerfil: profileImageUrl, // URL de Firebase Storage
        portada: coverImageUrl, // URL de Firebase Storage
        fechaCreacion: new Date().toISOString(),
        activo: true,
        tipoUsuario: 'Turista'
      };
      collectionName = 'turistas';
    } else {
      return { success: false, error: 'Tipo de usuario no válido' };
    }

    console.log('Guardando datos en Firestore...');
    console.log('Collection:', collectionName);
    console.log('UserDoc to save:', userDoc);
    
    // Guardar en la colección específica según el tipo de usuario
    await setDoc(doc(db, collectionName, user.uid), userDoc);
    
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
    // Buscar en las colecciones de usuarios
    let userData = null;
    let userType = null;
    
    // Intentar buscar en centrosTuristicos
    const centroDoc = await getDoc(doc(db, 'centrosTuristicos', user.uid));
    console.log('Buscando en centrosTuristicos:', user.uid, centroDoc.exists());
    if (centroDoc.exists()) {
      userData = centroDoc.data();
      userType = 'centro_turistico';
      console.log('Usuario encontrado como centro turístico:', userData);
    } else {
      // Intentar buscar en turistas
      const turistaDoc = await getDoc(doc(db, 'turistas', user.uid));
      console.log('Buscando en turistas:', user.uid, turistaDoc.exists());
      if (turistaDoc.exists()) {
        userData = turistaDoc.data();
        userType = 'tourist';
        console.log('Usuario encontrado como turista:', userData);
      }
    }

    const completeUserData = { 
      ...user, 
      ...userData, 
      userType: userType,
      role: userType,
      roleId: userData?.roleId || userType, // Include roleId for role reference
      tipoUsuario: userData?.tipoUsuario || userType
    };
    
    console.log('Datos completos del usuario:', completeUserData);
    console.log('userType:', userType, 'role:', userType);

    // Guardar credenciales si el usuario quiere ser recordado
    if (rememberUser) {
      await saveUserCredentials(email, password, true);
    }

    // Guardar datos del usuario para la sesión
    await saveUserData(completeUserData);

    return { success: true, user: completeUserData };
  } catch (error) {
    // Manejar errores específicos de Firebase sin mostrar detalles técnicos
    let errorMessage = 'Email o contraseña incorrectos.';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No existe una cuenta con este email.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'La contraseña es incorrecta.';
    } else if (error.code === 'auth/invalid-credential') {
      errorMessage = 'Email o contraseña incorrectos.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'El formato del email no es válido.';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'Esta cuenta ha sido deshabilitada.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
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
