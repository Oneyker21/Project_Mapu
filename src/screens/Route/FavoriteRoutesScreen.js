import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig.js';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../config/colors';

const FavoriteRoutesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [favoriteRoutes, setFavoriteRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFavoriteRoutes();
    }
  }, [user]);

  const loadFavoriteRoutes = async () => {
    try {
      setLoading(true);
      
      // Obtener rutas favoritas del usuario
      const favoritesDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = favoritesDoc.exists() ? favoritesDoc.data() : {};
      const favoriteRouteIds = userData.favoriteRoutes || [];
      
      if (favoriteRouteIds.length === 0) {
        setFavoriteRoutes([]);
        return;
      }

      // Obtener datos de las rutas favoritas
      const routesSnapshot = await getDocs(collection(db, 'routes'));
      const allRoutes = [];
      
      routesSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (favoriteRouteIds.includes(docSnap.id)) {
          allRoutes.push({
            id: docSnap.id,
            ...data
          });
        }
      });

      setFavoriteRoutes(allRoutes);
    } catch (error) {
      console.error('Error cargando rutas favoritas:', error);
      Alert.alert('Error', 'No se pudieron cargar las rutas favoritas');
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (routeId) => {
    try {
      if (!user) return;

      // Obtener usuario actual
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      const favoriteRoutes = userData.favoriteRoutes || [];

      // Remover de favoritos
      const updatedFavorites = favoriteRoutes.filter(id => id !== routeId);
      
      // Actualizar en Firebase
      await setDoc(doc(db, 'users', user.uid), {
        ...userData,
        favoriteRoutes: updatedFavorites
      }, { merge: true });

      // Actualizar estado local
      setFavoriteRoutes(prev => prev.filter(route => route.id !== routeId));
      
      Alert.alert('Éxito', 'Ruta removida de favoritos');
    } catch (error) {
      console.error('Error removiendo de favoritos:', error);
      Alert.alert('Error', 'No se pudo remover de favoritos');
    }
  };

  const formatRouteDate = (timestamp) => {
    if (!timestamp) return 'Fecha no disponible';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderRouteItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.routeItem}
      onPress={() => navigation.navigate('RouteDetail', { route: item })}
    >
      {/* Imagen de la ruta */}
      <View style={styles.routeImageContainer}>
        {item.photos && item.photos.length > 0 ? (
          <Image 
            source={{ uri: item.photos[0] }} 
            style={styles.routeImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.routeImagePlaceholder}>
            <Ionicons name="map" size={40} color="#9CA3AF" />
          </View>
        )}
        
        {/* Botón de favorito */}
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={() => removeFromFavorites(item.id)}
        >
          <Ionicons name="heart" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Información de la ruta */}
      <View style={styles.routeContent}>
        <Text style={styles.routeTitle} numberOfLines={2}>
          {item.title || 'Ruta sin título'}
        </Text>
        
        <Text style={styles.routeAuthor}>
          Por {item.author?.name || item.author?.displayName || 'Usuario'}
        </Text>

        <View style={styles.routeStats}>
          <View style={styles.routeStat}>
            <Ionicons name="location" size={16} color="#6B7280" />
            <Text style={styles.routeStatText}>
              {item.destinations?.length || 0} lugares
            </Text>
          </View>
          
          {item.budget && (
            <View style={styles.routeStat}>
              <Ionicons name="cash" size={16} color="#6B7280" />
              <Text style={styles.routeStatText}>
                {item.budget} {item.currency || 'USD'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.routeFooter}>
          <Text style={styles.routeDate}>
            {formatRouteDate(item.createdAt)}
          </Text>
          
          {item.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.ratingText}>
                {item.rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rutas Favoritas</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando rutas favoritas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rutas Favoritas</Text>
        <View style={styles.headerRight} />
      </View>

      {favoriteRoutes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No tienes rutas favoritas</Text>
          <Text style={styles.emptySubtitle}>
            Explora rutas recomendadas y marca tus favoritas con el corazón
          </Text>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => navigation.navigate('ExploreRoutes')}
          >
            <Text style={styles.exploreButtonText}>Explorar Rutas</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favoriteRoutes}
          renderItem={renderRouteItem}
          keyExtractor={(item) => item.id}
          style={styles.routesList}
          contentContainerStyle={styles.routesListContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
  },
  headerRight: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  routesList: {
    flex: 1,
  },
  routesListContent: {
    padding: 16,
    paddingBottom: 20,
  },
  routeItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeImageContainer: {
    position: 'relative',
  },
  routeImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  routeImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
  },
  routeContent: {
    padding: 16,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  routeAuthor: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  routeStats: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  routeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeStatText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  routeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeDate: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
  },
});

export default FavoriteRoutesScreen;
