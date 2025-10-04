import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig';

const ReservationsScreen = ({ navigation }) => {
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [centers, setCenters] = useState([]);
  const [services, setServices] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [newReservation, setNewReservation] = useState({
    fecha: '',
    hora: '',
    personas: '1',
    notas: '',
    estado: 'pendiente'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadCenters(),
        loadReservations()
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const loadCenters = async () => {
    try {
      const centersRef = collection(db, 'centros_turisticos');
      const q = query(centersRef, where('activo', '==', true));
      const querySnapshot = await getDocs(q);
      
      const centersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCenters(centersData);
    } catch (error) {
      console.error('Error cargando centros:', error);
    }
  };

  const loadServices = async (centerId) => {
    try {
      const servicesRef = collection(db, 'servicios');
      const q = query(
        servicesRef,
        where('centroId', '==', centerId),
        where('activo', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      const servicesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setServices(servicesData);
    } catch (error) {
      console.error('Error cargando servicios:', error);
    }
  };

  const loadReservations = async () => {
    try {
      const reservationsRef = collection(db, 'reservaciones');
      const q = query(
        reservationsRef,
        where('turistaId', '==', authUser?.uid)
      );
      const querySnapshot = await getDocs(q);
      
      const reservationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Ordenar client-side para evitar el error de índice
      reservationsData.sort((a, b) => {
        const dateA = new Date(a.fechaCreacion || 0);
        const dateB = new Date(b.fechaCreacion || 0);
        return dateB - dateA; // Descendente
      });
      
      setReservations(reservationsData);
    } catch (error) {
      console.error('Error cargando reservaciones:', error);
    }
  };

  const handleCenterSelect = async (center) => {
    setSelectedCenter(center);
    await loadServices(center.id);
    setShowServiceModal(true);
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setShowServiceModal(false);
    setShowReservationModal(true);
  };

  const handleCreateReservation = async () => {
    if (!newReservation.fecha || !newReservation.hora) {
      Alert.alert('Error', 'Por favor selecciona fecha y hora');
      return;
    }

    try {
      const reservationData = {
        ...newReservation,
        turistaId: authUser?.uid,
        centroId: selectedCenter.id,
        servicioId: selectedService.id,
        centroNombre: selectedCenter.nombre,
        servicioNombre: selectedService.nombre,
        fechaCreacion: new Date().toISOString(),
        estado: 'pendiente'
      };

      await addDoc(collection(db, 'reservaciones'), reservationData);
      
      Alert.alert('Éxito', 'Reservación creada correctamente');
      setShowReservationModal(false);
      setNewReservation({
        fecha: '',
        hora: '',
        personas: '1',
        notas: '',
        estado: 'pendiente'
      });
      loadReservations();
    } catch (error) {
      console.error('Error creando reservación:', error);
      Alert.alert('Error', 'No se pudo crear la reservación');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'confirmada': return '#10B981';
      case 'pendiente': return '#F59E0B';
      case 'rechazada': return '#EF4444';
      case 'cancelada': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusText = (estado) => {
    switch (estado) {
      case 'confirmada': return 'Confirmada';
      case 'pendiente': return 'Pendiente';
      case 'rechazada': return 'Rechazada';
      case 'cancelada': return 'Cancelada';
      default: return 'Desconocido';
    }
  };

  const renderCenterCard = (center) => (
    <TouchableOpacity
      key={center.id}
      style={styles.centerCard}
      onPress={() => handleCenterSelect(center)}
    >
      <Image
        source={{ uri: center.logotipo || center.imagenPerfil }}
        style={styles.centerImage}
        defaultSource={require('../../../assets/icon.png')}
      />
      <View style={styles.centerInfo}>
        <Text style={styles.centerName}>{center.nombre}</Text>
        <Text style={styles.centerDescription} numberOfLines={2}>
          {center.descripcion}
        </Text>
        <View style={styles.centerRating}>
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text style={styles.ratingText}>4.5</Text>
          <Text style={styles.ratingCount}>(12 reseñas)</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  const renderServiceCard = (service) => (
    <TouchableOpacity
      key={service.id}
      style={styles.serviceCard}
      onPress={() => handleServiceSelect(service)}
    >
      <View style={styles.serviceIcon}>
        <Ionicons name={service.icono || 'cube'} size={24} color="#4ADE80" />
      </View>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{service.nombre}</Text>
        <Text style={styles.serviceDescription} numberOfLines={2}>
          {service.descripcion}
        </Text>
        {service.precio && (
          <Text style={styles.servicePrice}>
            C$ {parseFloat(service.precio).toLocaleString('es-NI')}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  const renderReservationCard = (reservation) => (
    <View key={reservation.id} style={styles.reservationCard}>
      <View style={styles.reservationHeader}>
        <Text style={styles.reservationCenter}>{reservation.centroNombre}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(reservation.estado) }]}>
          <Text style={styles.statusText}>{getStatusText(reservation.estado)}</Text>
        </View>
      </View>
      
      <Text style={styles.reservationService}>{reservation.servicioNombre}</Text>
      
      <View style={styles.reservationDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{reservation.fecha}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{reservation.hora}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="people" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{reservation.personas} persona{reservation.personas !== '1' ? 's' : ''}</Text>
        </View>
      </View>
      
      {reservation.notas && (
        <Text style={styles.reservationNotes}>{reservation.notas}</Text>
      )}
      
      <View style={styles.reservationActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble" size={16} color="#4ADE80" />
          <Text style={styles.actionText}>Mensaje</Text>
        </TouchableOpacity>
        {reservation.estado === 'confirmada' && (
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.actionText}>Calificar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reservaciones</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ADE80" />
          <Text style={styles.loadingText}>Cargando reservaciones...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reservaciones</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Sección de Centros */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Centros Disponibles</Text>
          {centers.map(renderCenterCard)}
        </View>

        {/* Sección de Reservaciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Reservaciones</Text>
          {reservations.length > 0 ? (
            reservations.map(renderReservationCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No tienes reservaciones aún</Text>
              <Text style={styles.emptyStateSubtext}>
                Selecciona un centro para hacer tu primera reservación
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de Servicios */}
      <Modal
        visible={showServiceModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowServiceModal(false)}
            >
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Servicios de {selectedCenter?.nombre}</Text>
            <View style={styles.modalRight} />
          </View>
          
          <FlatList
            data={services}
            renderItem={({ item }) => renderServiceCard(item)}
            keyExtractor={(item) => item.id}
            style={styles.servicesList}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </Modal>

      {/* Modal de Reservación */}
      <Modal
        visible={showReservationModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowReservationModal(false)}
            >
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nueva Reservación</Text>
            <View style={styles.modalRight} />
          </View>
          
          <ScrollView style={styles.reservationForm}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Servicio</Text>
              <Text style={styles.serviceName}>{selectedService?.nombre}</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Fecha *</Text>
              <TouchableOpacity style={styles.input}>
                <Text style={styles.inputText}>
                  {newReservation.fecha || 'Seleccionar fecha'}
                </Text>
                <Ionicons name="calendar" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Hora *</Text>
              <TouchableOpacity style={styles.input}>
                <Text style={styles.inputText}>
                  {newReservation.hora || 'Seleccionar hora'}
                </Text>
                <Ionicons name="time" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Número de Personas *</Text>
              <TextInput
                style={styles.input}
                value={newReservation.personas}
                onChangeText={(text) => setNewReservation({...newReservation, personas: text})}
                keyboardType="numeric"
                placeholder="1"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Notas Adicionales</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newReservation.notas}
                onChangeText={(text) => setNewReservation({...newReservation, notas: text})}
                placeholder="Comentarios especiales..."
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateReservation}
            >
              <Text style={styles.createButtonText}>Crear Reservación</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
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
    paddingVertical: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
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
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  centerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  centerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  centerInfo: {
    flex: 1,
  },
  centerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  centerDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  centerRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ADE80',
  },
  reservationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reservationCenter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  reservationService: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  reservationDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  reservationNotes: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  reservationActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  actionText: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  modalRight: {
    flex: 1,
  },
  servicesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  reservationForm: {
    flex: 1,
    paddingHorizontal: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    color: '#6B7280',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  inputText: {
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: '#4ADE80',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 20,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default ReservationsScreen;
