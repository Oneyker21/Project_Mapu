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
    
    const currentReview = reviewDoc.data();
    // Obtener la respuesta actual si existe
    const currentReply = currentReview.reply;
    
    await updateDoc(reviewRef, {
      reply: {
        message: replyData.message,
        authorId: replyData.authorId,
        authorName: replyData.authorName,
        createdAt: currentReply?.createdAt || new Date(), // Mantener fecha original si existe
        updatedAt: new Date(), // Actualizar fecha de modificación
        lastModified: new Date() // Campo adicional para tracking de última modificación
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
 * Eliminar una reseña (incluye respuesta si existe)
 */
export const deleteReview = async (reviewId, centerId, rating) => {
  try {
    // Obtener la reseña antes de eliminarla para verificar si tiene respuesta
    const reviewDoc = await getDoc(doc(db, REVIEWS_COLLECTION, reviewId));
    if (!reviewDoc.exists()) {
      throw new Error('Reseña no encontrada');
    }
    
    await deleteDoc(doc(db, REVIEWS_COLLECTION, reviewId));
    
    // Actualizar estadísticas del centro
    await updateCenterStats(centerId, rating, 'remove');
    
    console.log('✅ Reseña eliminada (incluyendo respuesta si existía):', reviewId);
    return true;
  } catch (error) {
    console.error('❌ Error eliminando reseña:', error);
    throw error;
  }
};

/**
 * Reportar una reseña como inapropiada
 */
export const reportReview = async (reviewId, reason, reportedBy, reporterType) => {
  try {
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
    
    // Obtener la reseña actual
    const reviewDoc = await getDoc(reviewRef);
    if (!reviewDoc.exists()) {
      throw new Error('Reseña no encontrada');
    }
    
    await updateDoc(reviewRef, {
      reported: true,
      reportReason: reason,
      reportedBy: reportedBy,
      reporterType: reporterType, // 'center' o 'user'
      reportedAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Reseña reportada:', reviewId);
    return true;
  } catch (error) {
    console.error('❌ Error reportando reseña:', error);
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
 * Dar like a una reseña
 */
export const likeReview = async (reviewId, userId) => {
  try {
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
    
    // Obtener la reseña actual
    const reviewDoc = await getDoc(reviewRef);
    if (!reviewDoc.exists()) {
      throw new Error('Reseña no encontrada');
    }
    
    const currentReview = reviewDoc.data();
    const likes = currentReview.likes || [];
    
    // Verificar si el usuario ya dio like
    const hasLiked = likes.includes(userId);
    
    if (hasLiked) {
      // Quitar el like
      const newLikes = likes.filter(id => id !== userId);
      await updateDoc(reviewRef, {
        likes: newLikes,
        likeCount: newLikes.length,
        updatedAt: new Date()
      });
      console.log('✅ Like removido de la reseña:', reviewId);
      return { liked: false, likeCount: newLikes.length };
    } else {
      // Agregar el like
      const newLikes = [...likes, userId];
      await updateDoc(reviewRef, {
        likes: newLikes,
        likeCount: newLikes.length,
        updatedAt: new Date()
      });
      console.log('✅ Like agregado a la reseña:', reviewId);
      return { liked: true, likeCount: newLikes.length };
    }
  } catch (error) {
    console.error('❌ Error dando like a la reseña:', error);
    throw error;
  }
};

/**
 * Verificar si un usuario dio like a una reseña
 */
export const checkUserLike = (review, userId) => {
  if (!review || !userId) return false;
  const likes = review.likes || [];
  return likes.includes(userId);
};

/**
 * Formatear fecha para mostrar
 */
export const formatReviewDate = (timestamp) => {
  if (!timestamp) return 'Hoy';
  
  // Si es un timestamp de Firebase (objeto con seconds)
  if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
    const date = new Date(timestamp.seconds * 1000);
    if (!isNaN(date.getTime())) {
      return formatDateRelative(date);
    }
  }
  
  const date = new Date(timestamp);
  
  // Verificar si la fecha es válida
  if (isNaN(date.getTime())) {
    console.warn('Fecha inválida:', timestamp);
    return 'Hoy';
  }
  
  return formatDateRelative(date);
};

/**
 * Formatear fecha relativa
 */
const formatDateRelative = (date) => {
  const now = new Date();
  
  // Normalizar fechas para comparar solo día, mes y año
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const diffTime = Math.abs(now - date);
  const diffMinutes = Math.ceil(diffTime / (1000 * 60));
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

  // Verificar si es el mismo día (hoy)
  if (dateOnly.getTime() === today.getTime()) {
    if (diffMinutes < 1) {
      return 'Hace un momento';
    } else if (diffMinutes < 60) {
      return `Hace ${diffMinutes} minutos`;
    } else {
      return `Hoy a las ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    }
  }
  // Verificar si es ayer
  else if (dateOnly.getTime() === yesterday.getTime()) {
    return `Ayer a las ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  }
  // Para fechas más antiguas, mostrar día y mes
  else {
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return date.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } else if (diffDays < 365) {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
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
  likeReview,
  checkUserLike,
  reportReview,
  formatReviewDate
};
