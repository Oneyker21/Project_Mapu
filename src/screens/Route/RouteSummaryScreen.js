import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const RouteSummaryScreen = ({ navigation, route }) => {
  const { route: routeCenters } = route.params;

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

  const renderCenterItem = ({ item, index }) => (
    <View style={styles.centerItem}>
      <View style={styles.centerNumber}>
        <Text style={styles.centerNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.centerIcon}>
        <Ionicons 
          name={getCategoryIcon(item.category)} 
          size={20} 
          color="#3B82F6" 
        />
      </View>
      <View style={styles.centerInfo}>
        <Text style={styles.centerName}>{item.businessName}</Text>
        <Text style={styles.centerCategory}>{item.category}</Text>
        <Text style={styles.centerDepartment}>{item.department}</Text>
      </View>
      <View style={styles.visitedIcon}>
        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
      </View>
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
        <Text style={styles.headerTitle}>Resumen de Ruta</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Estadísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="location" size={24} color="#3B82F6" />
            <Text style={styles.statNumber}>{routeCenters.length}</Text>
            <Text style={styles.statLabel}>Centros Visitados</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time" size={24} color="#10B981" />
            <Text style={styles.statNumber}>2h 30m</Text>
            <Text style={styles.statLabel}>Tiempo Total</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="map" size={24} color="#F59E0B" />
            <Text style={styles.statNumber}>15.2km</Text>
            <Text style={styles.statLabel}>Distancia</Text>
          </View>
        </View>

        {/* Lista de centros visitados */}
        <View style={styles.centersSection}>
          <Text style={styles.sectionTitle}>Centros Visitados</Text>
          <FlatList
            data={routeCenters}
            renderItem={renderCenterItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>

        {/* Acciones */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => navigation.navigate('RouteCreation')}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Crear Nueva Ruta</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate('Home')}
          >
            <Ionicons name="home" size={20} color="#3B82F6" />
            <Text style={styles.secondaryButtonText}>Volver al Inicio</Text>
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
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  centersSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  centerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  centerNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  centerNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  centerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    marginBottom: 2,
  },
  centerDepartment: {
    fontSize: 12,
    color: '#6B7280',
  },
  visitedIcon: {
    marginLeft: 8,
  },
  actionsSection: {
    padding: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  secondaryButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
});

export default RouteSummaryScreen;
