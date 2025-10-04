import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  FlatList,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig';

const ReservationsScreen = ({ navigation }) => {
  const { user: authUser } = useAuth();
  const [selectedTab, setSelectedTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const tabs = [
    { key: 'pending', label: 'Pendientes', count: 0 },
    { key: 'confirmed', label: 'Confirmadas', count: 0 },
    { key: 'completed', label: 'Completadas', count: 0 },
    { key: 'cancelled', label: 'Canceladas', count: 0 },
  ];

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const reservationsRef = collection(db, 'reservaciones');
      const q = query(
        reservationsRef,
        where('centroId', '==', authUser?.uid)
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
      Alert.alert('Error', 'No se pudieron cargar las reservaciones');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReservations();
    setRefreshing(false);
  };

  const getFilteredReservations = () => {
    return reservations.filter(reservation => {
      switch (selectedTab) {
        case 'pending':
          return reservation.estado === 'pendiente';
        case 'confirmed':
          return reservation.estado === 'confirmada';
        case 'completed':
          return reservation.estado === 'completada';
        case 'cancelled':
          return reservation.estado === 'cancelada' || reservation.estado === 'rechazada';
        default:
          return true;
      }
    });
  };

  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      const reservationRef = doc(db, 'reservaciones', reservationId);
      await updateDoc(reservationRef, {
        estado: newStatus,
        fechaActualizacion: new Date().toISOString()
      });
      
      Alert.alert('Éxito', `Reservación ${newStatus} correctamente`);
      loadReservations();
    } catch (error) {
      console.error('Error actualizando reservación:', error);
      Alert.alert('Error', 'No se pudo actualizar la reservación');
    }
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'confirmada': return '#10B981';
      case 'pendiente': return '#F59E0B';
      case 'rechazada': return '#EF4444';
      case 'cancelada': return '#6B7280';
      case 'completada': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getStatusText = (estado) => {
    switch (estado) {
      case 'confirmada': return 'Confirmada';
      case 'pendiente': return 'Pendiente';
      case 'rechazada': return 'Rechazada';
      case 'cancelada': return 'Cancelada';
      case 'completada': return 'Completada';
      default: return 'Desconocido';
    }
  };

  const renderReservationCard = (reservation) => (
    <View key={reservation.id} style={styles.reservationCard}>
      <View style={styles.reservationHeader}>
        <View style={styles.customerInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={24} color="#6B7280" />
          </View>
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>{reservation.turistaNombre || 'Turista'}</Text>
            <Text style={styles.customerPhone}>{reservation.turistaTelefono || 'Sin teléfono'}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(reservation.estado) }]}>
          <Text style={styles.statusText}>{getStatusText(reservation.estado)}</Text>
        </View>
      </View>

      <View style={styles.reservationDetails}>
        <Text style={styles.serviceName}>{reservation.servicioNombre}</Text>
        
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{reservation.fecha}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{reservation.hora}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="people" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{reservation.personas} persona{reservation.personas !== '1' ? 's' : ''}</Text>
        </View>
      </View>

      {reservation.notas && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notas:</Text>
          <Text style={styles.notesText}>{reservation.notas}</Text>
        </View>
      )}

      <View style={styles.reservationActions}>
        <TouchableOpacity style={styles.messageButton}>
          <Ionicons name="chatbubble" size={16} color="#4ADE80" />
          <Text style={styles.actionText}>Mensaje</Text>
        </TouchableOpacity>
        
        {reservation.estado === 'pendiente' && (
          <>
            <TouchableOpacity 
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => handleStatusChange(reservation.id, 'confirmada')}
            >
              <Ionicons name="checkmark" size={16} color="white" />
              <Text style={[styles.actionText, styles.confirmText]}>Confirmar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleStatusChange(reservation.id, 'rechazada')}
            >
              <Ionicons name="close" size={16} color="white" />
              <Text style={[styles.actionText, styles.rejectText]}>Rechazar</Text>
            </TouchableOpacity>
          </>
        )}
        
        {reservation.estado === 'confirmada' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => handleStatusChange(reservation.id, 'completada')}
          >
            <Ionicons name="checkmark-circle" size={16} color="white" />
            <Text style={[styles.actionText, styles.completeText]}>Completar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyStateTitle}>No hay reservaciones</Text>
      <Text style={styles.emptyStateText}>
        {selectedTab === 'pending' && 'No tienes reservaciones pendientes'}
        {selectedTab === 'confirmed' && 'No tienes reservaciones confirmadas'}
        {selectedTab === 'completed' && 'No tienes reservaciones completadas'}
        {selectedTab === 'cancelled' && 'No tienes reservaciones canceladas'}
      </Text>
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

  const filteredReservations = getFilteredReservations();

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
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                selectedTab === tab.key && styles.activeTab
              ]}
              onPress={() => setSelectedTab(tab.key)}
            >
              <Text style={[
                styles.tabText,
                selectedTab === tab.key && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
              <View style={[
                styles.tabBadge,
                selectedTab === tab.key && styles.activeTabBadge
              ]}>
                <Text style={[
                  styles.tabBadgeText,
                  selectedTab === tab.key && styles.activeTabBadgeText
                ]}>
                  {filteredReservations.length}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reservations List */}
        {filteredReservations.length > 0 ? (
          filteredReservations.map(renderReservationCard)
        ) : (
          renderEmptyState()
        )}
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
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: '#4ADE80',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  activeTabText: {
    color: 'white',
  },
  tabBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  activeTabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabBadgeText: {
    color: 'white',
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
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 14,
    color: '#6B7280',
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
  reservationDetails: {
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  notesContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
  },
  reservationActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 4,
  },
  messageButton: {
    backgroundColor: '#F0FDF4',
  },
  confirmButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  completeButton: {
    backgroundColor: '#3B82F6',
  },
  actionText: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 4,
  },
  confirmText: {
    color: 'white',
  },
  rejectText: {
    color: 'white',
  },
  completeText: {
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
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
});

export default ReservationsScreen;