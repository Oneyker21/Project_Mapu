import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const WriteReviewModal = ({ 
  visible, 
  onClose, 
  center, 
  onSubmitReview, 
  userReview = null 
}) => {
  const { user: authUser } = useAuth();
  const [rating, setRating] = useState(userReview?.rating || 0);
  const [comment, setComment] = useState(userReview?.comment || '');
  const [submitting, setSubmitting] = useState(false);

  const handleStarPress = (starRating) => {
    setRating(starRating);
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => handleStarPress(i)}
          style={styles.starButton}
        >
          <Ionicons
            name={i <= rating ? 'star' : 'star-outline'}
            size={32}
            color={i <= rating ? '#F59E0B' : '#D1D5DB'}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Por favor selecciona una calificación');
      return;
    }

    if (comment.trim().length < 10) {
      Alert.alert('Error', 'Por favor escribe al menos 10 caracteres en tu comentario');
      return;
    }

    setSubmitting(true);
    try {
      const reviewData = {
        rating,
        comment: comment.trim(),
        userId: authUser.uid,
        userName: authUser.displayName || authUser.name || authUser.email?.split('@')[0] || 'Usuario',
        centerId: center.id,
        centerName: center.businessName || center.nombreNegocio,
        businessName: center.businessName || center.nombreNegocio,
        nombreNegocio: center.nombreNegocio || center.businessName,
        date: new Date().toISOString(),
        timestamp: Date.now(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await onSubmitReview(reviewData);
      
      Alert.alert(
        '¡Reseña enviada!', 
        'Tu reseña ha sido guardada exitosamente',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      console.error('Error enviando reseña:', error);
      Alert.alert('Error', 'No se pudo enviar la reseña. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingText = () => {
    const texts = {
      1: 'Muy malo',
      2: 'Malo',
      3: 'Regular',
      4: 'Bueno',
      5: 'Excelente'
    };
    return texts[rating] || 'Selecciona una calificación';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {userReview ? 'Editar Reseña' : 'Escribir Reseña'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Centro turístico */}
          <View style={styles.centerCard}>
            <Text style={styles.centerName}>{center?.businessName}</Text>
            <Text style={styles.centerCategory}>{center?.category}</Text>
            <Text style={styles.centerLocation}>{center?.department}</Text>
          </View>

          {/* Calificación */}
          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>Tu calificación</Text>
            <View style={styles.starsContainer}>
              {renderStars()}
            </View>
            <Text style={styles.ratingText}>{getRatingText()}</Text>
          </View>

          {/* Comentario */}
          <View style={styles.commentSection}>
            <Text style={styles.sectionTitle}>Tu comentario</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Cuéntanos sobre tu experiencia en este centro turístico..."
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.characterCount}>
              {comment.length}/500 caracteres
            </Text>
          </View>

          {/* Consejos */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>💡 Consejos para una buena reseña:</Text>
            <Text style={styles.tipText}>• Sé específico sobre tu experiencia</Text>
            <Text style={styles.tipText}>• Menciona qué te gustó más</Text>
            <Text style={styles.tipText}>• Sugiere mejoras si es necesario</Text>
            <Text style={styles.tipText}>• Sé honesto y constructivo</Text>
          </View>
        </ScrollView>

        {/* Botón de envío */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (rating === 0 || comment.trim().length < 10 || submitting) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={rating === 0 || comment.trim().length < 10 || submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Enviando...' : userReview ? 'Actualizar Reseña' : 'Enviar Reseña'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centerCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  centerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  centerCategory: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    marginBottom: 2,
  },
  centerLocation: {
    fontSize: 12,
    color: '#6B7280',
  },
  ratingSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  commentSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  tipsSection: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 4,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WriteReviewModal;
