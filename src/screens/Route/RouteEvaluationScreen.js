import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { saveRoute } from '../../services/routes';

const RouteEvaluationScreen = ({ navigation, route }) => {
  const { routeCenters, userLocation, transportMode } = route.params;
  const { user } = useAuth();
  
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleSaveRoute = async (isPublic = false) => {
    if (!title.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título para la ruta');
      return;
    }

    if (rating === 0) {
      Alert.alert('Error', 'Por favor califica la ruta');
      return;
    }

    setSaving(true);
    try {
      const routeData = {
        title: title.trim(),
        description: description.trim(),
        rating,
        budget: budget.trim(),
        photos,
        centers: routeCenters.filter(c => c && c.id !== 'start'),
        startLocation: userLocation,
        transportMode,
        author: {
          id: user.uid,
          name: user.displayName || user.name || user.email?.split('@')[0],
          email: user.email
        },
        isPublic,
        likes: [],
        favorites: [],
        usageCount: 0,
        reviews: []
      };

      // Guardar en Firebase
      const routeId = await saveRoute(routeData);
      console.log('Ruta guardada con ID:', routeId);
      
      Alert.alert(
        'Ruta Guardada',
        isPublic ? 'Tu ruta ha sido publicada y otros usuarios podrán verla y usarla.' : 'Tu ruta ha sido guardada en favoritos.',
        [
          {
            text: 'Ver Mis Rutas',
            onPress: () => navigation.navigate('MyRoutes')
          },
          {
            text: 'Inicio',
            onPress: () => navigation.navigate('Tabs')
          }
        ]
      );
    } catch (error) {
      console.error('Error guardando ruta:', error);
      Alert.alert('Error', 'No se pudo guardar la ruta. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const addPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotos(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={32}
              color={star <= rating ? "#F59E0B" : "#D1D5DB"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Evaluar Ruta</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Resumen de la ruta */}
        <View style={styles.routeSummary}>
          <Text style={styles.sectionTitle}>Resumen del Recorrido</Text>
          <View style={styles.routeInfo}>
            <View style={styles.routeStat}>
              <Ionicons name="location" size={20} color="#3B82F6" />
              <Text style={styles.statText}>
                {routeCenters.filter(c => c && c.id !== 'start').length} destinos
              </Text>
            </View>
            <View style={styles.routeStat}>
              <Ionicons name="time" size={20} color="#10B981" />
              <Text style={styles.statText}>
                {transportMode === 'driving' ? 'En auto' : 
                 transportMode === 'walking' ? 'A pie' : 'En moto'}
              </Text>
            </View>
          </View>
        </View>

        {/* Calificación */}
        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>¿Cómo calificarías esta ruta?</Text>
          {renderStars()}
          <Text style={styles.ratingText}>
            {rating === 0 ? 'Toca una estrella para calificar' :
             rating === 1 ? 'Muy malo' :
             rating === 2 ? 'Malo' :
             rating === 3 ? 'Regular' :
             rating === 4 ? 'Bueno' : 'Excelente'}
          </Text>
        </View>

        {/* Título de la ruta */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Título de la ruta *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ej: Tour gastronómico por Granada"
            value={title}
            onChangeText={setTitle}
            maxLength={50}
          />
        </View>

        {/* Descripción */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Cuéntanos sobre tu experiencia en esta ruta..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>

        {/* Presupuesto */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Presupuesto gastado</Text>
          <View style={styles.budgetContainer}>
            <TextInput
              style={[styles.textInput, styles.budgetInput]}
              placeholder="50"
              value={budget.replace(/[^0-9]/g, '')}
              onChangeText={(value) => {
                const numericValue = value.replace(/[^0-9]/g, '');
                setBudget(numericValue);
              }}
              keyboardType="numeric"
            />
            <View style={styles.currencyContainer}>
              <TouchableOpacity 
                style={[styles.currencyButton, budget.includes('USD') && styles.currencyButtonSelected]}
                onPress={() => setBudget(budget.replace(/[^0-9]/g, '') + ' USD')}
              >
                <Text style={[styles.currencyText, budget.includes('USD') && styles.currencyTextSelected]}>USD</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.currencyButton, budget.includes('C$') && styles.currencyButtonSelected]}
                onPress={() => setBudget(budget.replace(/[^0-9]/g, '') + ' C$')}
              >
                <Text style={[styles.currencyText, budget.includes('C$') && styles.currencyTextSelected]}>C$</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Fotos */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Fotos del recorrido</Text>
          <TouchableOpacity style={styles.addPhotoButton} onPress={addPhoto}>
            <Ionicons name="camera" size={24} color="#3B82F6" />
            <Text style={styles.addPhotoText}>Agregar foto</Text>
          </TouchableOpacity>
          
          {photos.length > 0 && (
            <View style={styles.photosContainer}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image source={{ uri: photo }} style={styles.photo} />
                  <TouchableOpacity 
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.saveButton]}
            onPress={() => handleSaveRoute(false)}
            disabled={saving}
          >
            <Ionicons name="heart" size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>
              {saving ? 'Guardando...' : 'Guardar en Favoritos'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.publishButton]}
            onPress={() => handleSaveRoute(true)}
            disabled={saving}
          >
            <Ionicons name="share" size={20} color="#FFFFFF" />
            <Text style={styles.publishButtonText}>
              {saving ? 'Publicando...' : 'Publicar Ruta'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  headerRight: {
    width: 40,
  },
  routeSummary: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  routeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  routeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
  },
  ratingSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  inputSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  budgetContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  budgetInput: {
    flex: 1,
  },
  currencyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  currencyButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  currencyTextSelected: {
    color: '#FFFFFF',
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    borderRadius: 8,
    gap: 8,
  },
  addPhotoText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    justifyContent: 'space-between',
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 12,
    width: '30%',
    aspectRatio: 1,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  actionButtons: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#EF4444',
  },
  publishButton: {
    backgroundColor: '#3B82F6',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default RouteEvaluationScreen;
