import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from '../../database/FirebaseConfig.js';

// Colecciones de Firebase
const NOTIFICATIONS_COLLECTION = 'notificaciones';
const CENTERS_COLLECTION = 'centrosTuristicos';

/**
 * Crear una nueva notificación
 */
export const createNotification = async (notificationData) => {
  try {
    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      ...notificationData,
      createdAt: new Date(),
      read: false
    });

    console.log('✅ Notificación creada con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creando notificación:', error);
    throw error;
  }
};

/**
 * Crear notificación cuando se escribe una reseña
 */
export const createReviewNotification = async (reviewData, centerOwnerId) => {
  try {
    const notification = {
      type: 'review',
      title: 'Nueva reseña recibida',
      message: `${reviewData.userName} escribió una reseña de ${reviewData.rating} estrellas para tu centro`,
      recipientId: centerOwnerId,
      senderId: reviewData.userId,
      senderName: reviewData.userName,
      centerId: reviewData.centerId,
      centerName: reviewData.centerName,
      reviewId: reviewData.id || null,
      rating: reviewData.rating,
      data: {
        action: 'view_review',
        centerId: reviewData.centerId,
        reviewId: reviewData.id || null
      }
    };

    return await createNotification(notification);
  } catch (error) {
    console.error('❌ Error creando notificación de reseña:', error);
    throw error;
  }
};

/**
 * Obtener notificaciones de un usuario
 */
export const getUserNotifications = async (userId, limitCount = 50) => {
  try {
    if (!userId) {
      console.log('No se proporcionó userId');
      return [];
    }

    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const notifications = [];

    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`✅ Obtenidas ${notifications.length} notificaciones para usuario ${userId}`);
    return notifications;
  } catch (error) {
    console.error('❌ Error obteniendo notificaciones del usuario:', error);
    // Si es error de índice, retornar array vacío
    if (error.code === 'failed-precondition' || error.code === 'permission-denied' || error.message.includes('index')) {
      console.log('Error de Firebase (índice/permisos), retornando array vacío');
      return [];
    }
    throw error;
  }
};

/**
 * Marcar notificación como leída
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: new Date()
    });

    console.log('✅ Notificación marcada como leída:', notificationId);
    return true;
  } catch (error) {
    console.error('❌ Error marcando notificación como leída:', error);
    throw error;
  }
};

/**
 * Obtener el propietario de un centro
 */
export const getCenterOwner = async (centerId) => {
  try {
    const centerDoc = await getDoc(doc(db, CENTERS_COLLECTION, centerId));
    if (centerDoc.exists()) {
      const data = centerDoc.data();
      return {
        id: centerDoc.id,
        ownerId: data.userId || centerDoc.id, // El ID del documento es el ownerId
        ...data
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Error obteniendo propietario del centro:', error);
    throw error;
  }
};

/**
 * Formatear fecha de notificación
 */
export const formatNotificationDate = (timestamp) => {
  if (!timestamp) return 'Fecha desconocida';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'Ahora';
  } else if (diffMinutes < 60) {
    return `Hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
  } else if (diffHours < 24) {
    return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  } else if (diffDays < 7) {
    return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  } else {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
};

export default {
  createNotification,
  createReviewNotification,
  getUserNotifications,
  markNotificationAsRead,
  getCenterOwner,
  formatNotificationDate
};

