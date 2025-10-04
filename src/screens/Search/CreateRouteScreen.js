import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig.js';

const CreateRouteScreen = ({ navigation }) => {
  const [centers, setCenters] = useState([]);
  const [selectedCenters, setSelectedCenters] = useState([]);
  const [routeName, setRouteName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);

  useEffect(() => {
    loadCenters();
  }, []);

  const loadCenters = async () => {
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

      setCenters(centersData);
    } catch (error) {
      console.error('Error cargando centros:', error);
      Alert.alert('Error', 'No se pudieron cargar los centros turísticos');
    }
  };

  const toggleCenterSelection = (center) => {
    setSelectedCenters(prev => {
      const isSelected = prev.some(c => c.id === center.id);
      if (isSelected) {
        return prev.filter(c => c.id !== center.id);
      } else {
        return [...prev, center];
      }
    });
  };

  const createRoute = () => {
    if (selectedCenters.length < 2) {
      Alert.alert('Error', 'Selecciona al menos 2 centros para crear una ruta');
      return;
    }
    setShowNameModal(true);
  };

  const saveRoute = () => {
    if (!routeName.trim()) {
      Alert.alert('Error', 'Ingresa un nombre para la ruta');
      return;
    }

    // Aquí guardarías la ruta en la base de datos
    Alert.alert(
      'Ruta Creada', 
      `Ruta "${routeName}" creada con ${selectedCenters.length} centros`,
      [
        { text: 'Ver en Mapa', onPress: () => {
          // Navegar al mapa con la ruta
          navigation.navigate('Home');
        }},
        { text: 'OK' }
      ]
    );
    
    setShowNameModal(false);
    setRouteName('');
    setSelectedCenters([]);
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

  const renderCenterItem = ({ item }) => {
    const isSelected = selectedCenters.some(c => c.id === item.id);
    
    return (
      <TouchableOpacity 
        style={[
          styles.centerItem,
          isSelected && styles.selectedCenterItem
        ]}
        onPress={() => toggleCenterSelection(item)}
      >
        <View style={styles.centerInfo}>
          <View style={styles.centerHeader}>
            <View style={styles.centerIconContainer}>
              <Ionicons 
                name={getCategoryIcon(item.category)} 
                size={20} 
                color={isSelected ? '#FFFFFF' : '#3B82F6'} 
              />
            </View>
            <View style={styles.centerTextContainer}>
              <Text style={[
                styles.centerName,
                isSelected && styles.selectedCenterText
              ]}>
                {item.businessName}
              </Text>
              <Text style={[
                styles.centerCategory,
                isSelected && styles.selectedCenterSubtext
              ]}>
                {item.category} • {item.department}
              </Text>
            </View>
          </View>
        </View>
        <View style={[
          styles.checkbox,
          isSelected && styles.checkedBox
        ]}>
          {isSelected && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSelectedCenter = ({ item, index }) => (
    <View style={styles.selectedCenterItem}>
      <Text style={styles.selectedCenterNumber}>{index + 1}</Text>
      <Text style={styles.selectedCenterName}>{item.businessName}</Text>
      <TouchableOpacity 
        onPress={() => toggleCenterSelection(item)}
        style={styles.removeButton}
      >
        <Ionicons name="close" size={16} color="#EF4444" />
      </TouchableOpacity>
    </View>
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
        <Text style={styles.headerTitle}>Crear Ruta</Text>
        {selectedCenters.length > 0 && (
          <TouchableOpacity 
            style={styles.createButton}
            onPress={createRoute}
          >
            <Text style={styles.createButtonText}>Crear</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {selectedCenters.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={styles.sectionTitle}>
              Ruta seleccionada ({selectedCenters.length} centros)
            </Text>
            <FlatList
              data={selectedCenters}
              renderItem={renderSelectedCenter}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.selectedList}
            />
          </View>
        )}

        <Text style={styles.sectionTitle}>Selecciona los centros para tu ruta</Text>
        
        <FlatList
          data={centers}
          renderItem={renderCenterItem}
          keyExtractor={(item) => item.id}
          style={styles.centersList}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Modal para nombre de ruta */}
      <Modal
        visible={showNameModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Nombre de la Ruta</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Ej: Ruta de la Costa del Pacífico"
              value={routeName}
              onChangeText={setRouteName}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowNameModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveRoute}
              >
                <Text style={styles.saveButtonText}>Guardar Ruta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  createButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  selectedSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  selectedList: {
    marginBottom: 8,
  },
  selectedCenterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedCenterNumber: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginRight: 8,
  },
  selectedCenterName: {
    color: '#FFFFFF',
    fontSize: 14,
    marginRight: 8,
    maxWidth: 120,
  },
  removeButton: {
    padding: 2,
  },
  centersList: {
    flex: 1,
  },
  centerItem: {
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
  selectedCenterItem: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
  },
  centerInfo: {
    flex: 1,
  },
  centerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  centerTextContainer: {
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
    color: '#6B7280',
  },
  selectedCenterText: {
    color: '#FFFFFF',
  },
  selectedCenterSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default CreateRouteScreen;

