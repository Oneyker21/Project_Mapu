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
  Alert,
  Image,
  Modal,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig.js';
import { colors, withOpacity } from '../../config/colors';

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
  const [activeTab, setActiveTab] = useState(route?.params?.initialTab || 'all'); // 'all', 'nearby'
  const [centers, setCenters] = useState([]);
  const [filteredCenters, setFilteredCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const filterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCenters();
  }, []);

  useEffect(() => {
    filterCenters();
  }, [searchQuery, selectedDepartments, selectedCategories, activeTab, centers]);

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
        
        // Debug: Log para ver qué campos de imagen tiene este centro
        const imageFields = [
          'imagenPrincipal', 'fotoPrincipal', 'image', 'imagenPerfil', 'fotoPerfil',
          'profileImage', 'logotipo', 'portada', 'coverImage', 'imagenes'
        ];
        const hasImage = imageFields.some(field => data[field]);
        if (hasImage) {
          console.log('🖼️ Centro con imagen:', data.nombreNegocio || data.businessName, {
            availableFields: imageFields.filter(field => data[field]),
            firstImage: imageFields.find(field => data[field])
          });
        }
      });

      console.log('✅ Centros cargados:', centersData.length);
      setCenters(centersData);
    } catch (error) {
      console.error('❌ Error cargando centros:', error);
      Alert.alert('Error', 'No se pudieron cargar los centros turísticos');
    } finally {
      setLoading(false);
    }
  };

  const filterCenters = () => {
    let filtered = [...centers];

    console.log('🔍 Filtrando centros:', {
      totalCenters: centers.length,
      searchQuery,
      selectedDepartments,
      selectedCategories,
      activeTab
    });

    // Filtrar por búsqueda de texto
    if (searchQuery.trim()) {
      filtered = filtered.filter(center => {
        const name = (center.businessName || '').toLowerCase();
        const category = (center.category || '').toLowerCase();
        const department = (center.department || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        
        return name.includes(query) || category.includes(query) || department.includes(query);
      });
    }

    // Filtrar por departamentos seleccionados
    if (selectedDepartments.length > 0) {
      filtered = filtered.filter(center => {
        const dept = (center.department || '').toLowerCase();
        return selectedDepartments.some(selectedDept => 
          dept.includes(selectedDept.toLowerCase())
        );
      });
    }

    // Filtrar por categorías seleccionadas
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(center => {
        const cat = center.category || '';
        return selectedCategories.includes(cat);
      });
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

    console.log('✅ Centros filtrados:', filtered.length);
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
      'Playas': 'water',
      'Montañas': 'trending-up',
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

  const isCenterOpen = (center) => {
    try {
      // Si no hay horarios definidos, asumir que está cerrado
      if (!center.horarios) {
        return false;
      }

      const now = new Date();
      const currentDay = now.getDay(); // 0 = Domingo, 1 = Lunes, etc.
      const currentTime = now.getHours() * 60 + now.getMinutes(); // Tiempo en minutos

      // Mapear días de la semana (múltiples variaciones)
      const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      const dayNamesEn = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDayName = dayNames[currentDay];
      const currentDayNameEn = dayNamesEn[currentDay];

      // Si los horarios son un string, intentar parsearlo
      let horarios = center.horarios;
      if (typeof horarios === 'string') {
        try {
          horarios = JSON.parse(horarios);
        } catch (e) {
          // Si contiene "cerrado" o "closed", está cerrado
          if (horarios.toLowerCase().includes('cerrado') || 
              horarios.toLowerCase().includes('closed')) {
            return false;
          }
          return true; // Si no se puede parsear, asumir abierto
        }
      }

      // Si no es un objeto, verificar si es string de estado
      if (typeof horarios !== 'object' || horarios === null) {
        if (typeof horarios === 'string' && 
            (horarios.toLowerCase().includes('cerrado') || 
             horarios.toLowerCase().includes('closed'))) {
          return false;
        }
        return true;
      }

      // Buscar horarios para el día actual (múltiples variaciones)
      const todaySchedule = horarios[currentDayName] || 
                           horarios[currentDayNameEn] || 
                           horarios[currentDay] || 
                           horarios[`day_${currentDay}`] ||
                           horarios[`${currentDay}`];
      
      if (!todaySchedule) {
        return false; // Si no hay horario para hoy, asumir cerrado
      }

      // Si el horario es "cerrado" o similar
      if (typeof todaySchedule === 'string' && 
          (todaySchedule.toLowerCase().includes('cerrado') || 
           todaySchedule.toLowerCase().includes('closed'))) {
        return false;
      }

      // Si es un objeto con horarios específicos
      if (typeof todaySchedule === 'object') {
        const { apertura, cierre, open, close, inicio, fin, start, end } = todaySchedule;
        const openTime = apertura || open || inicio || start;
        const closeTime = cierre || close || fin || end;

        if (!openTime || !closeTime) {
          return false; // Si no hay horarios específicos, asumir cerrado
        }

        // Convertir horarios a minutos (mejorar parsing)
        const parseTime = (timeStr) => {
          if (!timeStr) return 0;
          
          // Limpiar string y manejar diferentes formatos
          const cleanTime = timeStr.toString().trim();
          
          // Si contiene AM/PM
          if (cleanTime.toLowerCase().includes('am') || cleanTime.toLowerCase().includes('pm')) {
            const [time, period] = cleanTime.toLowerCase().split(/(am|pm)/);
            const [hours, minutes] = time.split(':').map(Number);
            let hour24 = hours || 0;
            
            if (period === 'pm' && hour24 !== 12) {
              hour24 += 12;
            } else if (period === 'am' && hour24 === 12) {
              hour24 = 0;
            }
            
            return hour24 * 60 + (minutes || 0);
          }
          
          // Formato 24 horas
          const [hours, minutes] = cleanTime.split(':').map(Number);
          return (hours || 0) * 60 + (minutes || 0);
        };

        const openMinutes = parseTime(openTime);
        const closeMinutes = parseTime(closeTime);

        // Si el horario de cierre es menor que el de apertura, significa que cierra al día siguiente
        if (closeMinutes < openMinutes) {
          return currentTime >= openMinutes || currentTime <= closeMinutes;
        } else {
          return currentTime >= openMinutes && currentTime <= closeMinutes;
        }
      }

      return false; // Por defecto, asumir cerrado
    } catch (error) {
      console.log('Error verificando horarios:', error);
      return false; // En caso de error, asumir cerrado
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDepartments([]);
    setSelectedCategories([]);
    setActiveTab('all');
  };


  const handleTabChange = (tab) => {
    Animated.timing(slideAnim, {
      toValue: tab === 'all' ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    setActiveTab(tab);
    
    if (tab === 'nearby') {
      getCurrentLocation();
    }
    
    console.log('🔄 Cambiando a pestaña:', tab);
  };

  const handleDepartmentToggle = (department) => {
    setSelectedDepartments(prev => {
      if (prev.includes(department)) {
        return prev.filter(d => d !== department);
      } else {
        return [...prev, department];
      }
    });
  };

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const renderTabButton = (tab, title, icon) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => handleTabChange(tab)}
    >
      <Ionicons 
        name={icon} 
        size={20} 
        color={activeTab === tab ? colors.text.primary : colors.text.muted} 
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
        // Limpiar datos antes de navegar
        const cleanCenter = {
          ...item,
          nombreNegocio: typeof item.nombreNegocio === 'string' ? item.nombreNegocio : 
                        (typeof item.businessName === 'string' ? item.businessName : 'Centro Turístico'),
          categoriaNegocio: typeof item.categoriaNegocio === 'string' ? item.categoriaNegocio : 
                           (typeof item.category === 'string' ? item.category : 'Otros'),
          departamento: typeof item.departamento === 'string' ? item.departamento : 
                       (typeof item.department === 'string' ? item.department : 'Departamento'),
          description: typeof item.description === 'string' ? item.description : '',
          servicios: typeof item.servicios === 'string' ? item.servicios : null,
          horarios: typeof item.horarios === 'string' ? item.horarios : null,
        };
        navigation.navigate('CenterDetail', { center: cleanCenter });
      }}
    >
      {/* Imagen del centro */}
      <View style={styles.centerImageContainer}>
        {(() => {
          // Buscar imagen en múltiples campos posibles
          const imageUrl = item.imagenPrincipal || item.fotoPrincipal || item.image || 
                          item.imagenPerfil || item.fotoPerfil || item.profileImage ||
                          item.logotipo || item.portada || item.coverImage ||
                          (item.imagenes && Array.isArray(item.imagenes) && item.imagenes[0]);
          
          if (imageUrl) {
            return (
              <Image
                source={{ uri: imageUrl }}
                style={styles.centerImage}
                resizeMode="cover"
                onError={(error) => {
                  console.log('❌ Error cargando imagen para:', item.nombreNegocio, 'URL:', imageUrl, error);
                }}
                onLoad={() => {
                  console.log('✅ Imagen cargada para:', item.nombreNegocio);
                }}
              />
            );
          } else {
            console.log('🚫 Sin imagen para:', item.nombreNegocio, 'Campos disponibles:', Object.keys(item).filter(key => key.toLowerCase().includes('image') || key.toLowerCase().includes('foto') || key.toLowerCase().includes('imagen')));
            return (
              <View style={styles.centerImagePlaceholder}>
                <Ionicons 
                  name={getCategoryIcon(item.categoriaNegocio || item.category)} 
                  size={40} 
                  color={colors.text.muted} 
                />
              </View>
            );
          }
        })()}
      </View>

      {/* Información del centro */}
      <View style={styles.centerContent}>
        {/* Header con nombre y badges */}
        <View style={styles.centerHeader}>
          <Text style={styles.centerName} numberOfLines={2}>
            {item.nombreNegocio || item.businessName || 'Centro Turístico'}
          </Text>
          <View style={styles.centerBadges}>
            {/* Rating */}
            {item.calificacion && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color={colors.warning} />
                <Text style={styles.ratingText}>
                  {item.calificacion.toFixed(1)}
                </Text>
              </View>
            )}
            {/* Estado */}
            {(() => {
              const isOpen = isCenterOpen(item);
              return (
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: isOpen ? withOpacity(colors.success, 0.1) : withOpacity(colors.error, 0.1) }
                ]}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: isOpen ? colors.success : colors.error }
                  ]} />
                  <Text style={[
                    styles.statusText,
                    { color: isOpen ? colors.success : colors.error }
                  ]}>
                    {isOpen ? 'Abierto' : 'Cerrado'}
                  </Text>
                </View>
              );
            })()}
          </View>
        </View>

        {/* Categoría */}
        <Text style={styles.centerCategory}>
          {item.categoriaNegocio || item.category || 'Otros'}
        </Text>
        
        {/* Ubicación */}
        <View style={styles.centerLocation}>
          <Ionicons name="location-outline" size={14} color={colors.text.muted} />
          <Text style={styles.centerLocationText} numberOfLines={1}>
            {item.departamento || item.department || 'Departamento'}
          </Text>
        </View>

        {/* Dirección */}
        {item.direccion && (
          <Text style={styles.centerAddress} numberOfLines={1}>
            {item.direccion || item.address}
          </Text>
        )}

        {/* Distancia */}
        {item.distance && (
          <View style={styles.distanceContainer}>
            <Ionicons name="walk" size={14} color={colors.success} />
            <Text style={styles.distanceText}>{formatDistance(item.distance)}</Text>
          </View>
        )}

        {/* Botones de acción */}
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: withOpacity(colors.warning, 0.1), borderColor: colors.warning }]}
            onPress={() => navigation.navigate('Reviews', { center: item })}
          >
            <Ionicons name="star-outline" size={16} color={colors.warning} />
            <Text style={[styles.actionButtonText, { color: colors.warning }]}>Reseñas</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: withOpacity(colors.primary, 0.1), borderColor: colors.primary }]}
            onPress={() => {
              // Limpiar datos antes de navegar
              const cleanCenter = {
                ...item,
                nombreNegocio: typeof item.nombreNegocio === 'string' ? item.nombreNegocio : 
                              (typeof item.businessName === 'string' ? item.businessName : 'Centro Turístico'),
                categoriaNegocio: typeof item.categoriaNegocio === 'string' ? item.categoriaNegocio : 
                                 (typeof item.category === 'string' ? item.category : 'Otros'),
                departamento: typeof item.departamento === 'string' ? item.departamento : 
                             (typeof item.department === 'string' ? item.department : 'Departamento'),
                description: typeof item.description === 'string' ? item.description : '',
                servicios: typeof item.servicios === 'string' ? item.servicios : null,
                horarios: typeof item.horarios === 'string' ? item.horarios : null,
              };
              navigation.navigate('CenterDetail', { center: cleanCenter });
            }}
          >
            <Ionicons name="eye-outline" size={16} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>Ver</Text>
          </TouchableOpacity>
        </View>
      </View>
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
        <Text style={styles.filterTitle}>Filtros Aplicados</Text>
        <View style={styles.filterRow}>
          {selectedDepartments.map((dept, index) => (
            <TouchableOpacity
              key={index}
              style={styles.activeFilterChip}
              onPress={() => handleDepartmentToggle(dept)}
            >
              <Text style={styles.activeFilterChipText}>{dept}</Text>
              <Ionicons name="close" size={16} color={colors.text.primary} />
            </TouchableOpacity>
          ))}
          {selectedCategories.map((cat, index) => (
            <TouchableOpacity
              key={index}
              style={styles.activeFilterChip}
              onPress={() => handleCategoryToggle(cat)}
            >
              <Text style={styles.activeFilterChipText}>{cat}</Text>
              <Ionicons name="close" size={16} color={colors.text.primary} />
            </TouchableOpacity>
          ))}
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
            selectedDepartments.includes(dept) && styles.selectedFilterItem
          ]}
          onPress={() => handleDepartmentToggle(dept)}
        >
          <Text style={[
            styles.filterItemText,
            selectedDepartments.includes(dept) && styles.selectedFilterItemText
          ]}>
            {dept}
          </Text>
          {selectedDepartments.includes(dept) && (
            <Ionicons name="checkmark" size={20} color={colors.text.primary} />
          )}
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
            selectedCategories.includes(category) && styles.selectedFilterItem
          ]}
          onPress={() => handleCategoryToggle(category)}
        >
          <View style={styles.categoryItemContent}>
            <Ionicons 
              name={getCategoryIcon(category)} 
              size={20} 
              color={selectedCategories.includes(category) ? colors.text.primary : colors.text.muted} 
            />
            <Text style={[
              styles.filterItemText,
              selectedCategories.includes(category) && styles.selectedFilterItemText
            ]}>
              {category}
            </Text>
            {selectedCategories.includes(category) && (
              <Ionicons name="checkmark" size={20} color={colors.text.primary} />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContent = () => {
    return (
      <FlatList
        data={filteredCenters}
        renderItem={renderCenterItem}
        keyExtractor={(item) => item.id}
        style={styles.centersList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.centersListContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={colors.text.muted} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No se encontraron resultados' : 
               selectedDepartments.length > 0 || selectedCategories.length > 0 ? 
               'No hay centros que coincidan con los filtros seleccionados' :
               'No hay centros disponibles'}
            </Text>
          </View>
        }
      />
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
        <Text style={styles.headerTitle}>Explorar Centros</Text>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.text.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar centros turísticos..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.text.muted}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>
        
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterButtonsRow}>
          <TouchableOpacity 
            style={[styles.filterButton, activeTab === 'all' && styles.activeFilterButton]}
            onPress={() => handleTabChange('all')}
          >
            <Ionicons name="grid" size={20} color={activeTab === 'all' ? colors.text.primary : colors.text.muted} />
            <Text style={[styles.filterButtonText, activeTab === 'all' && styles.activeFilterButtonText]}>
              Todos
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, activeTab === 'nearby' && styles.activeFilterButton]}
            onPress={() => handleTabChange('nearby')}
          >
            <Ionicons name="compass" size={20} color={activeTab === 'nearby' ? colors.text.primary : colors.warning} />
            <Text style={[styles.filterButtonText, activeTab === 'nearby' && styles.activeFilterButtonText]}>
              Cercanos
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.filterButtonsRow}>
          <TouchableOpacity 
            style={[styles.filterButton, selectedDepartments.length > 0 && styles.activeFilterButton]}
            onPress={() => setShowDepartmentModal(true)}
          >
            <Ionicons name="location" size={20} color={selectedDepartments.length > 0 ? colors.text.primary : colors.text.muted} />
            <Text style={[styles.filterButtonText, selectedDepartments.length > 0 && styles.activeFilterButtonText]}>
              Departamentos {selectedDepartments.length > 0 && `(${selectedDepartments.length})`}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, selectedCategories.length > 0 && styles.activeFilterButton]}
            onPress={() => setShowCategoryModal(true)}
          >
            <Ionicons name="list" size={20} color={selectedCategories.length > 0 ? colors.text.primary : colors.text.muted} />
            <Text style={[styles.filterButtonText, selectedCategories.length > 0 && styles.activeFilterButtonText]}>
              Categorías {selectedCategories.length > 0 && `(${selectedCategories.length})`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtros aplicados */}
      {(selectedDepartments.length > 0 || selectedCategories.length > 0) && renderFilterSection()}

      {/* Contenido principal */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando centros...</Text>
          </View>
        ) : (
          renderContent()
        )}
      </View>

      {/* Modal de Departamentos */}
      <Modal
        visible={showDepartmentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDepartmentModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Departamentos</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowDepartmentModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {renderDepartmentList()}
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.modalApplyButton}
              onPress={() => setShowDepartmentModal(false)}
            >
              <Text style={styles.modalApplyButtonText}>
                Aplicar ({selectedDepartments.length})
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal de Categorías */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Categorías</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {renderCategoryList()}
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.modalApplyButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.modalApplyButtonText}>
                Aplicar ({selectedCategories.length})
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
  },
  filterButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input.background,
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
    color: colors.text.primary,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    backgroundColor: colors.primary,
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.muted,
  },
  activeTabText: {
    color: colors.text.primary,
  },
  filterSection: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    overflow: 'hidden',
  },
  filterContent: {
    padding: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
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
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: colors.text.muted,
    marginRight: 4,
  },
  activeFilterChipText: {
    color: colors.text.primary,
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
  },
  clearFiltersText: {
    fontSize: 14,
    color: colors.error,
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
    color: colors.text.muted,
  },
  filterList: {
    flex: 1,
    padding: 16,
  },
  filterItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedFilterItem: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterItemText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  selectedFilterItemText: {
    color: colors.text.primary,
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  centersList: {
    flex: 1,
    padding: 16,
  },
  centersListContent: {
    paddingBottom: 20,
  },
  centerItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  centerInfo: {
    flex: 1,
  },
  centerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  centerImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: colors.background,
  },
  centerImage: {
    width: '100%',
    height: '100%',
  },
  centerImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    padding: 16,
  },
  centerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  centerCategory: {
    fontSize: 14,
    color: colors.text.muted,
    fontWeight: '500',
    marginBottom: 4,
  },
  centerDepartment: {
    fontSize: 12,
    color: colors.text.muted,
    marginBottom: 2,
  },
  centerAddress: {
    fontSize: 12,
    color: colors.text.muted,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: withOpacity(colors.warning, 0.1),
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  ratingText: {
    fontSize: 11,
    color: colors.warning,
    marginLeft: 3,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withOpacity(colors.success, 0.1),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.text.muted,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  // Nuevos estilos para el diseño mejorado
  centerBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withOpacity(colors.warning, 0.1),
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  centerLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 4,
  },
  centerLocationText: {
    fontSize: 12,
    color: colors.text.muted,
    flex: 1,
  },
  filterOptionsContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  filtersContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  filterButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  activeFilterButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.muted,
  },
  activeFilterButtonText: {
    color: colors.text.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalApplyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalApplyButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UnifiedSearchScreen;
