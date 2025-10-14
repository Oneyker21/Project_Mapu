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
  formatReviewDate
} from '../../services/reviews';

const ReviewsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isCenter, setIsCenter] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
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

  const handleEditReview = () => {
    if (userReview) {
      setShowWriteModal(true);
    }
  };

  const handleDeleteReview = () => {
    if (!userReview) return;
    
    Alert.alert(
      'Eliminar reseña',
      '¿Estás seguro de que quieres eliminar tu reseña? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReview(userReview.id, userReview.centerId, userReview.rating);
              setUserReview(null);
              await loadCenterReviews(); // Recargar para actualizar estadísticas
              Alert.alert('Éxito', 'Reseña eliminada correctamente');
            } catch (error) {
              console.error('Error eliminando reseña:', error);
              Alert.alert('Error', 'No se pudo eliminar la reseña');
            }
          }
        }
      ]
    );
  };

  const handleSubmitReview = async (reviewData) => {
    try {
      if (userReview) {
        // Actualizar reseña existente
        await updateReview(userReview.id, reviewData);
        setUserReview({ ...userReview, ...reviewData });
      } else {
        // Crear nueva reseña
        await saveReview(reviewData);
        setUserReview(reviewData);
      }
      
      await loadCenterReviews(); // Recargar para actualizar estadísticas
      setShowWriteModal(false);
    } catch (error) {
      throw error; // Re-lanzar para que el modal maneje el error
    }
  };

  const handleReplyToReview = (review) => {
    setSelectedReview(review);
    setShowReplyModal(true);
  };

  const handleReplySubmitted = async () => {
    // Recargar las reseñas para mostrar la respuesta
    if (center) {
      await loadCenterReviews();
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
                        <Ionicons name="person" size={20} color="#6B7280" />
                      )
                    ) : (
              // Para reseñas del usuario: mostrar avatar del centro
                      review.centerAvatar ? (
                        <Image source={{ uri: review.centerAvatar }} style={styles.avatar} />
                      ) : (
                        <Ionicons name="business" size={20} color="#6B7280" />
                      )
                    )}
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>
              {center ? review.userName : review.centerName}
                    </Text>
            {!center && (
                      <Text style={styles.category}>{review.category}</Text>
                    )}
            <Text style={styles.date}>{formatReviewDate(review.timestamp)}</Text>
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
                      {formatReviewDate(review.reply.createdAt)}
                    </Text>
                  </View>
                  <Text style={styles.replyText}>{review.reply.message}</Text>
                </View>
              )}
              
              {/* Botones de acción */}
              {!center && review.userId === authUser?.uid && (
                <View style={styles.reviewActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={handleEditReview}>
                    <Ionicons name="create-outline" size={16} color="#3B82F6" />
                    <Text style={[styles.actionText, { color: '#3B82F6' }]}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={handleDeleteReview}>
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    <Text style={[styles.actionText, { color: '#EF4444' }]}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Botón para responder (solo para centros turísticos) */}
              {center && isCenter && authUser && (
                <TouchableOpacity
                  style={styles.replyButton}
                  onPress={() => handleReplyToReview(review)}
                >
                  <Ionicons name="chatbubble" size={16} color="#3B82F6" />
                  <Text style={styles.replyButtonText}>
                    {review.reply ? 'Editar Respuesta' : 'Responder'}
                  </Text>
                </TouchableOpacity>
              )}
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
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
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
                  <Ionicons name="create-outline" size={16} color="#3B82F6" />
                  <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteReview}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
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
            <Ionicons name="add-circle-outline" size={24} color="#3B82F6" />
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
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {center ? 'Reseñas del Centro' : 'Mis Reseñas'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
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
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {center ? center.businessName : 'Mis Reseñas'}
        </Text>
        <View style={styles.headerSpacer} />
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
      {selectedCenter && (
        <WriteReviewModal
          visible={showWriteModal}
          onClose={() => setShowWriteModal(false)}
          center={selectedCenter}
          onSubmitReview={handleSubmitReview}
          userReview={userReview}
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
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
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
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
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
    color: '#000000',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  totalReviews: {
    fontSize: 14,
    color: '#6B7280',
  },
  distributionContainer: {
    marginTop: 16,
  },
  distributionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
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
    color: '#000000',
    width: 20,
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  bar: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  ratingCount: {
    fontSize: 12,
    color: '#6B7280',
    width: 20,
  },
  userReviewSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  userReviewCard: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    backgroundColor: '#EBF4FF',
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 12,
    color: '#3B82F6',
    marginLeft: 4,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#EF4444',
    marginLeft: 4,
    fontWeight: '500',
  },
  userReviewComment: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  userReviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  writeFirstReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  writeFirstReviewText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 8,
  },
  reviewsContainer: {
    padding: 16,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
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
    backgroundColor: '#F3F4F6',
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
    color: '#000000',
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  comment: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  writeReviewButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  writeReviewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  centerMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginTop: 16,
  },
  centerMessageText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 12,
    lineHeight: 20,
  },
  replyContainer: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
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
    color: '#047857',
  },
  replyDate: {
    fontSize: 12,
    color: '#065F46',
  },
  replyText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  replyButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default ReviewsScreen;