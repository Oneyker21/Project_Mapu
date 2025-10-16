import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import WriteReviewModal from '../../components/WriteReviewModal';
import ReplyReviewModal from '../../components/ReplyReviewModal';
import colors, { withOpacity } from '../../config/colors';
import { 
  getCenterReviews, 
  getUserReviews, 
  getCenterReviewStats,
  getUserReviewForCenter,
  deleteReview,
  saveReview,
  updateReview,
  replyToReview,
  deleteReviewReply,
  likeReview,
  checkUserLike,
  reportReview,
  formatReviewDate
} from '../../services/reviews';

const ReviewsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isCenter, setIsCenter] = useState(false);
  
  // Verificar si viene de una ruta
  const fromRoute = route.params?.fromRoute || false;
  const routeData = route.params?.routeData || null;
  const [reviews, setReviews] = useState([]);
  
  // Función para manejar navegación de regreso
  const handleBackNavigation = () => {
    if (fromRoute && routeData) {
      // Regresar a la navegación de ruta
      navigation.navigate('RouteNavigation', routeData);
    } else {
      // Navegación normal
      navigation.goBack();
    }
  };
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [userReview, setUserReview] = useState(null);

  // Obtener parámetros de navegación
  const center = route?.params?.center;

  useEffect(() => {
    setIsCenter(authUser?.role === 'centro_turistico' || authUser?.tipoUsuario === 'CentroTuristico');
    
    if (center) {
      setSelectedCenter(center);
      loadCenterReviews();
    } else {
      loadUserReviews();
    }
  }, [authUser, center]);

  const loadCenterReviews = async () => {
    if (!center?.id) return;
    
    setLoading(true);
    try {
      const [reviewsData, stats] = await Promise.all([
        getCenterReviews(center.id),
        getCenterReviewStats(center.id)
      ]);

      setReviews(reviewsData);
      setReviewStats(stats);

      // Verificar si el usuario actual ya escribió una reseña
      if (authUser?.uid) {
        const userReviewData = await getUserReviewForCenter(authUser.uid, center.id);
        console.log('User review data loaded:', userReviewData);
        setUserReview(userReviewData);
      }
    } catch (error) {
      console.error('Error cargando reseñas del centro:', error);
      // Solo mostrar alerta si no es un error de índice/permisos
      if (error.code !== 'failed-precondition' && error.code !== 'permission-denied') {
        Alert.alert('Error', 'No se pudieron cargar las reseñas');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUserReviews = async () => {
    if (!authUser?.uid) return;
    
    setLoading(true);
    try {
      const reviewsData = await getUserReviews(authUser.uid);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error cargando reseñas del usuario:', error);
      // Solo mostrar alerta si no es un error de índice/permisos
      if (error.code !== 'failed-precondition' && error.code !== 'permission-denied') {
        Alert.alert('Error', 'No se pudieron cargar tus reseñas');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (center) {
      await loadCenterReviews();
    } else {
      await loadUserReviews();
    }
    setRefreshing(false);
  };

  const handleWriteReview = () => {
    if (!authUser) {
      Alert.alert('Iniciar sesión', 'Necesitas iniciar sesión para escribir una reseña');
      return;
    }
    setShowWriteModal(true);
  };

  const handleEditReview = (review = null) => {
    // Si se pasa una reseña específica, usarla; sino usar userReview
    const reviewToEdit = review || userReview;
    if (reviewToEdit) {
      setEditingReview(reviewToEdit);
      setShowWriteModal(true);
    }
  };

  const handleDeleteReview = (review = null) => {
    // Usar la reseña pasada como parámetro o userReview como fallback
    const reviewToDelete = review || userReview;
    
    if (!reviewToDelete) {
      Alert.alert('Error', 'No se encontró la reseña a eliminar');
      return;
    }
    
    Alert.alert(
      '🗑️ Eliminar Reseña',
      `¿Estás seguro de que deseas eliminar tu reseña sobre "${reviewToDelete.centerName || reviewToDelete.businessName || 'este centro'}"?\n\nEsta acción no se puede deshacer y se perderá permanentemente tu calificación y comentario.`,
      [
        { 
          text: '❌ Cancelar', 
          style: 'cancel',
          onPress: () => console.log('Eliminación cancelada')
        },
        {
          text: '🗑️ Eliminar Definitivamente',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Eliminando reseña:', reviewToDelete);
              await deleteReview(reviewToDelete.id, reviewToDelete.centerId, reviewToDelete.rating);
              
              // Limpiar userReview si es la reseña del usuario
              if (userReview && userReview.id === reviewToDelete.id) {
                setUserReview(null);
              }
              
              // Recargar reseñas
              if (center) {
                await loadCenterReviews();
              } else {
                await loadUserReviews();
              }
              
              Alert.alert(
                '✅ Reseña Eliminada', 
                'Tu reseña ha sido eliminada correctamente.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Error eliminando reseña:', error);
              Alert.alert(
                '❌ Error', 
                'No se pudo eliminar la reseña. Por favor, intenta de nuevo.',
                [{ text: 'OK' }]
              );
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  const handleSubmitReview = async (reviewData) => {
    try {
      // Determinar si se está editando una reseña existente
      const isEditing = editingReview || userReview;
      const reviewToUpdate = editingReview || userReview;
      
      console.log('Submit review - isEditing:', isEditing);
      console.log('Submit review - editingReview:', editingReview);
      console.log('Submit review - userReview:', userReview);
      console.log('Submit review - reviewToUpdate:', reviewToUpdate);
      
      if (isEditing && reviewToUpdate) {
        // Actualizar reseña existente
        console.log('Updating existing review with ID:', reviewToUpdate.id);
        await updateReview(reviewToUpdate.id, reviewData);
        
        // Actualizar el estado local inmediatamente
        const updatedReview = { ...reviewToUpdate, ...reviewData, updatedAt: new Date() };
        
        if (editingReview) {
          setEditingReview(updatedReview);
          // Actualizar también en la lista de reseñas
          setReviews(prevReviews =>
            prevReviews.map(review =>
              review.id === reviewToUpdate.id ? updatedReview : review
            )
          );
        } else {
          setUserReview(updatedReview);
        }
      } else {
        // Crear nueva reseña
        console.log('Creating new review');
        const reviewId = await saveReview(reviewData);
        const newReview = { ...reviewData, id: reviewId, createdAt: new Date() };
        setUserReview(newReview);
        
        // Agregar a la lista de reseñas inmediatamente
        setReviews(prevReviews => [newReview, ...prevReviews]);
      }
      
      // Recargar solo las estadísticas, no todas las reseñas
      if (center) {
        const stats = await getCenterReviewStats(center.id);
        setReviewStats(stats);
      }
      
      setShowWriteModal(false);
      setEditingReview(null); // Limpiar estado de edición
    } catch (error) {
      console.error('Error in handleSubmitReview:', error);
      throw error; // Re-lanzar para que el modal maneje el error
    }
  };

  const handleReplyToReview = (review) => {
    setSelectedReview(review);
    setShowReplyModal(true);
  };

  const formatReplyDate = (timestamp) => {
    if (!timestamp) return 'Fecha no disponible';
    
    // Si es un timestamp de Firebase (objeto con seconds)
    if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      if (!isNaN(date.getTime())) {
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
    
    const date = new Date(timestamp);
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      console.warn('Fecha inválida:', timestamp);
      return 'Fecha no disponible';
    }
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleReplySubmitted = async () => {
    // Recargar las reseñas para mostrar la respuesta
    if (center) {
      await loadCenterReviews();
    }
  };

  const handleLikeReview = async (reviewId) => {
    if (!authUser?.uid) {
      Alert.alert('Iniciar sesión', 'Necesitas iniciar sesión para dar like a una reseña');
      return;
    }

    try {
      const result = await likeReview(reviewId, authUser.uid);
      
      // Actualizar la reseña en el estado local
      setReviews(prevReviews => 
        prevReviews.map(review => 
          review.id === reviewId 
            ? { ...review, likes: result.liked ? [...(review.likes || []), authUser.uid] : (review.likes || []).filter(id => id !== authUser.uid), likeCount: result.likeCount }
            : review
        )
      );

      // También actualizar userReview si es la reseña del usuario
      if (userReview && userReview.id === reviewId) {
        setUserReview(prev => ({
          ...prev,
          likes: result.liked ? [...(prev.likes || []), authUser.uid] : (prev.likes || []).filter(id => id !== authUser.uid),
          likeCount: result.likeCount
        }));
      }
    } catch (error) {
      console.error('Error dando like a la reseña:', error);
      Alert.alert('Error', 'No se pudo dar like a la reseña');
    }
  };

  const handleReportReview = async (review) => {
    Alert.alert(
      'Reportar Reseña',
      '¿Por qué quieres reportar esta reseña?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Contenido inapropiado',
          onPress: () => reportReviewAction(review, 'Contenido inapropiado')
        },
        {
          text: 'Información falsa',
          onPress: () => reportReviewAction(review, 'Información falsa')
        },
        {
          text: 'Spam',
          onPress: () => reportReviewAction(review, 'Spam')
        },
        {
          text: 'Otro motivo',
          onPress: () => reportReviewAction(review, 'Otro motivo')
        }
      ]
    );
  };

  const reportReviewAction = async (review, reason) => {
    try {
      await reportReview(
        review.id, 
        reason, 
        authUser.uid, 
        isCenter ? 'center' : 'user'
      );
      
      Alert.alert(
        'Reseña Reportada',
        'La reseña ha sido reportada. Nuestro equipo la revisará pronto.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error reportando reseña:', error);
      Alert.alert('Error', 'No se pudo reportar la reseña');
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={16}
          color={i <= rating ? '#F59E0B' : '#D1D5DB'}
        />
      );
    }
    return stars;
  };


  const getAverageRating = () => {
    return reviewStats.averageRating.toFixed(1);
  };

  const getRatingDistribution = () => {
    return reviewStats.ratingDistribution;
  };

  const renderRatingBar = (rating, count, total) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    
              return (
                <View key={rating} style={styles.ratingBar}>
                  <Text style={styles.ratingNumber}>{rating}</Text>
                  <View style={styles.barContainer}>
          <View style={[styles.bar, { width: `${percentage}%` }]} />
                  </View>
                  <Text style={styles.ratingCount}>{count}</Text>
                </View>
              );
  };

  const renderReviewItem = (review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.avatarContainer}>
            {center ? (
              // Para reseñas de centros: mostrar avatar del usuario
                      review.userAvatar ? (
                        <Image source={{ uri: review.userAvatar }} style={styles.avatar} />
                      ) : (
                        <Ionicons name="person" size={20} color={colors.text.muted} />
                      )
                    ) : (
              // Para reseñas del usuario: mostrar avatar del centro
                      review.centerAvatar ? (
                        <Image source={{ uri: review.centerAvatar }} style={styles.avatar} />
                      ) : (
                        <Ionicons name="business" size={20} color={colors.text.muted} />
                      )
                    )}
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>
                      {center ? (review.userName || 'Usuario') : (review.centerName || review.businessName || review.nombreNegocio || 'Centro')}
                    </Text>
            {!center && (
                      <Text style={styles.category}>{review.category}</Text>
                    )}
            <Text style={styles.date}>{formatReviewDate(review.createdAt || review.timestamp || review.date)}</Text>
                  </View>
                </View>
                <View style={styles.ratingContainer}>
                  {renderStars(review.rating)}
                </View>
              </View>
              
              <Text style={styles.comment}>{review.comment}</Text>
              
              {/* Respuesta del centro */}
              {review.reply && (
                <View style={styles.replyContainer}>
                  <View style={styles.replyHeader}>
                    <Text style={styles.replyAuthor}>{review.reply.authorName}</Text>
                    <Text style={styles.replyDate}>
                      {formatReplyDate(review.reply.updatedAt || review.reply.createdAt)}
                    </Text>
                  </View>
                  <Text style={styles.replyText}>{review.reply.message}</Text>
                </View>
              )}
              
              {/* Botones de acción organizados */}
              <View style={styles.actionsContainer}>
                {/* Primera fila: Botón de like (siempre visible para usuarios autenticados) */}
                {authUser && (
                  <View style={styles.likeContainer}>
                    <TouchableOpacity
                      style={styles.likeButton}
                      onPress={() => handleLikeReview(review.id)}
                    >
                      <Ionicons 
                        name={checkUserLike(review, authUser.uid) ? "heart" : "heart-outline"} 
                        size={18} 
                        color={checkUserLike(review, authUser.uid) ? "#EF4444" : "#6B7280"} 
                      />
                      <Text style={[
                        styles.likeButtonText,
                        { color: checkUserLike(review, authUser.uid) ? "#EF4444" : "#6B7280" }
                      ]}>
                        Me gusta {review.likeCount || 0}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Segunda fila: Botones específicos según el tipo de usuario */}
                <View style={styles.actionsRow}>
                  {/* Botones para el propietario de la reseña */}
                  {review.userId === authUser?.uid && (
                    <>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.editButton]} 
                        onPress={() => handleEditReview(review)}
                      >
                        <Ionicons name="create-outline" size={16} color={colors.primary} />
                        <Text style={[styles.actionText, { color: colors.primary }]}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.deleteButton]} 
                        onPress={() => handleDeleteReview(review)}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                        <Text style={[styles.actionText, { color: colors.error }]}>Eliminar</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Botón para responder (solo para centros turísticos) */}
                  {center && isCenter && authUser && review.userId !== authUser.uid && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.replyButton]}
                      onPress={() => handleReplyToReview(review)}
                    >
                      <Ionicons name="chatbubble-outline" size={16} color={colors.success} />
                      <Text style={[styles.actionText, { color: '#10B981' }]}>
                        {review.reply ? 'Editar Respuesta' : 'Responder'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Botón para reportar (para usuarios que no son el autor) */}
                  {authUser && review.userId !== authUser.uid && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.reportButton]}
                      onPress={() => handleReportReview(review)}
                    >
                      <Ionicons name="flag-outline" size={16} color={colors.warning} />
                      <Text style={[styles.actionText, { color: '#F59E0B' }]}>Reportar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name={center ? "star-outline" : "document-text-outline"} 
        size={64} 
        color="#9CA3AF" 
      />
      <Text style={styles.emptyTitle}>
        {center ? 'No hay reseñas aún' : 'No has escrito reseñas'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {center 
          ? 'Sé el primero en escribir una reseña sobre este centro turístico'
          : 'Comienza a escribir reseñas sobre los centros que visites'
        }
      </Text>
      {center && authUser && !isCenter && (
        <TouchableOpacity style={styles.writeReviewButton} onPress={handleWriteReview}>
          <Text style={styles.writeReviewButtonText}>Escribir Reseña</Text>
        </TouchableOpacity>
      )}
      {center && isCenter && (
        <View style={styles.centerMessageContainer}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <Text style={styles.centerMessageText}>
            Como centro turístico, puedes responder a las reseñas para interactuar con tus visitantes.
          </Text>
        </View>
      )}
    </View>
  );

  const renderUserReviewSection = () => {
    if (!center || !authUser || isCenter) return null;

    return (
      <View style={styles.userReviewSection}>
        <Text style={styles.sectionTitle}>Tu Reseña</Text>
        {userReview ? (
          <View style={styles.userReviewCard}>
            <View style={styles.userReviewHeader}>
              <View style={styles.ratingContainer}>
                {renderStars(userReview.rating)}
              </View>
              <View style={styles.userReviewActions}>
                <TouchableOpacity style={styles.editButton} onPress={handleEditReview}>
                  <Ionicons name="create-outline" size={16} color={colors.primary} />
                  <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteReview}>
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                  </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.userReviewComment}>{userReview.comment}</Text>
            <Text style={styles.userReviewDate}>
              Escrita el {formatReviewDate(userReview.timestamp)}
            </Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.writeFirstReviewButton} onPress={handleWriteReview}>
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.writeFirstReviewText}>Escribir tu reseña</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackNavigation}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {center ? 'Reseñas del Centro' : 'Mis Reseñas'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando reseñas...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {center ? 'Reseñas del Centro' : 'Mis Reseñas'}
        </Text>
        {fromRoute ? (
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={() => {
              if (routeData) {
                navigation.navigate('RouteNavigation', {
                  ...routeData,
                  currentDestinationIndex: routeData.currentDestinationIndex + 1
                });
              }
            }}
          >
            <Text style={styles.continueButtonText}>Continuar Ruta</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <SafeAreaView style={styles.safeAreaContent}>
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Estadísticas de reseñas - Solo para centros */}
          {center && (
            <View style={styles.statsContainer}>
              <View style={styles.ratingOverview}>
                <Text style={styles.averageRating}>{getAverageRating()}</Text>
                <View style={styles.starsContainer}>
                  {renderStars(Math.round(reviewStats.averageRating))}
                </View>
                <Text style={styles.totalReviews}>
                  {reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'reseña' : 'reseñas'}
                </Text>
              </View>

              {/* Distribución de calificaciones */}
              {reviewStats.totalReviews > 0 && (
                <View style={styles.distributionContainer}>
                  <Text style={styles.distributionTitle}>Distribución de calificaciones</Text>
                  {[5, 4, 3, 2, 1].map(rating => 
                    renderRatingBar(rating, getRatingDistribution()[rating], reviewStats.totalReviews)
                  )}
                </View>
              )}
            </View>
          )}

          {/* Sección de reseña del usuario */}
          {renderUserReviewSection()}

          {/* Lista de reseñas */}
          <View style={styles.reviewsContainer}>
            <Text style={styles.reviewsTitle}>
              {center ? 'Reseñas de Visitantes' : 'Mis Reseñas'}
            </Text>
            
            {reviews.length > 0 ? (
              reviews.map(renderReviewItem)
            ) : (
              renderEmptyState()
            )}
        </View>
        </ScrollView>
      </SafeAreaView>

      {/* Modal para escribir reseñas */}
      {(selectedCenter || editingReview) && (
        <WriteReviewModal
          visible={showWriteModal}
          onClose={() => {
            setShowWriteModal(false);
            setEditingReview(null);
          }}
          center={editingReview ? { 
            id: editingReview.centerId,
            businessName: editingReview.centerName,
            nombreNegocio: editingReview.centerName
          } : selectedCenter}
          onSubmitReview={handleSubmitReview}
          userReview={editingReview || userReview}
        />
      )}

      {/* Modal para responder a reseñas */}
      {selectedReview && (
        <ReplyReviewModal
          visible={showReplyModal}
          onClose={() => setShowReplyModal(false)}
          review={selectedReview}
          onReplySubmitted={handleReplySubmitted}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeAreaContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 12,
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text.muted,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: colors.shadow.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingOverview: {
    alignItems: 'center',
    marginBottom: 20,
  },
  averageRating: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  totalReviews: {
    fontSize: 14,
    color: colors.text.muted,
  },
  distributionContainer: {
    marginTop: 16,
  },
  distributionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    width: 20,
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  bar: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: 4,
  },
  ratingCount: {
    fontSize: 12,
    color: colors.text.muted,
    width: 20,
  },
  userReviewSection: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: colors.shadow.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  userReviewCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userReviewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: withOpacity(colors.primary, 0.1),
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: withOpacity(colors.error, 0.1),
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: 12,
    color: colors.error,
    marginLeft: 4,
    fontWeight: '500',
  },
  userReviewComment: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
    marginBottom: 8,
  },
  userReviewDate: {
    fontSize: 12,
    color: colors.text.muted,
  },
  writeFirstReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  writeFirstReviewText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  reviewsContainer: {
    padding: 16,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: colors.shadow.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    color: colors.text.muted,
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: colors.text.muted,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  comment: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionsContainer: {
    marginTop: 12,
  },
  likeContainer: {
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  likeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  writeReviewButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  writeReviewButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  centerMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withOpacity(colors.primary, 0.1),
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    marginTop: 16,
  },
  centerMessageText: {
    flex: 1,
    fontSize: 14,
    color: colors.primary,
    marginLeft: 12,
    lineHeight: 20,
  },
  replyContainer: {
    backgroundColor: withOpacity(colors.success, 0.1),
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  replyDate: {
    fontSize: 12,
    color: colors.success,
  },
  replyText: {
    fontSize: 14,
    color: colors.success,
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  continueButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: withOpacity(colors.primary, 0.1),
    borderColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: withOpacity(colors.error, 0.1),
    borderColor: colors.error,
  },
  replyButton: {
    backgroundColor: withOpacity(colors.success, 0.1),
    borderColor: colors.success,
  },
  reportButton: {
    backgroundColor: withOpacity(colors.warning, 0.1),
    borderColor: colors.warning,
  },
});

export default ReviewsScreen;