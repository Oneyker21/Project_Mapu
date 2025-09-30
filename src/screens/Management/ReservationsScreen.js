import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  FlatList,
  Image,
  Modal,
  Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const ReservationsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState('pending');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const reservationOptions = [
    { id: 1, name: 'Reservación Individual', icon: 'person', color: '#3B82F6' },
    { id: 2, name: 'Reservación Grupal', icon: 'people', color: '#10B981' },
    { id: 3, name: 'Reservación Recurrente', icon: 'repeat', color: '#F59E0B' },
    { id: 4, name: 'Reservación Express', icon: 'flash', color: '#EF4444' },
  ];

  const reservations = {
    pending: [
      {
        id: 1,
        customerName: 'María González',
        date: '2024-03-15',
        time: '10:00 AM',
        people: 4,
        service: 'Tour Guiado',
        avatar: 'https://via.placeholder.com/50',
        phone: '+505 8888-8888'
      },
      {
        id: 2,
        customerName: 'Carlos Mendoza',
        date: '2024-03-16',
        time: '2:00 PM',
        people: 2,
        service: 'Degustación',
        avatar: 'https://via.placeholder.com/50',
        phone: '+505 7777-7777'
      },
    ],
    confirmed: [
      {
        id: 3,
        customerName: 'Ana López',
        date: '2024-03-14',
        time: '9:00 AM',
        people: 6,
        service: 'Evento Privado',
        avatar: 'https://via.placeholder.com/50',
        phone: '+505 6666-6666'
      },
    ],
    completed: [
      {
        id: 4,
        customerName: 'Roberto Silva',
        date: '2024-03-10',
        time: '11:00 AM',
        people: 3,
        service: 'Tour Fotográfico',
        avatar: 'https://via.placeholder.com/50',
        phone: '+505 5555-5555'
      },
    ]
  };

  const tabs = [
    { key: 'pending', title: 'Pendientes', count: reservations.pending.length, color: '#F59E0B' },
    { key: 'confirmed', title: 'Confirmadas', count: reservations.confirmed.length, color: '#10B981' },
    { key: 'completed', title: 'Completadas', count: reservations.completed.length, color: '#6B7280' },
  ];

  const renderReservationOption = (option) => (
    <TouchableOpacity 
      key={option.id} 
      style={styles.optionCard}
      onPress={() => {
        setShowCreateModal(false);
        // Aquí iría la lógica para crear la reservación
        Alert.alert('Crear Reservación', `Creando ${option.name}...`);
      }}
    >
      <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
        <Ionicons name={option.icon} size={24} color="#FFFFFF" />
      </View>
      <Text style={styles.optionText}>{option.name}</Text>
    </TouchableOpacity>
  );

  const renderReservation = ({ item }) => (
    <View style={styles.reservationCard}>
      <View style={styles.reservationHeader}>
        <View style={styles.customerInfo}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <Text style={styles.customerPhone}>{item.phone}</Text>
          </View>
        </View>
        <View style={styles.reservationActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="call" size={20} color="#10B981" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.reservationDetails, selectedTab !== 'pending' && styles.reservationDetailsNoActions]}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{item.date} - {item.time}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="people" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{item.people} personas</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="star" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{item.service}</Text>
        </View>
      </View>

      {selectedTab === 'pending' && (
        <View style={styles.pendingActions}>
          <TouchableOpacity style={styles.rejectButton}>
            <Text style={styles.rejectButtonText}>Rechazar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmButton}>
            <Text style={styles.confirmButtonText}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedTab === 'confirmed' && (
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, styles.confirmedBadge]}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.confirmedText}>Confirmada</Text>
          </View>
        </View>
      )}

      {selectedTab === 'completed' && (
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, styles.completedBadge]}>
            <Ionicons name="checkmark-done-circle" size={16} color="#6B7280" />
            <Text style={styles.completedText}>Completada</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header que llega hasta los límites de la cámara */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reservaciones</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <SafeAreaView style={styles.safeAreaContent}>
        {/* Stats Cards and Tabs Container */}
        <View style={styles.statsAndTabsContainer}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Este Mes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Hoy</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>85%</Text>
            <Text style={styles.statLabel}>Confirmadas</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedTab === tab.key && { borderBottomColor: tab.color }
            ]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Text style={[
              styles.tabText,
              selectedTab === tab.key && { color: tab.color }
            ]}>
              {tab.title}
            </Text>
            {tab.count > 0 && (
              <View style={[styles.badge, { backgroundColor: tab.color }]}>
                <Text style={styles.badgeText}>{tab.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
        </View>
      </View>

      {/* Reservations List */}
      <FlatList
        data={reservations[selectedTab]}
        renderItem={renderReservation}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Create Reservation Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crear Reservación</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.sectionTitle}>Tipos de Reservación</Text>
              <View style={styles.optionsGrid}>
                {reservationOptions.map(renderReservationOption)}
              </View>

              <Text style={styles.sectionTitle}>O crea desde cero</Text>
              <TouchableOpacity style={styles.customButton}>
                <Ionicons name="add-circle" size={24} color="#4ADE80" />
                <Text style={styles.customButtonText}>Crear Reservación Personalizada</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  safeAreaContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  filterButton: {
    padding: 8,
  },
  statsAndTabsContainer: {
    backgroundColor: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 0,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 85,
    height: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  reservationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
    backgroundColor: '#F3F4F6',
  },
  customerDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 20,
  },
  customerPhone: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 16,
  },
  reservationActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  reservationDetails: {
    marginBottom: 12,
  },
  reservationDetailsNoActions: {
    marginBottom: 0,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingVertical: 1,
  },
  detailText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
  },
  pendingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectButtonText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  statusContainer: {
    alignItems: 'flex-end',
    marginTop: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  confirmedBadge: {
    backgroundColor: '#ECFDF5',
  },
  confirmedText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  completedBadge: {
    backgroundColor: '#F9FAFB',
  },
  completedText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    backgroundColor: '#4ADE80',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  optionCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  customButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16A34A',
    marginLeft: 8,
  },
});

export default ReservationsScreen;
