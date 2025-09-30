import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig.js';
import { useAuth } from '../../contexts/AuthContext';

const ServicesMainScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [servicios, setServicios] = useState({
    tipoCentro: '',
    categorias: []
  });
  const [showTypeModal, setShowTypeModal] = useState(false);

  const tiposCentro = [
    {
      id: 'hotel',
      nombre: 'Hotel',
      icono: 'bed',
      color: '#3B82F6',
      descripcion: 'Habitaciones, servicios y amenidades'
    },
    {
      id: 'restaurante',
      nombre: 'Restaurante',
      icono: 'restaurant',
      color: '#10B981',
      descripcion: 'Menús, platos y bebidas'
    },
    {
      id: 'museo',
      nombre: 'Museo',
      icono: 'library',
      color: '#8B5CF6',
      descripcion: 'Entradas, tours y exposiciones'
    },
    {
      id: 'parque',
      nombre: 'Parque/Atracción',
      icono: 'leaf',
      color: '#059669',
      descripcion: 'Actividades, entradas y equipos'
    },
    {
      id: 'mixto',
      nombre: 'Mixto',
      icono: 'grid',
      color: '#F59E0B',
      descripcion: 'Múltiples tipos de servicios'
    }
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      if (authUser) {
        const userDoc = await getDoc(doc(db, 'centrosTuristicos', authUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setServicios(data.servicios || { tipoCentro: '', categorias: [] });
        }
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelection = async (tipo) => {
    try {
      setLoading(true);
      
      // Actualizar el tipo de centro en Firebase
      await updateDoc(doc(db, 'centrosTuristicos', authUser.uid), {
        'servicios.tipoCentro': tipo.id,
        ultimaActualizacion: new Date().toISOString()
      });

      setServicios(prev => ({
        ...prev,
        tipoCentro: tipo.id
      }));

      setShowTypeModal(false);
      Alert.alert('Éxito', `Tipo de centro configurado como: ${tipo.nombre}`);
    } catch (error) {
      console.error('Error actualizando tipo:', error);
      Alert.alert('Error', 'No se pudo actualizar el tipo de centro');
    } finally {
      setLoading(false);
    }
  };

  const getTipoCentroInfo = () => {
    return tiposCentro.find(tipo => tipo.id === servicios.tipoCentro) || null;
  };

  const renderTipoCentroCard = () => {
    const tipoInfo = getTipoCentroInfo();
    
    if (!tipoInfo) {
      return (
        <TouchableOpacity 
          style={styles.typeCard}
          onPress={() => setShowTypeModal(true)}
        >
          <View style={styles.typeCardContent}>
            <Ionicons name="add-circle" size={48} color="#9CA3AF" />
            <Text style={styles.typeCardTitle}>Seleccionar Tipo de Centro</Text>
            <Text style={styles.typeCardSubtitle}>
              Configura qué tipo de servicios ofreces
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity 
        style={[styles.typeCard, { borderColor: tipoInfo.color }]}
        onPress={() => setShowTypeModal(true)}
      >
        <View style={styles.typeCardContent}>
          <Ionicons name={tipoInfo.icono} size={48} color={tipoInfo.color} />
          <Text style={[styles.typeCardTitle, { color: tipoInfo.color }]}>
            {tipoInfo.nombre}
          </Text>
          <Text style={styles.typeCardSubtitle}>
            {tipoInfo.descripcion}
          </Text>
          <View style={styles.changeTypeButton}>
            <Text style={[styles.changeTypeText, { color: tipoInfo.color }]}>
              Cambiar tipo
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderServiciosSection = () => {
    if (!servicios.tipoCentro) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="list" size={64} color="#9CA3AF" />
          <Text style={styles.emptyStateTitle}>Configura tu tipo de centro</Text>
          <Text style={styles.emptyStateSubtitle}>
            Selecciona el tipo de centro para comenzar a agregar servicios
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.serviciosSection}>
        <Text style={styles.sectionTitle}>Mis Servicios</Text>
        <Text style={styles.sectionSubtitle}>
          Gestiona los servicios y costos de tu centro
        </Text>
        
        {/* Aquí irán las categorías de servicios */}
        <View style={styles.emptyServices}>
          <Ionicons name="add-circle-outline" size={48} color="#3B82F6" />
          <Text style={styles.emptyServicesTitle}>Agregar Primer Servicio</Text>
          <Text style={styles.emptyServicesSubtitle}>
            Comienza agregando servicios a tu centro
          </Text>
          <TouchableOpacity style={styles.addServiceButton}>
            <Text style={styles.addServiceButtonText}>Agregar Servicio</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando servicios...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Servicios y Costos</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Tipo de Centro */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de Centro</Text>
            {renderTipoCentroCard()}
          </View>

          {/* Servicios */}
          <View style={styles.section}>
            {renderServiciosSection()}
          </View>
        </ScrollView>

        {/* Modal de Selección de Tipo */}
        <Modal
          visible={showTypeModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTypeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Seleccionar Tipo de Centro</Text>
                <TouchableOpacity 
                  onPress={() => setShowTypeModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalBody}>
                {tiposCentro.map((tipo) => (
                  <TouchableOpacity
                    key={tipo.id}
                    style={[styles.typeOption, { borderColor: tipo.color }]}
                    onPress={() => handleTypeSelection(tipo)}
                  >
                    <View style={styles.typeOptionContent}>
                      <Ionicons name={tipo.icono} size={32} color={tipo.color} />
                      <View style={styles.typeOptionText}>
                        <Text style={[styles.typeOptionTitle, { color: tipo.color }]}>
                          {tipo.nombre}
                        </Text>
                        <Text style={styles.typeOptionDescription}>
                          {tipo.descripcion}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  typeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 24,
    alignItems: 'center',
  },
  typeCardContent: {
    alignItems: 'center',
  },
  typeCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  typeCardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  changeTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  changeTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  serviciosSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  emptyServices: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyServicesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyServicesSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  addServiceButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addServiceButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    maxHeight: 400,
    padding: 20,
  },
  typeOption: {
    borderWidth: 2,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  typeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  typeOptionText: {
    flex: 1,
    marginLeft: 16,
  },
  typeOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  typeOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default ServicesMainScreen;
