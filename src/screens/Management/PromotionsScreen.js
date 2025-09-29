import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const PromotionsScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('active');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const promotions = {
    active: [
      {
        id: 1,
        title: 'Tour de Fin de Semana',
        description: '30% de descuento en tours grupales',
        discount: 30,
        validUntil: '2024-03-31',
        used: 45,
        limit: 100,
        image: 'https://via.placeholder.com/300x150',
        type: 'percentage'
      },
      {
        id: 2,
        title: 'Degustación Especial',
        description: 'Paga 2 lleva 3 en degustaciones',
        discount: 0,
        validUntil: '2024-04-15',
        used: 12,
        limit: 50,
        image: 'https://via.placeholder.com/300x150',
        type: 'special'
      },
    ],
    draft: [
      {
        id: 3,
        title: 'Promoción de Verano',
        description: '25% de descuento en todos los servicios',
        discount: 25,
        validUntil: '2024-06-30',
        used: 0,
        limit: 200,
        image: 'https://via.placeholder.com/300x150',
        type: 'percentage'
      },
    ],
    expired: [
      {
        id: 4,
        title: 'Oferta de Año Nuevo',
        description: '40% de descuento por tiempo limitado',
        discount: 40,
        validUntil: '2024-01-31',
        used: 78,
        limit: 100,
        image: 'https://via.placeholder.com/300x150',
        type: 'percentage'
      },
    ]
  };

  const promotionTemplates = [
    { id: 1, name: 'Descuento Porcentual', icon: 'pricetag', color: '#3B82F6' },
    { id: 2, name: 'Descuento Fijo', icon: 'cash', color: '#F59E0B' },
    { id: 3, name: 'Paga 1 Lleva 2', icon: 'gift', color: '#10B981' },
    { id: 4, name: 'Temporada Alta', icon: 'sunny', color: '#EF4444' },
  ];

  const tabs = [
    { key: 'active', title: 'Activas', count: promotions.active.length },
    { key: 'draft', title: 'Borradores', count: promotions.draft.length },
    { key: 'expired', title: 'Expiradas', count: promotions.expired.length },
  ];

  const renderPromotion = ({ item }) => (
    <View style={styles.promotionCard}>
      <Image source={{ uri: item.image }} style={styles.promotionImage} />
      <View style={styles.promotionContent}>
        <View style={styles.promotionHeader}>
          <Text style={styles.promotionTitle}>{item.title}</Text>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <Text style={styles.promotionDescription}>{item.description}</Text>

        <View style={styles.promotionStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {item.type === 'percentage' ? `${item.discount}%` : 'Especial'}
            </Text>
            <Text style={styles.statLabel}>Descuento</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.used}/{item.limit}</Text>
            <Text style={styles.statLabel}>Usados</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.validUntil}</Text>
            <Text style={styles.statLabel}>Vence</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progress, 
                { width: `${(item.used / item.limit) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round((item.used / item.limit) * 100)}% utilizado
          </Text>
        </View>

        <View style={styles.promotionActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="eye" size={16} color="#3B82F6" />
            <Text style={[styles.actionText, { color: '#3B82F6' }]}>Ver</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="create" size={16} color="#F59E0B" />
            <Text style={[styles.actionText, { color: '#F59E0B' }]}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share" size={16} color="#10B981" />
            <Text style={[styles.actionText, { color: '#10B981' }]}>Compartir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderTemplate = (template) => (
    <TouchableOpacity key={template.id} style={styles.templateCard}>
      <View style={[styles.templateIcon, { backgroundColor: `${template.color}20` }]}>
        <Ionicons name={template.icon} size={24} color={template.color} />
      </View>
      <Text style={styles.templateName}>{template.name}</Text>
    </TouchableOpacity>
  );

  const CreateModal = () => (
    <Modal
      visible={showCreateModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Crear Promoción</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.sectionTitle}>Plantillas Rápidas</Text>
            <View style={styles.templatesGrid}>
              {promotionTemplates.map(renderTemplate)}
            </View>

            <Text style={styles.sectionTitle}>O crea desde cero</Text>
            <TouchableOpacity style={styles.customButton}>
              <Ionicons name="add-circle" size={24} color="#4ADE80" />
              <Text style={styles.customButtonText}>Crear Promoción Personalizada</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promociones</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>5</Text>
          <Text style={styles.statLabel}>Activas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>234</Text>
          <Text style={styles.statLabel}>Usos Este Mes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>$1,245</Text>
          <Text style={styles.statLabel}>Ahorros Generados</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedTab === tab.key && styles.selectedTab
            ]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Text style={[
              styles.tabText,
              selectedTab === tab.key && styles.selectedTabText
            ]}>
              {tab.title}
            </Text>
            {tab.count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{tab.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Promotions List */}
      <FlatList
        data={promotions[selectedTab]}
        renderItem={renderPromotion}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <CreateModal />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  searchButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  selectedTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4ADE80',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedTabText: {
    color: '#4ADE80',
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#4ADE80',
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
  },
  promotionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  promotionImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  promotionContent: {
    padding: 16,
  },
  promotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  promotionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  moreButton: {
    padding: 4,
  },
  promotionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  promotionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    marginBottom: 4,
  },
  progress: {
    height: 6,
    backgroundColor: '#4ADE80',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
  promotionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 14,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalBody: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  templateCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  templateName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#4ADE80',
    borderStyle: 'dashed',
  },
  customButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ADE80',
    marginLeft: 8,
  },
});

export default PromotionsScreen;
