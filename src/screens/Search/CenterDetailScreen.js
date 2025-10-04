import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const CenterDetailScreen = ({ navigation, route }) => {
  const { center } = route.params;
  const [isFavorite, setIsFavorite] = useState(false);

  const getCategoryIcon = (category) => {
    const categoryIcons = {
      'Hoteles': 'bed',
      'Restaurantes': 'restaurant',
      'Museos': 'library',
      'Parques': 'leaf',
      'Playas': 'beach',
      'Montañas': 'mountain',
      'Centros Históricos': 'library',
      'Aventura': 'bicycle',
      'Ecoturismo': 'leaf',
      'Cultura': 'library',
      'Gastronomía': 'restaurant',
      'Artesanías': 'construct',
      'Otros': 'business'
    };
    return categoryIcons[category] || 'business';
  };

  const handleCall = () => {
    if (center.telefono) {
      Linking.openURL(`tel:${center.telefono}`);
    } else {
      Alert.alert('Información', 'No hay número de teléfono disponible');
    }
  };

  const handleWebsite = () => {
    if (center.sitioWeb) {
      Linking.openURL(center.sitioWeb);
    } else {
      Alert.alert('Información', 'No hay sitio web disponible');
    }
  };

  const handleDirections = () => {
    const { latitude, longitude } = center.coordinate;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    Alert.alert(
      isFavorite ? 'Eliminado de Favoritos' : 'Agregado a Favoritos',
      isFavorite ? 'El centro ha sido eliminado de tus favoritos' : 'El centro ha sido agregado a tus favoritos'
    );
  };

  const handleReservation = () => {
    Alert.alert(
      'Reservación',
      '¿Deseas hacer una reservación en este centro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Reservar', onPress: () => {
          // Aquí implementarías la lógica de reservación
          Alert.alert('Reservación', 'Funcionalidad de reservación próximamente');
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {center.businessName}
        </Text>
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={toggleFavorite}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorite ? "#EF4444" : "#6B7280"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Imagen del centro */}
        <View style={styles.imageContainer}>
          {center.imagenPerfil ? (
            <Image 
              source={{ uri: center.imagenPerfil }} 
              style={styles.centerImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons 
                name={getCategoryIcon(center.category)} 
                size={48} 
                color="#9CA3AF" 
              />
            </View>
          )}
        </View>

        {/* Información principal */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={styles.centerName}>{center.businessName}</Text>
            <View style={styles.categoryBadge}>
              <Ionicons 
                name={getCategoryIcon(center.category)} 
                size={16} 
                color="#3B82F6" 
              />
              <Text style={styles.categoryText}>{center.category}</Text>
            </View>
          </View>
          
          <Text style={styles.department}>{center.department}</Text>
          
          {center.description && (
            <Text style={styles.description}>{center.description}</Text>
          )}
        </View>

        {/* Información de contacto */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Información de Contacto</Text>
          
          {center.address && (
            <View style={styles.contactItem}>
              <Ionicons name="location" size={20} color="#6B7280" />
              <Text style={styles.contactText}>{center.address}</Text>
            </View>
          )}
          
          {center.telefono && (
            <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
              <Ionicons name="call" size={20} color="#10B981" />
              <Text style={[styles.contactText, styles.clickableText]}>
                {center.telefono}
              </Text>
            </TouchableOpacity>
          )}
          
          {center.sitioWeb && (
            <TouchableOpacity style={styles.contactItem} onPress={handleWebsite}>
              <Ionicons name="globe" size={20} color="#3B82F6" />
              <Text style={[styles.contactText, styles.clickableText]}>
                {center.sitioWeb}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Servicios */}
        {center.servicios && (
          <View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>Servicios</Text>
            <Text style={styles.servicesText}>{center.servicios}</Text>
          </View>
        )}

        {/* Horarios */}
        {center.horarios && (
          <View style={styles.hoursSection}>
            <Text style={styles.sectionTitle}>Horarios</Text>
            <Text style={styles.hoursText}>{center.horarios}</Text>
          </View>
        )}

        {/* Acciones */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleDirections}
          >
            <Ionicons name="navigate" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Cómo Llegar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleReservation}
          >
            <Ionicons name="calendar" size={20} color="#3B82F6" />
            <Text style={styles.secondaryButtonText}>Reservar</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    height: 200,
    backgroundColor: '#E5E7EB',
  },
  centerImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  centerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    marginLeft: 4,
  },
  department: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  contactSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  clickableText: {
    color: '#3B82F6',
    textDecorationLine: 'underline',
  },
  servicesSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  servicesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  hoursSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  hoursText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actionsSection: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CenterDetailScreen;
