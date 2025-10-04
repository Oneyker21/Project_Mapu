import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Animated,
  Dimensions,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig.js';

const { width } = Dimensions.get('window');

const DEPARTMENTS = [
  'Managua', 'León', 'Granada', 'Masaya', 'Carazo', 'Rivas', 'Chinandega',
  'Chontales', 'Boaco', 'Jinotega', 'Matagalpa', 'Estelí', 'Madriz',
  'Nueva Segovia', 'Río San Juan', 'Atlántico Norte', 'Atlántico Sur'
];

const CATEGORIES = [
  'Hoteles', 'Restaurantes', 'Museos', 'Parques', 'Playas', 'Montañas',
  'Centros Históricos', 'Aventura', 'Ecoturismo', 'Cultura', 'Gastronomía',
  'Artesanías', 'Otros'
];

const UnifiedSearchScreen = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState(route?.params?.initialTab || 'all'); // 'all', 'department', 'category', 'nearby'
  const [centers, setCenters] = useState([]);
  const [filteredCenters, setFilteredCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const filterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCenters();
  }, []);

  useEffect(() => {
    filterCenters();
  }, [searchQuery, selectedDepartment, selectedCategory, activeTab, centers]);

  const loadCenters = async () => {
    try {
      const centersSnapshot = await getDocs(collection(db, 'centrosTuristicos'));
      const centersData = [];
      
      centersSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Priorizar latitud/longitud (español) sobre latitude/longitude (inglés)
        let lat = data.latitud || data.latitude || data.lat || data.coordenadas?.lat || data.location?.lat;
        let lng = data.longitud || data.longitude || data.lng || data.coordenadas?.lng || data.location?.lng;
        
        // Si no hay coordenadas, saltar este centro
        if (!lat || !lng) {
          return;
        }
        
        // Convertir a número y validar
        lat = parseFloat(lat);
        lng = parseFloat(lng);
        
        if (isNaN(lat) || isNaN(lng)) {
          return;
        }
        
        centersData.push({
          id: docSnap.id,
          ...data,
          businessName: data.nombreNegocio || data.businessName,
          category: data.categoriaNegocio || data.category,
          department: data.departamento || data.department || 'No especificado',
          coordinate: {
            latitude: lat,
            longitude: lng
          }
        });
      });

      setCenters(centersData);
    } catch (error) {
      console.error('Error cargando centros:', error);
      Alert.alert('Error', 'No se pudieron cargar los centros turísticos');
    } finally {
      setLoading(false);
    }
  };

  const filterCenters = () => {
    let filtered = [...centers];

    // Filtrar por búsqueda de texto
    if (searchQuery.trim()) {
      filtered = filtered.filter(center =>
        center.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        center.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        center.department.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrar por departamento
    if (selectedDepartment) {
      filtered = filtered.filter(center =>
        center.department.toLowerCase().includes(selectedDepartment.toLowerCase())
      );
    }

    // Filtrar por categoría
    if (selectedCategory) {
      filtered = filtered.filter(center => center.category === selectedCategory);
    }

    // Ordenar por proximidad si es tab "nearby"
    if (activeTab === 'nearby' && userLocation && userLocation.latitude && userLocation.longitude) {
      filtered = filtered.map(center => ({
        ...center,
        distance: calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          center.coordinate.latitude,
          center.coordinate.longitude
        )
      })).sort((a, b) => a.distance - b.distance);
    }

    setFilteredCenters(filtered);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso Requerido', 'Necesitamos acceso a tu ubicación para mostrar centros cercanos');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      setActiveTab('nearby');
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación');
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

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDepartment(null);
    setSelectedCategory(null);
    setActiveTab('all');
  };

  const toggleFilters = () => {
    const toValue = showFilters ? 0 : 1;
    Animated.timing(filterAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setShowFilters(!showFilters);
  };

  const handleTabChange = (tab) => {
    Animated.timing(slideAnim, {
      toValue: tab === 'all' ? 0 : tab === 'department' ? 1 : tab === 'category' ? 2 : 3,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setActiveTab(tab);
    
    if (tab === 'nearby') {
      getCurrentLocation();
    }
  };

  const renderTabButton = (tab, title, icon) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => handleTabChange(tab)}
    >
      <Ionicons 
        name={icon} 
        size={20} 
        color={activeTab === tab ? '#FFFFFF' : '#6B7280'} 
      />
      <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderFilterChip = (label, value, onPress) => (
    <TouchableOpacity
      style={[styles.filterChip, value && styles.activeFilterChip]}
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, value && styles.activeFilterChipText]}>
        {label}
      </Text>
      {value && <Ionicons name="close" size={16} color="#FFFFFF" />}
    </TouchableOpacity>
  );

  const renderCenterItem = ({ item, index }) => (
    <TouchableOpacity 
      style={styles.centerItem}
      onPress={() => {
        navigation.navigate('CenterDetail', { center: item });
      }}
    >
      <View style={styles.centerInfo}>
        <View style={styles.centerHeader}>
          <View style={styles.centerIconContainer}>
            <Ionicons 
              name={getCategoryIcon(item.category)} 
              size={20} 
              color="#3B82F6" 
            />
          </View>
          <View style={styles.centerTextContainer}>
            <Text style={styles.centerName}>{item.businessName}</Text>
            <Text style={styles.centerCategory}>{item.category}</Text>
            <Text style={styles.centerDepartment}>{item.department}</Text>
            {item.address && (
              <Text style={styles.centerAddress}>{item.address}</Text>
            )}
          </View>
        </View>
        {item.distance && (
          <View style={styles.distanceContainer}>
            <Ionicons name="location" size={16} color="#10B981" />
            <Text style={styles.distanceText}>{formatDistance(item.distance)}</Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#6B7280" />
    </TouchableOpacity>
  );

  const renderFilterSection = () => (
    <Animated.View 
      style={[
        styles.filterSection,
        {
          height: filterAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 120],
          }),
          opacity: filterAnim,
        }
      ]}
    >
      <View style={styles.filterContent}>
        <Text style={styles.filterTitle}>Filtros</Text>
        <View style={styles.filterRow}>
          {renderFilterChip(
            selectedDepartment || 'Departamento',
            selectedDepartment,
            () => setSelectedDepartment(null)
          )}
          {renderFilterChip(
            selectedCategory || 'Categoría',
            selectedCategory,
            () => setSelectedCategory(null)
          )}
        </View>
        <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
          <Text style={styles.clearFiltersText}>Limpiar Filtros</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderDepartmentList = () => (
    <View style={styles.filterList}>
      {DEPARTMENTS.map((dept) => (
        <TouchableOpacity
          key={dept}
          style={[
            styles.filterItem,
            selectedDepartment === dept && styles.selectedFilterItem
          ]}
          onPress={() => setSelectedDepartment(dept)}
        >
          <Text style={[
            styles.filterItemText,
            selectedDepartment === dept && styles.selectedFilterItemText
          ]}>
            {dept}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCategoryList = () => (
    <View style={styles.filterList}>
      {CATEGORIES.map((category) => (
        <TouchableOpacity
          key={category}
          style={[
            styles.filterItem,
            selectedCategory === category && styles.selectedFilterItem
          ]}
          onPress={() => setSelectedCategory(category)}
        >
          <View style={styles.categoryItemContent}>
            <Ionicons 
              name={getCategoryIcon(category)} 
              size={20} 
              color={selectedCategory === category ? '#FFFFFF' : '#3B82F6'} 
            />
            <Text style={[
              styles.filterItemText,
              selectedCategory === category && styles.selectedFilterItemText
            ]}>
              {category}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContent = () => {
    if (activeTab === 'department') {
      return renderDepartmentList();
    } else if (activeTab === 'category') {
      return renderCategoryList();
    } else {
      return (
        <FlatList
          data={filteredCenters}
          renderItem={renderCenterItem}
          keyExtractor={(item) => item.id}
          style={styles.centersList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No se encontraron resultados' : 'No hay centros disponibles'}
              </Text>
            </View>
          }
        />
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explorar Centros</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={toggleFilters}
        >
          <Ionicons name="filter" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar centros turísticos..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Pestañas */}
      <View style={styles.tabsContainer}>
        {renderTabButton('all', 'Todos', 'grid')}
        {renderTabButton('department', 'Departamento', 'location')}
        {renderTabButton('category', 'Categoría', 'list')}
        {renderTabButton('nearby', 'Cercanos', 'compass')}
      </View>

      {/* Filtros desplegables */}
      {renderFilterSection()}

      {/* Contenido principal */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Cargando centros...</Text>
          </View>
        ) : (
          renderContent()
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
    flex: 1,
  },
  filterButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeTabButton: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    overflow: 'hidden',
  },
  filterContent: {
    padding: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  activeFilterChip: {
    backgroundColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 4,
  },
  activeFilterChipText: {
    color: '#FFFFFF',
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  filterList: {
    flex: 1,
    padding: 16,
  },
  filterItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedFilterItem: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterItemText: {
    fontSize: 16,
    color: '#111827',
  },
  selectedFilterItemText: {
    color: '#FFFFFF',
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centersList: {
    flex: 1,
    padding: 16,
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  centerInfo: {
    flex: 1,
  },
  centerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
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
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
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

export default UnifiedSearchScreen;
