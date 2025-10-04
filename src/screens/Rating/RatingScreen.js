import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig';

const RatingScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const { reservation } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  useEffect(() => {
    checkExistingRating();
  }, []);

  const checkExistingRating = async () => {
    try {
      const ratingsRef = collection(db, 'calificaciones');
      const q = query(
        ratingsRef,
        where('reservacionId', '==', reservation.id),
        where('turistaId', '==', authUser?.uid)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const existingRating = querySnapshot.docs[0].data();
        setRating(existingRating.calificacion);
        setComment(existingRating.comentario || '');
        setHasRated(true);
      }
    } catch (error) {
      console.error('Error verificando calificación:', error);
    }
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Por favor selecciona una calificación');
      return;
    }

    try {
      setLoading(true);
      
      const ratingData = {
        reservacionId: reservation.id,
        turistaId: authUser?.uid,
        centroId: reservation.centroId,
        servicioId: reservation.servicioId,
        calificacion: rating,
        comentario: comment.trim(),
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      };

      if (hasRated) {
        // Actualizar calificación existente
        const ratingsRef = collection(db, 'calificaciones');
        const q = query(
          ratingsRef,
          where('reservacionId', '==', reservation.id),
          where('turistaId', '==', authUser?.uid)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const ratingDoc = querySnapshot.docs[0];
          await updateDoc(doc(db, 'calificaciones', ratingDoc.id), {
            calificacion: rating,
            comentario: comment.trim(),
            fechaActualizacion: new Date().toISOString()
          });
        }
      } else {
        // Crear nueva calificación
        await addDoc(collection(db, 'calificaciones'), ratingData);
      }

      Alert.alert(
        'Éxito', 
        hasRated ? 'Calificación actualizada correctamente' : 'Calificación enviada correctamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error enviando calificación:', error);
      Alert.alert('Error', 'No se pudo enviar la calificación');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            style={styles.starButton}
            onPress={() => setRating(star)}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={40}
              color={star <= rating ? '#F59E0B' : '#D1D5DB'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getRatingText = () => {
    switch (rating) {
      case 1: return 'Muy malo';
      case 2: return 'Malo';
      case 3: return 'Regular';
      case 4: return 'Bueno';
      case 5: return 'Excelente';
      default: return 'Selecciona una calificación';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calificar Servicio</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.reservationInfo}>
          <Text style={styles.reservationTitle}>{reservation.servicioNombre}</Text>
          <Text style={styles.reservationCenter}>{reservation.centroNombre}</Text>
          <Text style={styles.reservationDate}>
            {reservation.fecha} a las {reservation.hora}
          </Text>
        </View>

        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>¿Cómo calificarías este servicio?</Text>
          {renderStars()}
          <Text style={styles.ratingText}>{getRatingText()}</Text>
        </View>

        <View style={styles.commentSection}>
          <Text style={styles.sectionTitle}>Comentarios (Opcional)</Text>
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Comparte tu experiencia..."
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.characterCount}>{comment.length}/500</Text>
        </View>

        <View style={styles.criteriaSection}>
          <Text style={styles.sectionTitle}>Criterios de Calificación</Text>
          
          <View style={styles.criteriaItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.criteriaText}>Calidad del servicio</Text>
          </View>
          
          <View style={styles.criteriaItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.criteriaText}>Atención al cliente</Text>
          </View>
          
          <View style={styles.criteriaItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.criteriaText}>Cumplimiento de horarios</Text>
          </View>
          
          <View style={styles.criteriaItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.criteriaText}>Relación calidad-precio</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
          onPress={handleRatingSubmit}
          disabled={rating === 0 || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.submitButtonText}>
              {hasRated ? 'Actualizar Calificación' : 'Enviar Calificación'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  headerRight: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  reservationInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reservationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  reservationCenter: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  reservationDate: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  ratingSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  starButton: {
    padding: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  commentSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    marginTop: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  criteriaSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  criteriaText: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 12,
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#4ADE80',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default RatingScreen;
