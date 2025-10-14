import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  getDoc,
  increment
} from 'firebase/firestore';
import { db } from '../../database/FirebaseConfig.js';

// Colecciones de Firebase
const REVIEWS_COLLECTION = 'reseñas';
const CENTERS_COLLECTION = 'centrosTuristicos';

/**
 * Guardar una nueva reseña
 */
export const saveReview = async (reviewData) => {
  try {
    // Verificar si ya existe una reseña del usuario para este centro
    const existingReview = await getUserReviewForCenter(reviewData.userId, reviewData.centerId);
    
    if (existingReview) {
      throw new Error('Ya has escrito una reseña para este centro');
    }

    // Guardar la reseña
    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), {
      ...reviewData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Actualizar estadísticas del centro
    await updateCenterStats(reviewData.centerId, reviewData.rating, 'add');


    console.log('✅ Reseña guardada con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error guardando reseña:', error);
    throw error;
  }
};

/**
 * Actualizar una reseña existente
 */
export const updateReview = async (reviewId, updatedData) => {
  try {
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
    
    // Obtener la reseña actual para comparar ratings
    const reviewDoc = await getDoc(reviewRef);
    if (!reviewDoc.exists()) {
      throw new Error('Reseña no encontrada');
    }
    
    const currentReview = reviewDoc.data();
    
    await updateDoc(reviewRef, {
      ...updatedData,
      updatedAt: new Date()
    });

    // Actualizar estadísticas del centro si cambió el rating
    if (currentReview.rating !== updatedData.rating) {
      await updateCenterStats(currentReview.centerId, currentReview.rating, 'remove');
      await updateCenterStats(currentReview.centerId, updatedData.rating, 'add');
    }

    console.log('✅ Reseña actualizada:', reviewId);
    return true;
  } catch (error) {
    console.error('❌ Error actualizando reseña:', error);
    throw error;
  }
};

/**
 * Responder a una reseña
 */
export const replyToReview = async (reviewId, replyData) => {
  try {
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
    
    // Obtener la reseña actual
    const reviewDoc = await getDoc(reviewRef);
    if (!reviewDoc.exists()) {
      throw new Error('Reseña no encontrada');
    }
    
    await updateDoc(reviewRef, {
      reply: {
        message: replyData.message,
        authorId: replyData.authorId,
        authorName: replyData.authorName,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      updatedAt: new Date()
    });

    console.log('✅ Respuesta agregada a la reseña:', reviewId);
    return true;
  } catch (error) {
    console.error('❌ Error respondiendo a la reseña:', error);
    throw error;
  }
};

/**
 * Eliminar respuesta de una reseña
 */
export const deleteReviewReply = async (reviewId) => {
  try {
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
    
    await updateDoc(reviewRef, {
      reply: null,
      updatedAt: new Date()
    });

    console.log('✅ Respuesta eliminada de la reseña:', reviewId);
    return true;
  } catch (error) {
    console.error('❌ Error eliminando respuesta de la reseña:', error);
    throw error;
  }
};

/**
 * Eliminar una reseña
 */
export const deleteReview = async (reviewId, centerId, rating) => {
  try {
    await deleteDoc(doc(db, REVIEWS_COLLECTION, reviewId));
    
    // Actualizar estadísticas del centro
    await updateCenterStats(centerId, rating, 'remove');
    
    console.log('✅ Reseña eliminada:', reviewId);
    return true;
  } catch (error) {
    console.error('❌ Error eliminando reseña:', error);
    throw error;
  }
};

/**
 * Obtener reseñas de un centro específico
 */
export const getCenterReviews = async (centerId, limitCount = 50) => {
  try {
    if (!centerId) {
      console.log('No se proporcionó centerId');
      return [];
    }

    // Usar solo consulta simple para evitar errores de índice
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('centerId', '==', centerId)
    );

    const querySnapshot = await getDocs(q);
    const reviews = [];

    querySnapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Ordenar por fecha manualmente
    reviews.sort((a, b) => {
      const dateA = a.createdAt || a.date || a.timestamp || new Date(0);
      const dateB = b.createdAt || b.date || b.timestamp || new Date(0);
      return new Date(dateB) - new Date(dateA);
    });

    // Limitar resultados si es necesario
    const limitedReviews = limitCount ? reviews.slice(0, limitCount) : reviews;

    console.log(`✅ Obtenidas ${limitedReviews.length} reseñas para centro ${centerId}`);
    return limitedReviews;
  } catch (error) {
    console.error('❌ Error obteniendo reseñas del centro:', error);
    // Si es cualquier error de Firebase, retornar array vacío
    if (error.code === 'failed-precondition' || error.code === 'permission-denied' || error.message.includes('index')) {
      console.log('Error de Firebase (índice/permisos), retornando array vacío');
      return [];
    }
    throw error;
  }
};

/**
 * Obtener reseñas escritas por un usuario
 */
export const getUserReviews = async (userId, limitCount = 50) => {
  try {
    if (!userId) {
      console.log('No se proporcionó userId');
      return [];
    }

    // Usar solo consulta simple para evitar errores de índice
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const reviews = [];

    querySnapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Ordenar por fecha manualmente
    reviews.sort((a, b) => {
      const dateA = a.createdAt || a.date || a.timestamp || new Date(0);
      const dateB = b.createdAt || b.date || b.timestamp || new Date(0);
      return new Date(dateB) - new Date(dateA);
    });

    // Limitar resultados si es necesario
    const limitedReviews = limitCount ? reviews.slice(0, limitCount) : reviews;

    console.log(`✅ Obtenidas ${limitedReviews.length} reseñas del usuario ${userId}`);
    return limitedReviews;
  } catch (error) {
    console.error('❌ Error obteniendo reseñas del usuario:', error);
    // Si es cualquier error de Firebase, retornar array vacío
    if (error.code === 'failed-precondition' || error.code === 'permission-denied' || error.message.includes('index')) {
      console.log('Error de Firebase (índice/permisos), retornando array vacío');
      return [];
    }
    throw error;
  }
};

/**
 * Obtener reseña específica de un usuario para un centro
 */
export const getUserReviewForCenter = async (userId, centerId) => {
  try {
    if (!userId || !centerId) {
      console.log('No se proporcionaron userId o centerId');
      return null;
    }

    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('userId', '==', userId),
      where('centerId', '==', centerId)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('❌ Error obteniendo reseña del usuario:', error);
    // Si es error de índice, retornar null
    if (error.code === 'failed-precondition' || error.message.includes('index')) {
      console.log('Índice no disponible, retornando null');
      return null;
    }
    throw error;
  }
};

/**
 * Actualizar estadísticas de un centro
 */
const updateCenterStats = async (centerId, rating, operation) => {
  try {
    const centerRef = doc(db, CENTERS_COLLECTION, centerId);
    const centerDoc = await getDoc(centerRef);
    
    if (!centerDoc.exists()) {
      console.warn('⚠️ Centro no encontrado para actualizar estadísticas:', centerId);
      return;
    }

    const centerData = centerDoc.data();
    const currentStats = {
      calificacion: centerData.calificacion || 0,
      totalResenas: centerData.totalResenas || 0,
      sumaCalificaciones: centerData.sumaCalificaciones || 0
    };

    let newStats = { ...currentStats };

    if (operation === 'add') {
      newStats.totalResenas += 1;
      newStats.sumaCalificaciones += rating;
    } else if (operation === 'remove') {
      newStats.totalResenas = Math.max(0, newStats.totalResenas - 1);
      newStats.sumaCalificaciones = Math.max(0, newStats.sumaCalificaciones - rating);
    }

    // Calcular nueva calificación promedio
    if (newStats.totalResenas > 0) {
      newStats.calificacion = parseFloat((newStats.sumaCalificaciones / newStats.totalResenas).toFixed(1));
    } else {
      newStats.calificacion = 0;
    }

    await updateDoc(centerRef, {
      calificacion: newStats.calificacion,
      totalResenas: newStats.totalResenas,
      sumaCalificaciones: newStats.sumaCalificaciones,
      updatedAt: new Date()
    });

    console.log(`✅ Estadísticas del centro ${centerId} actualizadas:`, newStats);
  } catch (error) {
    console.error('❌ Error actualizando estadísticas del centro:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas de reseñas de un centro
 */
export const getCenterReviewStats = async (centerId) => {
  try {
    const centerDoc = await getDoc(doc(db, CENTERS_COLLECTION, centerId));
    
    if (!centerDoc.exists()) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const centerData = centerDoc.data();
    const reviews = await getCenterReviews(centerId, 1000); // Obtener todas las reseñas para distribución

    // Calcular distribución de calificaciones
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      distribution[review.rating] = (distribution[review.rating] || 0) + 1;
    });

    return {
      averageRating: centerData.calificacion || 0,
      totalReviews: centerData.totalResenas || 0,
      ratingDistribution: distribution
    };
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de reseñas:', error);
    throw error;
  }
};

/**
 * Formatear fecha para mostrar
 */
export const formatReviewDate = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return 'Ayer';
  } else if (diffDays < 7) {
    return `Hace ${diffDays} días`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
  } else {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
};

export default {
  saveReview,
  updateReview,
  deleteReview,
  replyToReview,
  deleteReviewReply,
  getCenterReviews,
  getUserReviews,
  getUserReviewForCenter,
  getCenterReviewStats,
  formatReviewDate
};
