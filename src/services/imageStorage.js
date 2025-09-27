import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../database/FirebaseConfig.js';

// Subir imagen a Firebase Storage
export const uploadImage = async (imageUri, path, userId) => {
  try {
    console.log('Iniciando subida de imagen...');
    console.log('Image URI:', imageUri);
    console.log('Path:', path);
    console.log('User ID:', userId);

    // Crear referencia al archivo en Storage
    const imageRef = ref(storage, `${path}/${userId}_${Date.now()}.jpg`);
    
    // Convertir URI a blob
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    console.log('Subiendo imagen a Firebase Storage...');
    
    // Subir el archivo
    const snapshot = await uploadBytes(imageRef, blob);
    
    console.log('Imagen subida exitosamente');
    
    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('URL de descarga obtenida:', downloadURL);
    
    return { 
      success: true, 
      url: downloadURL,
      path: snapshot.ref.fullPath
    };
  } catch (error) {
    console.error('Error al subir imagen:', error);
    return { 
      success: false, 
      error: error.message || 'Error al subir imagen' 
    };
  }
};

// Subir múltiples imágenes
export const uploadMultipleImages = async (images, path, userId) => {
  try {
    console.log('Iniciando subida de múltiples imágenes...');
    
    const uploadPromises = images.map((image, index) => 
      uploadImage(image.uri, path, `${userId}_${index}`)
    );
    
    const results = await Promise.all(uploadPromises);
    
    // Verificar si todas las subidas fueron exitosas
    const successfulUploads = results.filter(result => result.success);
    const failedUploads = results.filter(result => !result.success);
    
    if (failedUploads.length > 0) {
      console.warn('Algunas imágenes no se pudieron subir:', failedUploads);
    }
    
    return {
      success: successfulUploads.length > 0,
      urls: successfulUploads.map(result => result.url),
      paths: successfulUploads.map(result => result.path),
      errors: failedUploads.map(result => result.error)
    };
  } catch (error) {
    console.error('Error al subir múltiples imágenes:', error);
    return { 
      success: false, 
      error: error.message || 'Error al subir imágenes' 
    };
  }
};

// Eliminar imagen de Firebase Storage
export const deleteImage = async (imagePath) => {
  try {
    console.log('Eliminando imagen:', imagePath);
    
    const imageRef = ref(storage, imagePath);
    await deleteObject(imageRef);
    
    console.log('Imagen eliminada exitosamente');
    
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    return { 
      success: false, 
      error: error.message || 'Error al eliminar imagen' 
    };
  }
};

// Generar rutas de almacenamiento
export const getStoragePaths = (userId, userType) => {
  const basePath = userType === 'centro_turistico' ? 'centros_turisticos' : 'turistas';
  
  return {
    profileImage: `${basePath}/${userId}/profile`,
    coverImage: `${basePath}/${userId}/cover`,
    businessLogo: `${basePath}/${userId}/logo`,
    businessCover: `${basePath}/${userId}/business_cover`
  };
};
