import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { replyToReview, deleteReviewReply } from '../services/reviews';
import { colors } from '../config/colors';

const ReplyReviewModal = ({ 
  visible, 
  onClose, 
  review, 
  onReplySubmitted 
}) => {
  const { user: authUser } = useAuth();
  const [reply, setReply] = useState(review?.reply?.message || '');
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    if (reply.trim().length < 5) {
      Alert.alert('Error', 'La respuesta debe tener al menos 5 caracteres');
      return;
    }

    if (reply.trim().length > 500) {
      Alert.alert('Error', 'La respuesta no puede tener más de 500 caracteres');
      return;
    }

    setSubmitting(true);
    try {
      // Obtener el nombre del centro desde el contexto de la reseña
      const centerName = review?.centerName || review?.businessName || review?.nombreNegocio || 'Centro Turístico';
      
      const replyData = {
        message: reply.trim(),
        authorId: authUser.uid,
        authorName: centerName
      };

      await replyToReview(review.id, replyData);
      
      Alert.alert(
        '¡Respuesta enviada!', 
        'Tu respuesta ha sido guardada exitosamente',
        [{ text: 'OK', onPress: () => {
          onReplySubmitted();
          onClose();
        }}]
      );
    } catch (error) {
      console.error('Error enviando respuesta:', error);
      Alert.alert('Error', 'No se pudo enviar la respuesta. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = async () => {
    Alert.alert(
      'Eliminar Respuesta',
      '¿Estás seguro de que quieres eliminar esta respuesta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await deleteReviewReply(review.id);
              Alert.alert('Éxito', 'Respuesta eliminada correctamente');
              onReplySubmitted();
              onClose();
            } catch (error) {
              console.error('Error eliminando respuesta:', error);
              Alert.alert('Error', 'No se pudo eliminar la respuesta');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {review?.reply ? 'Editar Respuesta' : 'Responder a la Reseña'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Reseña original */}
              <View style={styles.originalReviewContainer}>
                <Text style={styles.originalReviewTitle}>Reseña Original:</Text>
                <View style={styles.originalReview}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{review?.userName}</Text>
                    <View style={styles.starsContainer}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= (review?.rating || 0) ? 'star' : 'star-outline'}
                          size={16}
                          color={colors.warning}
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{review?.comment}</Text>
                  <Text style={styles.reviewDate}>
                    {review?.date ? new Date(review.date).toLocaleDateString('es-ES') : ''}
                  </Text>
                </View>
              </View>

              {/* Campo de respuesta unificado */}
              <View style={styles.replySection}>
                <Text style={styles.sectionTitle}>
                  {review?.reply ? 'Editar tu Respuesta' : 'Tu Respuesta'}
                </Text>
                {review?.reply && (
                  <Text style={styles.replyInfo}>
                    {review.reply.updatedAt && review.reply.updatedAt !== review.reply.createdAt 
                      ? `Actualizado el ${formatReplyDate(review.reply.updatedAt)}`
                      : `Respondido el ${formatReplyDate(review.reply.createdAt)}`
                    }
                  </Text>
                )}
                <TextInput
                  style={styles.replyInput}
                  placeholder={review?.reply ? "Edita tu respuesta aquí..." : "Escribe tu respuesta aquí..."}
                  multiline
                  numberOfLines={6}
                  value={reply}
                  onChangeText={setReply}
                  maxLength={500}
                />
                <Text style={styles.charCount}>{reply.length}/500</Text>
              </View>

              {/* Botones de acción */}
              <View style={styles.actionButtons}>
                {review?.reply && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDeleteReply}
                    disabled={submitting}
                  >
                    <Ionicons name="trash" size={20} color={colors.text.primary} />
                    <Text style={styles.deleteButtonText}>Eliminar Respuesta</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.text.primary} />
                  ) : (
                    <>
                      <Ionicons 
                        name={review?.reply ? "checkmark" : "send"} 
                        size={20} 
                        color={colors.text.primary} 
                      />
                      <Text style={styles.submitButtonText}>
                        {review?.reply ? 'Actualizar Respuesta' : 'Enviar Respuesta'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 16,
  },
  originalReviewContainer: {
    marginBottom: 16,
  },
  originalReviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  originalReview: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: colors.text.muted,
  },
  currentReplyContainer: {
    marginBottom: 16,
  },
  currentReplyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
    marginBottom: 8,
  },
  currentReply: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.success,
  },
  currentReplyText: {
    fontSize: 14,
    color: colors.success,
    lineHeight: 20,
    marginBottom: 8,
  },
  currentReplyDate: {
    fontSize: 12,
    color: colors.success,
  },
  replySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  replyInfo: {
    fontSize: 12,
    color: colors.text.muted,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  replyInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text.primary,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: colors.text.muted,
    textAlign: 'right',
    marginTop: 4,
  },
  actionButtons: {
    gap: 12,
  },
  submitButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  submitButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  deleteButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ReplyReviewModal;

