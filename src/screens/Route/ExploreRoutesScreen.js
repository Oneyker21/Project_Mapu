import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import colors, { withOpacity } from '../../config/colors';
import { db } from '../../../database/FirebaseConfig.js';
import { 
  getPublicRoutes, 
  likeRoute, 
  addToFavorites, 
  checkUserLike, 
  checkUserFavorite,
  formatRouteDate 
} from '../../services/routes';

const ExploreRoutesScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { fromGroup, groupId, groupName } = route?.params || {};
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favoritesState, setFavoritesState] = useState({});

  const loadRoutes = async () => {
    try {
      const publicRoutes = await getPublicRoutes(20);
      setRoutes(publicRoutes);
      
      // Verificar favoritos para todas las rutas
      if (user) {
        const favorites = {};
        for (const route of publicRoutes) {
          try {
            favorites[route.id] = await checkUserFavorite(route, user.uid);
          } catch (error) {
            console.error('Error verificando favorito para ruta:', route.id, error);
            favorites[route.id] = false;
          }
        }
        setFavoritesState(favorites);
      }
    } catch (error) {
      console.error('Error cargando rutas:', error);
      Alert.alert('Error', 'No se pudieron cargar las rutas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadRoutes();
  };

  const handleLikeRoute = async (routeId) => {
    try {
      const liked = await likeRoute(routeId, user.uid);
      setRoutes(prevRoutes => 
        prevRoutes.map(route => {
          if (route.id === routeId) {
            const newLikes = liked 
              ? [...(route.likes || []), user.uid]
              : (route.likes || []).filter(id => id !== user.uid);
            return { ...route, likes: newLikes };
          }
          return route;
        })
      );
    } catch (error) {
      console.error('Error dando like:', error);
      Alert.alert('Error', 'No se pudo dar like a la ruta');
    }
  };

  const handleAddToFavorites = async (routeId) => {
    try {
      const favorited = await addToFavorites(routeId, user.uid);
      
      // Actualizar estado de favoritos
      setFavoritesState(prev => ({
        ...prev,
        [routeId]: favorited
      }));
      
      // Actualizar rutas
      setRoutes(prevRoutes => 
        prevRoutes.map(route => {
          if (route.id === routeId) {
            const newFavorites = favorited 
              ? [...(route.favorites || []), user.uid]
              : (route.favorites || []).filter(id => id !== user.uid);
            return { ...route, favorites: newFavorites };
          }
          return route;
        })
      );
    } catch (error) {
      console.error('Error agregando a favoritos:', error);
      Alert.alert('Error', 'No se pudo agregar a favoritos');
    }
  };

  const addRouteToGroup = async (route) => {
    if (!fromGroup || !groupId) return;

    try {
      await updateDoc(doc(db, 'groups', groupId), {
        routes: arrayUnion(route.id)
      });

      Alert.alert(
        '¡Ruta Agregada!',
        `La ruta "${route.title}" ha sido agregada al grupo "${groupName}"`,
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
    } catch (error) {
      console.error('Error agregando ruta al grupo:', error);
      Alert.alert('Error', 'No se pudo agregar la ruta al grupo');
    }
  };

  const handleUseRoute = (route) => {
    if (fromGroup) {
      Alert.alert(
        'Agregar al Grupo',
        `¿Quieres agregar la ruta "${route.title}" al grupo "${groupName}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Agregar al Grupo', onPress: () => addRouteToGroup(route) }
        ]
      );
      return;
    }

    Alert.alert(
      'Usar Ruta',
      `¿Quieres usar la ruta "${route.title}"? Se abrirá la navegación con los destinos incluidos.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Usar Ruta',
          onPress: () => {
            // Convertir la ruta al formato esperado por RouteNavigationScreen
            const routeCenters = [
              { id: 'start', businessName: 'Tu Punto de Inicio', coordinate: route.startLocation, address: 'Punto de inicio', category: 'Inicio' },
              ...route.centers.map(center => ({
                id: center.id,
                businessName: center.nombreNegocio || center.businessName,
                category: center.categoriaNegocio || center.category,
                coordinate: center.coordinate,
                address: center.direccion || center.address
              }))
            ];

            navigation.navigate('RouteNavigation', {
              route: routeCenters,
              currentIndex: 0,
              userLocation: route.startLocation,
              transportMode: route.transportMode
            });
          }
        }
      ]
    );
  };

  const renderStars = (rating) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={12}
            color={star <= rating ? colors.warning : colors.text.muted}
          />
        ))}
      </View>
    );
  };

  const renderRouteCard = ({ item: route }) => {
    const isLiked = checkUserLike(route, user.uid);
    const isFavorited = favoritesState[route.id] || false;

    return (
      <TouchableOpacity 
        style={styles.routeCard}
        onPress={() => handleUseRoute(route)}
      >
        {/* Imagen de la ruta */}
        <View style={styles.routeImageContainer}>
          {route.photos && route.photos.length > 0 ? (
            <Image 
              source={{ uri: route.photos[0] }}
              style={styles.routeImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImageContainer}>
              <Ionicons name="map" size={40} color={colors.text.muted} />
            </View>
          )}
          
          {/* Overlay con información básica */}
          <View style={styles.imageOverlay}>
            <View style={styles.routeStats}>
              <View style={styles.statItem}>
                <Ionicons name="location" size={12} color="#FFFFFF" />
                <Text style={styles.statText}>{route.centers.length} destinos</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time" size={12} color="#FFFFFF" />
                <Text style={styles.statText}>
                  {route.transportMode === 'driving' ? 'En auto' : 
                   route.transportMode === 'walking' ? 'A pie' : 'En moto'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Información de la ruta */}
        <View style={styles.routeInfo}>
          <View style={styles.routeHeader}>
            <Text style={styles.routeTitle} numberOfLines={2}>
              {route.title}
            </Text>
            {renderStars(route.rating)}
          </View>

          <Text style={styles.routeDescription} numberOfLines={2}>
            {route.description || 'Sin descripción'}
          </Text>

          <View style={styles.routeDetails}>
            <View style={styles.routeMeta}>
              <Text style={styles.authorText}>
                Por {route.author.name}
              </Text>
              <Text style={styles.dateText}>
                {formatRouteDate(route.createdAt)}
              </Text>
            </View>

            <View style={styles.routeStats}>
              <View style={styles.statContainer}>
                <Ionicons name="heart" size={14} color={colors.error} />
                <Text style={styles.statCount}>{route.likes?.length || 0}</Text>
              </View>
              <View style={styles.statContainer}>
                <Ionicons name="people" size={14} color={colors.primary} />
                <Text style={styles.statCount}>{route.usageCount || 0}</Text>
              </View>
            </View>
          </View>

          {/* Botones de acción */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, isLiked && styles.likedButton]}
              onPress={() => handleLikeRoute(route.id)}
            >
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={16} 
                color={isLiked ? "#FFFFFF" : "#EF4444"} 
              />
              <Text style={[styles.actionButtonText, isLiked && styles.likedButtonText]}>
                Me gusta
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, isFavorited && styles.favoritedButton]}
              onPress={() => handleAddToFavorites(route.id)}
            >
              <Ionicons 
                name={isFavorited ? "bookmark" : "bookmark-outline"} 
                size={16} 
                color={isFavorited ? "#FFFFFF" : "#3B82F6"} 
              />
              <Text style={[styles.actionButtonText, isFavorited && styles.favoritedButtonText]}>
                Favorito
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.useButton]}
              onPress={() => handleUseRoute(route)}
            >
              <Ionicons 
                name={fromGroup ? "add-circle" : "navigate"} 
                size={16} 
                color="#FFFFFF" 
              />
              <Text style={[styles.actionButtonText, styles.useButtonText]}>
                {fromGroup ? 'Agregar' : 'Usar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.muted} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {fromGroup ? `Agregar Ruta a ${groupName}` : 'Rutas Recomendadas'}
          </Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando rutas...</Text>
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
          <Ionicons name="arrow-back" size={24} color={colors.text.muted} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {fromGroup ? `Agregar Ruta a ${groupName}` : 'Rutas Recomendadas'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={routes}
        keyExtractor={(item) => item.id}
        renderItem={renderRouteCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="map-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No hay rutas disponibles</Text>
            <Text style={styles.emptySubtitle}>
              Sé el primero en crear y compartir una ruta
            </Text>
          </View>
        }
      />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.muted,
  },
  listContainer: {
    padding: 16,
  },
  routeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: colors.shadow.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  routeImageContainer: {
    height: 200,
    position: 'relative',
  },
  routeImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
  },
  routeStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  routeInfo: {
    padding: 16,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
    marginRight: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  routeDescription: {
    fontSize: 14,
    color: colors.text.muted,
    lineHeight: 20,
    marginBottom: 12,
  },
  routeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeMeta: {
    flex: 1,
  },
  authorText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: colors.text.muted,
  },
  statContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 16,
  },
  statCount: {
    fontSize: 12,
    color: colors.text.muted,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: 6,
  },
  likedButton: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  favoritedButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  useButton: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  likedButtonText: {
    color: colors.text.primary,
  },
  favoritedButtonText: {
    color: colors.text.primary,
  },
  useButtonText: {
    color: colors.text.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ExploreRoutesScreen;
