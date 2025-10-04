import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig.js';

const DEPARTMENTS = [
  'Managua', 'León', 'Granada', 'Masaya', 'Carazo', 'Rivas', 'Chinandega',
  'Chontales', 'Boaco', 'Jinotega', 'Matagalpa', 'Estelí', 'Madriz',
  'Nueva Segovia', 'Río San Juan', 'Atlántico Norte', 'Atlántico Sur'
];

const SearchByDepartmentScreen = ({ navigation }) => {
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchCentersByDepartment = async (department) => {
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

      // Filtrar por departamento
      const filteredCenters = centersData.filter(center => 
        center.department.toLowerCase().includes(department.toLowerCase())
      );

      setCenters(filteredCenters);
      setSelectedDepartment(department);
    } catch (error) {
      console.error('Error buscando centros por departamento:', error);
      Alert.alert('Error', 'No se pudieron cargar los centros turísticos');
    } finally {
      setLoading(false);
    }
  };

  const renderDepartmentItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.departmentItem,
        selectedDepartment === item && styles.selectedDepartmentItem
      ]}
      onPress={() => searchCentersByDepartment(item)}
    >
      <Text style={[
        styles.departmentText,
        selectedDepartment === item && styles.selectedDepartmentText
      ]}>
        {item}
      </Text>
      <Ionicons 
        name="chevron-forward" 
        size={20} 
        color={selectedDepartment === item ? '#FFFFFF' : '#6B7280'} 
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
        <Text style={styles.headerTitle}>Buscar por Departamento</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Selecciona un departamento</Text>
        
        <FlatList
          data={DEPARTMENTS}
          renderItem={renderDepartmentItem}
          keyExtractor={(item) => item}
          style={styles.departmentsList}
          showsVerticalScrollIndicator={false}
        />

        {selectedDepartment && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>
              Centros en {selectedDepartment} ({centers.length})
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
                    <Ionicons name="location-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyText}>
                      No se encontraron centros en {selectedDepartment}
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
  departmentsList: {
    flex: 1,
  },
  departmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedDepartmentItem: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  departmentText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  selectedDepartmentText: {
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

export default SearchByDepartmentScreen;

