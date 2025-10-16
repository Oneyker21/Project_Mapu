import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  where,
  increment 
} from 'firebase/firestore';
import { db } from '../../database/FirebaseConfig.js';

// Guardar una ruta
export const saveRoute = async (routeData) => {
  try {
    const docRef = await addDoc(collection(db, 'routes'), {
      ...routeData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error guardando ruta:', error);
    throw error;
  }
};

// Obtener rutas públicas (recomendadas)
export const getPublicRoutes = async (limitCount = 10) => {
  try {
    // Obtener todas las rutas sin filtros para evitar problemas de índice
    const q = query(
      collection(db, 'routes'),
      limit(limitCount * 3) // Obtener más para filtrar
    );
    
    const querySnapshot = await getDocs(q);
    const routes = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.isPublic === true) {
        routes.push({
          id: doc.id,
          ...data,
        });
      }
    });
    
    // Ordenar por fecha de creación (más recientes primero)
    const sortedRoutes = routes
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limitCount);
    
    return sortedRoutes;
  } catch (error) {
    console.error('Error obteniendo rutas públicas:', error);
    throw error;
  }
};

// Obtener rutas de un usuario específico
export const getUserRoutes = async (userId, includePrivate = false) => {
  try {
    let q;
    
    if (includePrivate) {
      q = query(
        collection(db, 'routes'),
        where('author.id', '==', userId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'routes'),
        where('author.id', '==', userId),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    const routes = [];
    
    querySnapshot.forEach((doc) => {
      routes.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    
    return routes;
  } catch (error) {
    console.error('Error obteniendo rutas del usuario:', error);
    throw error;
  }
};

// Incrementar contador de uso de una ruta
export const incrementRouteUsage = async (routeId) => {
  try {
    const routeRef = doc(db, 'routes', routeId);
    await updateDoc(routeRef, {
      usageCount: increment(1),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error incrementando uso de ruta:', error);
    throw error;
  }
};

// Dar like a una ruta
export const likeRoute = async (routeId, userId) => {
  try {
    const routeRef = doc(db, 'routes', routeId);
    const routeDoc = await getDoc(routeRef);
    
    if (routeDoc.exists()) {
      const routeData = routeDoc.data();
      const likes = routeData.likes || [];
      
      if (likes.includes(userId)) {
        // Quitar like
        await updateDoc(routeRef, {
          likes: likes.filter(id => id !== userId),
          updatedAt: new Date(),
        });
        return false; // Like removido
      } else {
        // Agregar like
        await updateDoc(routeRef, {
          likes: [...likes, userId],
          updatedAt: new Date(),
        });
        return true; // Like agregado
      }
    }
  } catch (error) {
    console.error('Error dando like a ruta:', error);
    throw error;
  }
};

// Agregar a favoritos
export const addToFavorites = async (routeId, userId) => {
  try {
    const routeRef = doc(db, 'routes', routeId);
    const userRef = doc(db, 'users', userId);
    
    // Obtener datos actuales
    const [routeDoc, userDoc] = await Promise.all([
      getDoc(routeRef),
      getDoc(userRef)
    ]);
    
    if (!routeDoc.exists()) {
      throw new Error('Ruta no encontrada');
    }

    const routeData = routeDoc.data();
    const userData = userDoc.exists() ? userDoc.data() : {};
    
    const routeFavorites = routeData.favorites || [];
    const userFavorites = userData.favoriteRoutes || [];
    
    const isCurrentlyFavorite = routeFavorites.includes(userId) && userFavorites.includes(routeId);
    
    if (isCurrentlyFavorite) {
      // Quitar de favoritos - actualizar ambos documentos
      await Promise.all([
        updateDoc(routeRef, {
          favorites: routeFavorites.filter(id => id !== userId),
          updatedAt: new Date(),
        }),
        setDoc(userRef, {
          ...userData,
          favoriteRoutes: userFavorites.filter(id => id !== routeId)
        }, { merge: true })
      ]);
      console.log('✅ Removido de favoritos:', routeId);
      return false; // Removido de favoritos
    } else {
      // Agregar a favoritos - actualizar ambos documentos
      await Promise.all([
        updateDoc(routeRef, {
          favorites: [...routeFavorites, userId],
          updatedAt: new Date(),
        }),
        setDoc(userRef, {
          ...userData,
          favoriteRoutes: [...userFavorites, routeId]
        }, { merge: true })
      ]);
      console.log('✅ Agregado a favoritos:', routeId);
      return true; // Agregado a favoritos
    }
  } catch (error) {
    console.error('Error agregando a favoritos:', error);
    throw error;
  }
};

// Verificar si un usuario ha dado like a una ruta
export const checkUserLike = (route, userId) => {
  return route.likes && route.likes.includes(userId);
};

// Verificar si un usuario tiene una ruta en favoritos
export const checkUserFavorite = async (route, userId) => {
  try {
    // Verificar en la ruta
    const routeFavorite = route.favorites && route.favorites.includes(userId);
    
    // También verificar en el usuario
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.exists() ? userDoc.data() : {};
    const userFavorites = userData.favoriteRoutes || [];
    const userFavorite = userFavorites.includes(route.id);
    
    // Devolver true si está en favoritos en cualquiera de los dos lugares
    return routeFavorite || userFavorite;
  } catch (error) {
    console.error('Error verificando favorito:', error);
    // Fallback a verificar solo en la ruta
    return route.favorites && route.favorites.includes(userId);
  }
};

// Obtener rutas destacadas para el Home (máximo 3)
export const getFeaturedRoutes = async () => {
  try {
    console.log('🔍 Buscando rutas en Firebase...');
    // Obtener todas las rutas sin filtros para evitar problemas de índice
    const q = query(
      collection(db, 'routes'),
      limit(20) // Obtener más para filtrar
    );
    
    const querySnapshot = await getDocs(q);
    console.log('📊 Total de documentos encontrados:', querySnapshot.size);
    
    const routes = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('📄 Documento:', doc.id, 'isPublic:', data.isPublic, 'title:', data.title);
      if (data.isPublic === true) {
        routes.push({
          id: doc.id,
          ...data,
        });
      }
    });
    
    console.log('✅ Rutas públicas encontradas:', routes.length);
    
    // Ordenar por fecha de creación primero, luego por popularidad
    const sortedRoutes = routes
      .sort((a, b) => {
        // Primero por fecha (más recientes primero)
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        const dateDiff = dateB.getTime() - dateA.getTime();
        
        if (Math.abs(dateDiff) > 7 * 24 * 60 * 60 * 1000) { // Más de 7 días de diferencia
          return dateDiff;
        }
        
        // Si son de fechas similares, ordenar por popularidad
        const aScore = (a.likes?.length || 0) + (a.usageCount || 0) * 2;
        const bScore = (b.likes?.length || 0) + (b.usageCount || 0) * 2;
        return bScore - aScore;
      })
      .slice(0, 3);
    
    console.log('🎯 Rutas destacadas finales:', sortedRoutes.length);
    return sortedRoutes;
  } catch (error) {
    console.error('❌ Error obteniendo rutas destacadas:', error);
    return []; // Retornar array vacío en caso de error
  }
};

// Obtener una ruta por ID
export const getRouteById = async (routeId) => {
  try {
    const routeRef = doc(db, 'routes', routeId);
    const routeDoc = await getDoc(routeRef);
    
    if (routeDoc.exists()) {
      return {
        id: routeDoc.id,
        ...routeDoc.data(),
      };
    } else {
      throw new Error('Ruta no encontrada');
    }
  } catch (error) {
    console.error('Error obteniendo ruta por ID:', error);
    throw error;
  }
};

// Formatear fecha de creación
export const formatRouteDate = (timestamp) => {
  if (!timestamp) return 'Fecha no disponible';
  
  try {
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'Fecha no disponible';
  }
};
