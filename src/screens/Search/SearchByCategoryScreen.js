import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig.js';

const CATEGORIES = [
  'Hoteles', 'Restaurantes', 'Museos', 'Parques', 'Playas', 'Montañas',
  'Centros Históricos', 'Aventura', 'Ecoturismo', 'Cultura', 'Gastronomía',
  'Artesanías', 'Otros'
];

const SearchByCategoryScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchCentersByCategory = async (category) => {
    setLoading(true);
    try {
      const centersSnapshot = await getDocs(collection(db, 'centrosTuristicos'));
      const centersData = [];
      
      centersSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const lat = data.latitud || data.latitude;
        const lng = data.longitud || data.longitude;
        
        if (lat && lng) {
          centersData.push({
            id: docSnap.id,
            ...data,
            businessName: data.nombreNegocio || data.businessName,
            category: data.categoriaNegocio || data.category,
            department: data.departamento || data.department || 'No especificado',
            coordinate: {
              latitude: parseFloat(lat),
              longitude: parseFloat(lng)
            }
          });
        }
      });

      // Filtrar por categoría
      const filteredCenters = centersData.filter(center => 
        center.category === category
      );

      setCenters(filteredCenters);
      setSelectedCategory(category);
    } catch (error) {
      console.error('Error buscando centros por categoría:', error);
      Alert.alert('Error', 'No se pudieron cargar los centros turísticos');
    } finally {
      setLoading(false);
    }
  };

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

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item && styles.selectedCategoryItem
      ]}
      onPress={() => searchCentersByCategory(item)}
    >
      <View style={styles.categoryIconContainer}>
        <Ionicons 
          name={getCategoryIcon(item)} 
          size={24} 
          color={selectedCategory === item ? '#FFFFFF' : '#3B82F6'} 
        />
      </View>
      <Text style={[
        styles.categoryText,
        selectedCategory === item && styles.selectedCategoryText
      ]}>
        {item}
      </Text>
      <Ionicons 
        name="chevron-forward" 
        size={20} 
        color={selectedCategory === item ? '#FFFFFF' : '#6B7280'} 
      />
    </TouchableOpacity>
  );

  const renderCenterItem = ({ item }) => (
    <TouchableOpacity style={styles.centerItem}>
      <View style={styles.centerInfo}>
        <Text style={styles.centerName}>{item.businessName}</Text>
        <Text style={styles.centerCategory}>{item.category}</Text>
        <Text style={styles.centerDepartment}>{item.department}</Text>
        {item.address && (
          <Text style={styles.centerAddress}>{item.address}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#6B7280" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buscar por Categoría</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Selecciona una categoría</Text>
        
        <FlatList
          data={CATEGORIES}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item}
          style={styles.categoriesList}
          showsVerticalScrollIndicator={false}
        />

        {selectedCategory && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>
              Centros de {selectedCategory} ({centers.length})
            </Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Buscando centros...</Text>
              </View>
            ) : (
              <FlatList
                data={centers}
                renderItem={renderCenterItem}
                keyExtractor={(item) => item.id}
                style={styles.centersList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="grid-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyText}>
                      No se encontraron centros de {selectedCategory}
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        )}
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
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  categoriesList: {
    flex: 1,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedCategoryItem: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  resultsSection: {
    marginTop: 24,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  centersList: {
    maxHeight: 300,
  },
  centerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  centerInfo: {
    flex: 1,
  },
  centerName: {
    fontSize: 16,
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
  centerDepartment: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  centerAddress: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default SearchByCategoryScreen;

