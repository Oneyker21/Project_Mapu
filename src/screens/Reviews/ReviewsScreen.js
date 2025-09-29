import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

const ReviewsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isCenter, setIsCenter] = useState(false);

  useEffect(() => {
    // Simular datos del usuario
    setIsCenter(authUser?.role === 'centro_turistico' || authUser?.tipoUsuario === 'CentroTuristico');
  }, [authUser]);

  // Datos de ejemplo para reseñas
  const sampleReviews = isCenter ? [
    {
      id: 1,
      userName: 'María González',
      userAvatar: null,
      rating: 5,
      date: '2024-01-15',
      comment: 'Excelente lugar, muy recomendado. El servicio fue impecable y la atención al cliente excepcional.',
      centerName: 'Hotel Paradise'
    },
    {
      id: 2,
      userName: 'Carlos Rodríguez',
      userAvatar: null,
      rating: 4,
      date: '2024-01-12',
      comment: 'Buen servicio y atención. El lugar está muy bien mantenido y la comida deliciosa.',
      centerName: 'Hotel Paradise'
    },
    {
      id: 3,
      userName: 'Ana Martínez',
      userAvatar: null,
      rating: 5,
      date: '2024-01-10',
      comment: 'Increíble experiencia, volveré pronto. La vista es espectacular y el personal muy amable.',
      centerName: 'Hotel Paradise'
    },
    {
      id: 4,
      userName: 'Luis Fernández',
      userAvatar: null,
      rating: 4,
      date: '2024-01-08',
      comment: 'Muy buena experiencia en general. Recomiendo visitar este lugar.',
      centerName: 'Hotel Paradise'
    },
    {
      id: 5,
      userName: 'Sofia Herrera',
      userAvatar: null,
      rating: 3,
      date: '2024-01-05',
      comment: 'Buen lugar pero podría mejorar en algunos aspectos. El precio está bien.',
      centerName: 'Hotel Paradise'
    }
  ] : [
    {
      id: 1,
      centerName: 'Hotel Paradise',
      centerAvatar: null,
      rating: 4,
      date: '2024-01-15',
      comment: 'Muy bueno el hotel, excelente ubicación y servicio.',
      category: 'Hoteles'
    },
    {
      id: 2,
      centerName: 'Restaurante El Buen Sabor',
      centerAvatar: null,
      rating: 5,
      date: '2024-01-12',
      comment: 'Excelente comida y ambiente. Definitivamente regresaré.',
      category: 'Restaurantes'
    },
    {
      id: 3,
      centerName: 'Museo Nacional',
      centerAvatar: null,
      rating: 3,
      date: '2024-01-10',
      comment: 'Interesante pero un poco pequeño. Bueno para una visita rápida.',
      category: 'Museos'
    },
    {
      id: 4,
      centerName: 'Parque Central',
      centerAvatar: null,
      rating: 4,
      date: '2024-01-08',
      comment: 'Hermoso parque, perfecto para caminar y relajarse.',
      category: 'Parques'
    }
  ];

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
    const total = sampleReviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / sampleReviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    sampleReviews.forEach(review => {
      distribution[review.rating]++;
    });
    return distribution;
  };

  return (
    <View style={styles.container}>
      {/* Header que llega hasta los límites de la cámara */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Reseñas del Centro
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <SafeAreaView style={styles.safeAreaContent}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Estadísticas de reseñas */}
        <View style={styles.statsContainer}>
          <View style={styles.ratingOverview}>
            <Text style={styles.averageRating}>{getAverageRating()}</Text>
            <View style={styles.starsContainer}>
              {renderStars(Math.round(parseFloat(getAverageRating())))}
            </View>
            <Text style={styles.totalReviews}>
              {sampleReviews.length} {sampleReviews.length === 1 ? 'reseña' : 'reseñas'}
            </Text>
          </View>

          {/* Distribución de calificaciones */}
          <View style={styles.distributionContainer}>
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = getRatingDistribution()[rating];
              const percentage = (count / sampleReviews.length) * 100;
              return (
                <View key={rating} style={styles.ratingBar}>
                  <Text style={styles.ratingNumber}>{rating}</Text>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <View style={styles.barContainer}>
                    <View 
                      style={[
                        styles.bar, 
                        { width: `${percentage}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.ratingCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Lista de reseñas */}
        <View style={styles.reviewsContainer}>
          <Text style={styles.reviewsTitle}>
            {isCenter ? 'Reseñas de Visitantes' : 'Mis Reseñas'}
          </Text>
          
          {sampleReviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.avatarContainer}>
                    {isCenter ? (
                      review.userAvatar ? (
                        <Image source={{ uri: review.userAvatar }} style={styles.avatar} />
                      ) : (
                        <Ionicons name="person" size={20} color="#6B7280" />
                      )
                    ) : (
                      review.centerAvatar ? (
                        <Image source={{ uri: review.centerAvatar }} style={styles.avatar} />
                      ) : (
                        <Ionicons name="business" size={20} color="#6B7280" />
                      )
                    )}
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>
                      {isCenter ? review.userName : review.centerName}
                    </Text>
                    {!isCenter && (
                      <Text style={styles.category}>{review.category}</Text>
                    )}
                    <Text style={styles.date}>{review.date}</Text>
                  </View>
                </View>
                <View style={styles.ratingContainer}>
                  {renderStars(review.rating)}
                </View>
              </View>
              
              <Text style={styles.comment}>{review.comment}</Text>
              
              <View style={styles.reviewActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="thumbs-up-outline" size={16} color="#6B7280" />
                  <Text style={styles.actionText}>Útil</Text>
                </TouchableOpacity>
                {isCenter && (
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
                    <Text style={styles.actionText}>Responder</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
        </ScrollView>
      </SafeAreaView>
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
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 0,
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
    textAlign: 'right',
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
});

export default ReviewsScreen;
