import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../config/colors';

const RouteSummaryScreen = ({ navigation, route }) => {
  const { route: routeData } = route.params;
  
  // Manejar diferentes estructuras de datos
  // Si es un array (antiguo formato), usarlo directamente
  // Si es un objeto (nuevo formato), usar la propiedad 'centers'
  const routeCenters = Array.isArray(routeData) ? routeData : (routeData?.centers || []);


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

  const renderCenterItem = ({ item, index }) => {
    // Manejar diferentes nombres de propiedades
    const centerName = item.businessName || item.nombreNegocio || item.name || 'Centro Turístico';
    const centerCategory = item.category || item.categoriaNegocio || 'Sin categoría';
    const centerDepartment = item.department || item.departamento || 'Sin ubicación';
    
    return (
      <View style={styles.centerItem}>
        <View style={styles.centerNumber}>
          <Text style={styles.centerNumberText}>{index + 1}</Text>
        </View>
        <View style={styles.centerIcon}>
          <Ionicons 
            name={getCategoryIcon(centerCategory)} 
            size={20} 
            color={colors.primary} 
          />
        </View>
        <View style={styles.centerInfo}>
          <Text style={styles.centerName}>{centerName}</Text>
          <Text style={styles.centerCategory}>{centerCategory}</Text>
          <Text style={styles.centerDepartment}>{centerDepartment}</Text>
        </View>
        <View style={styles.visitedIcon}>
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {routeData?.title || routeData?.name || 'Resumen de Ruta'}
          </Text>
          {routeData?.description && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {routeData.description}
            </Text>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Punto de Inicio */}
        {routeCenters.length > 0 && (() => {
          const firstCenter = routeCenters[0];
          const startName = firstCenter.businessName || firstCenter.nombreNegocio || firstCenter.name || 'Centro Turístico';
          const startCategory = firstCenter.category || firstCenter.categoriaNegocio || 'Sin categoría';
          const startDepartment = firstCenter.department || firstCenter.departamento || 'Sin ubicación';
          
          return (
            <View style={styles.startPointContainer}>
              <View style={styles.startPointHeader}>
                <Ionicons name="flag" size={20} color={colors.primary} />
                <Text style={styles.startPointTitle}>Punto de Inicio</Text>
              </View>
              <View style={styles.startPointCard}>
                <View style={styles.startPointIcon}>
                  <Ionicons 
                    name={getCategoryIcon(startCategory)} 
                    size={24} 
                    color={colors.primary} 
                  />
                </View>
                <View style={styles.startPointInfo}>
                  <Text style={styles.startPointName}>{startName}</Text>
                  <Text style={styles.startPointCategory}>{startCategory}</Text>
                  <View style={styles.startPointLocation}>
                    <Ionicons name="location-outline" size={14} color={colors.text.secondary} />
                    <Text style={styles.startPointDepartment}>{startDepartment}</Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })()}

        {/* Estadísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="location" size={24} color={colors.primary} />
            <Text style={styles.statNumber}>{routeCenters.length}</Text>
            <Text style={styles.statLabel}>Centros Visitados</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time" size={24} color={colors.success} />
            <Text style={styles.statNumber}>2h 30m</Text>
            <Text style={styles.statLabel}>Tiempo Total</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="map" size={24} color={colors.warning} />
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  startPointContainer: {
    backgroundColor: colors.surface,
    padding: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  startPointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  startPointTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  startPointCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  startPointIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  startPointInfo: {
    flex: 1,
  },
  startPointName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  startPointCategory: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 6,
    fontWeight: '600',
  },
  startPointLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  startPointDepartment: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 20,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  centersSection: {
    backgroundColor: colors.surface,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  centerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  centerNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
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
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  centerInfo: {
    flex: 1,
  },
  centerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  centerCategory: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 2,
  },
  centerDepartment: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  visitedIcon: {
    marginLeft: 8,
  },
});

export default RouteSummaryScreen;
