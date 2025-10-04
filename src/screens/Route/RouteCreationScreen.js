import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig.js';

const RouteCreationScreen = ({ navigation, route }) => {
  const [centers, setCenters] = useState([]);
  const [filteredCenters, setFilteredCenters] = useState([]);
  const [selectedCenters, setSelectedCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRoutePreview, setShowRoutePreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [showDepartmentSelector, setShowDepartmentSelector] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [startPoint, setStartPoint] = useState(null);
  const [showStartPoint, setShowStartPoint] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 12.8654, // Centro de Nicaragua
    longitude: -85.2072,
    latitudeDelta: 1.5,
    longitudeDelta: 1.5,
  });
  const [currentCoordinates, setCurrentCoordinates] = useState({
    latitude: 12.8654,
    longitude: -85.2072
  });
  // const [mapType, setMapType] = useState('standard'); // Removido para evitar errores
  
  // Estilo personalizado del mapa para ocultar POIs de Google
  const customMapStyle = [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [
        {
          visibility: "off"
        }
      ]
    },
    {
      featureType: "poi.business",
      stylers: [
        {
          visibility: "off"
        }
      ]
    },
    {
      featureType: "poi.attraction",
      stylers: [
        {
          visibility: "off"
        }
      ]
    },
    {
      featureType: "poi.government",
      stylers: [
        {
          visibility: "off"
        }
      ]
    },
    {
      featureType: "poi.medical",
      stylers: [
        {
          visibility: "off"
        }
      ]
    },
    {
      featureType: "poi.park",
      stylers: [
        {
          visibility: "off"
        }
      ]
    },
    {
      featureType: "poi.place_of_worship",
      stylers: [
        {
          visibility: "off"
        }
      ]
    },
    {
      featureType: "poi.school",
      stylers: [
        {
          visibility: "off"
        }
      ]
    },
    {
      featureType: "poi.sports_complex",
      stylers: [
        {
          visibility: "off"
        }
      ]
    }
  ];
  
  // Departamentos de Nicaragua
  const nicaraguaDepartments = [
    'Todos',
    'Managua',
    'León',
    'Granada',
    'Masaya',
    'Carazo',
    'Rivas',
    'Chinandega',
    'Estelí',
    'Nueva Segovia',
    'Madriz',
    'Jinotega',
    'Matagalpa',
    'Boaco',
    'Chontales',
    'Río San Juan',
    'Atlántico Norte (RAAN)',
    'Atlántico Sur (RAAS)'
  ];

  useEffect(() => {
    loadCenters();
    // Auto-seleccionar departamento basado en ubicación del usuario
    autoSelectDepartment();
  }, []);

  // Auto-seleccionar departamento basado en ubicación del usuario
  const autoSelectDepartment = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        // Determinar departamento basado en coordenadas
        const department = getDepartmentFromCoordinates(
          location.coords.latitude,
          location.coords.longitude
        );
        
        if (department) {
          setSelectedDepartment(department);
          
          // Actualizar las coordenadas actuales con la ubicación del usuario
          setCurrentCoordinates({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
          
          // Actualizar la región del mapa al departamento seleccionado
          const deptData = nicaraguaDepartments.find(d => d.name === department);
          if (deptData) {
            setMapRegion({
              latitude: deptData.latitude,
              longitude: deptData.longitude,
              latitudeDelta: 0.5,
              longitudeDelta: 0.5,
            });
          }
          
          console.log('📍 Departamento auto-seleccionado:', department);
          console.log('📍 Ubicación actual:', location.coords.latitude, location.coords.longitude);
        }
      }
    } catch (error) {
      console.log('No se pudo obtener ubicación para auto-selección de departamento');
    }
  };

  // Función para determinar departamento basado en coordenadas
  const getDepartmentFromCoordinates = (lat, lng) => {
    // Coordenadas aproximadas de departamentos de Nicaragua
    const departments = {
      'Managua': { lat: 12.1364, lng: -86.2514, radius: 0.5 },
      'León': { lat: 12.4342, lng: -86.8774, radius: 0.3 },
      'Chinandega': { lat: 12.6244, lng: -87.1306, radius: 0.3 },
      'Masaya': { lat: 11.9744, lng: -86.0942, radius: 0.3 },
      'Granada': { lat: 11.9344, lng: -85.9561, radius: 0.3 },
      'Carazo': { lat: 11.7272, lng: -86.2158, radius: 0.3 },
      'Rivas': { lat: 11.4364, lng: -85.8311, radius: 0.3 },
      'Chontales': { lat: 12.1364, lng: -85.0774, radius: 0.8 },
      'Boaco': { lat: 12.4708, lng: -85.6586, radius: 0.3 },
      'Matagalpa': { lat: 12.9167, lng: -85.9167, radius: 0.4 },
      'Jinotega': { lat: 13.0914, lng: -85.9994, radius: 0.4 },
      'Estelí': { lat: 13.0914, lng: -86.3536, radius: 0.3 },
      'Madriz': { lat: 13.4622, lng: -86.6381, radius: 0.3 },
      'Nueva Segovia': { lat: 13.7667, lng: -86.3833, radius: 0.4 },
      'Río San Juan': { lat: 11.1333, lng: -84.7833, radius: 0.5 },
      'Atlántico Norte (RAAN)': { lat: 14.0333, lng: -83.3833, radius: 1.0 },
      'Atlántico Sur (RAAS)': { lat: 12.1667, lng: -83.8333, radius: 1.0 }
    };

    for (const [deptName, coords] of Object.entries(departments)) {
      const distance = Math.sqrt(
        Math.pow(lat - coords.lat, 2) + Math.pow(lng - coords.lng, 2)
      );
      if (distance <= coords.radius) {
        return deptName;
      }
    }
    
    return 'Managua'; // Default
  };


  // Manejar selección de punto de inicio desde el mapa
  const handleStartPointSelected = (coordinates, address) => {
    console.log('=== SELECCIONANDO PUNTO DE INICIO ===');
    console.log('coordinates recibidas:', coordinates);
    console.log('address recibido:', address);
    console.log('mapRegion actual:', mapRegion);
    console.log('mapRegion.latitude:', mapRegion.latitude);
    console.log('mapRegion.longitude:', mapRegion.longitude);
    
    const newStartPoint = {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      address: address || 'Punto de inicio seleccionado'
    };
    
    console.log('newStartPoint creado:', newStartPoint);
    console.log('¿Coordenadas son válidas?', {
      latValid: !isNaN(coordinates.latitude) && coordinates.latitude !== 0,
      lngValid: !isNaN(coordinates.longitude) && coordinates.longitude !== 0,
      lat: coordinates.latitude,
      lng: coordinates.longitude
    });
    
    setStartPoint(newStartPoint);
    setShowStartPoint(true);
    
    console.log('Estado actualizado - startPoint guardado');
  };

  // Función para abrir el mapa funcional (MapPickerScreen)
  const openMapPicker = async () => {
    setIsLoadingLocation(true);
    try {
      // Obtener ubicación actual del usuario
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Permisos de ubicación denegados');
        setIsLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };

      console.log('📍 Ubicación actual del usuario:', userLocation);

      // Usar ubicación actual como coordenadas iniciales
      const initialCoords = startPoint ? {
        latitude: startPoint.latitude,
        longitude: startPoint.longitude
      } : userLocation;

      console.log('Abriendo MapPicker con coordenadas iniciales:', initialCoords);
      console.log('Centros a mostrar:', centers.length);

      navigation.navigate('MapPicker', {
        initialCoords,
        centers: centers, // Pasar los centros registrados
        onPick: (coords) => {
          console.log('Coordenadas seleccionadas del MapPicker:', coords);
          handleStartPointSelected(coords, 'Punto de inicio seleccionado');
        }
      });
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación actual');
      
      // Fallback: usar coordenadas por defecto
      const initialCoords = startPoint ? {
        latitude: startPoint.latitude,
        longitude: startPoint.longitude
      } : {
        latitude: currentCoordinates.latitude,
        longitude: currentCoordinates.longitude
      };

      navigation.navigate('MapPicker', {
        initialCoords,
        centers: centers,
        onPick: (coords) => {
          console.log('Coordenadas seleccionadas del MapPicker:', coords);
          handleStartPointSelected(coords, 'Punto de inicio seleccionado');
        }
      });
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Manejar toque en el mapa - actualizar región para centrar el +
  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    // Actualizar la región del mapa para centrar el + en el punto tocado
    setMapRegion({
      latitude,
      longitude,
      latitudeDelta: mapRegion.latitudeDelta,
      longitudeDelta: mapRegion.longitudeDelta,
    });
    
    // Actualizar coordenadas en tiempo real
    setCurrentCoordinates({ latitude, longitude });
    
    console.log('Mapa centrado en:', latitude, longitude);
  };

  // Navegar a un departamento específico
  const navigateToDepartment = (departmentName) => {
    const deptData = nicaraguaDepartments.find(d => d.name === departmentName);
    if (deptData) {
      setMapRegion({
        latitude: deptData.latitude,
        longitude: deptData.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      });
      setCurrentCoordinates({
        latitude: deptData.latitude,
        longitude: deptData.longitude
      });
      console.log('Navegando a:', departmentName);
    }
  };

  // Obtener ubicación actual del usuario
  const getCurrentUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos de Ubicación',
          'Necesitamos acceso a tu ubicación para localizarte en el mapa.',
          [{ text: 'Cancelar', style: 'cancel' }]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const userLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };

      // Actualizar la región del mapa para centrar en la ubicación del usuario
      setMapRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      // Seleccionar automáticamente la ubicación del usuario
      setSelectedMapPoint(userLocation);
      
      console.log('Ubicación del usuario obtenida:', userLocation);
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación actual.');
    }
  };

  // Cambiar tipo de mapa
  // const toggleMapType = () => {
  //   console.log('Cambiando tipo de mapa de', mapType, 'a', mapType === 'standard' ? 'hybrid' : 'standard');
  //   setMapType(mapType === 'standard' ? 'hybrid' : 'standard');
  // };

  const loadCenters = async () => {
    try {
      const centersSnapshot = await getDocs(collection(db, 'centrosTuristicos'));
      const centersData = [];
      const departmentsSet = new Set();
      const categoriesSet = new Set();
      
      centersSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        console.log('Centro data:', data); // Debug: ver qué datos llegan
        // Priorizar latitud/longitud (español) sobre latitude/longitude (inglés)
        let lat = data.latitud || data.latitude || data.lat || data.coordenadas?.lat || data.location?.lat;
        let lng = data.longitud || data.longitude || data.lng || data.coordenadas?.lng || data.location?.lng;
        
        // Si no hay coordenadas, saltar este centro
        if (!lat || !lng) {
          console.log('Centro sin coordenadas:', data.nombreNegocio || data.businessName);
          return;
        }
        
        // Convertir a número y validar
        lat = parseFloat(lat);
        lng = parseFloat(lng);
        
        if (isNaN(lat) || isNaN(lng)) {
          console.log('Coordenadas inválidas:', data.nombreNegocio || data.businessName, lat, lng);
          return;
        }
        
        console.log('Lat:', lat, 'Lng:', lng); // Debug: ver coordenadas
        
        const department = data.departamento || data.department || 'No especificado';
        const category = data.categoriaNegocio || data.category || 'Otros';
        
        centersData.push({
          id: docSnap.id,
          ...data,
          businessName: data.nombreNegocio || data.businessName,
          category: category,
          department: department,
          isOpen: data.isOpen || data.abierto || true, // Por defecto abierto si no se especifica
          coordinate: {
            latitude: lat,
            longitude: lng
          }
        });
        
        departmentsSet.add(department);
        categoriesSet.add(category);
      });

      console.log('Total centros cargados:', centersData.length);
      console.log('Departamentos encontrados:', Array.from(departmentsSet));
      console.log('Categorías encontradas:', Array.from(categoriesSet));
      
      setCenters(centersData);
      setFilteredCenters(centersData);
      setDepartments(Array.from(departmentsSet).sort());
      setCategories(Array.from(categoriesSet).sort());
    } catch (error) {
      console.error('Error cargando centros:', error);
      Alert.alert('Error', 'No se pudieron cargar los centros turísticos');
    } finally {
      setLoading(false);
    }
  };

  // Función para filtrar centros
  const filterCenters = () => {
    let filtered = centers;

    console.log('=== FILTRANDO CENTROS ===');
    console.log('Centros totales:', centers.length);
    console.log('Search query:', searchQuery);
    console.log('Selected department:', selectedDepartment);

    // Filtro por búsqueda
    if (searchQuery.trim()) {
      filtered = filtered.filter(center => 
        center.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        center.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        center.department.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log('Después de filtro de búsqueda:', filtered.length);
    }

    // Filtro por departamento
    if (selectedDepartment && selectedDepartment !== 'Todos') {
      filtered = filtered.filter(center => center.department === selectedDepartment);
      console.log('Después de filtro de departamento:', filtered.length);
    }

    console.log('Centros filtrados finales:', filtered.length);
    setFilteredCenters(filtered);
  };

  // Efecto para aplicar filtros cuando cambian
  useEffect(() => {
    filterCenters();
  }, [searchQuery, selectedDepartment, centers]);

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

  const reorderCenters = (fromIndex, toIndex) => {
    const newOrder = [...selectedCenters];
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, removed);
    setSelectedCenters(newOrder);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('');
  };

  const startRoute = () => {
    console.log('startRoute - startPoint:', startPoint);
    console.log('startRoute - showStartPoint:', showStartPoint);
    console.log('startRoute - selectedCenters:', selectedCenters);
    
    if (!showStartPoint) {
      Alert.alert('Error', 'Necesitas seleccionar tu punto de inicio para crear una ruta');
      return;
    }

    if (!startPoint || !startPoint.latitude || !startPoint.longitude) {
      Alert.alert('Error', 'No se pudo obtener tu punto de inicio. Intenta de nuevo.');
      return;
    }

    if (selectedCenters.length < 1) {
      Alert.alert('Error', 'Selecciona al menos 1 centro para crear una ruta');
      return;
    }

    // Crear ruta completa con punto de inicio + centros seleccionados
    const fullRoute = [
      {
        id: 'start',
        businessName: 'Tu Punto de Inicio',
        coordinate: {
          latitude: startPoint.latitude,
          longitude: startPoint.longitude
        },
        address: startPoint.address || 'Punto de inicio seleccionado',
        category: 'Inicio'
      },
      ...selectedCenters
    ];
    
    console.log('startRoute - fullRoute creada:', fullRoute);
    console.log('startRoute - coordenadas del punto de inicio:', fullRoute[0].coordinate);
    
    console.log('startRoute - fullRoute:', fullRoute);

    // Mostrar confirmación antes de iniciar
    Alert.alert(
      'Iniciar Ruta',
      `¿Estás listo para iniciar tu ruta con ${selectedCenters.length} centro(s) turístico(s)?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Iniciar',
          onPress: () => {
            console.log('=== NAVEGANDO A RUTA ===');
            console.log('startPoint que se pasa:', startPoint);
            console.log('fullRoute[0] (punto de inicio):', fullRoute[0]);
            console.log('fullRoute[0].coordinate:', fullRoute[0].coordinate);
            console.log('userLocation que se pasa:', startPoint);
            
            navigation.navigate('RouteNavigation', { 
              route: fullRoute,
              currentIndex: 0,
              userLocation: startPoint
            });
          }
        }
      ]
    );
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

  const renderCenterItem = ({ item, index }) => {
    const isSelected = selectedCenters.some(c => c.id === item.id);
    
    return (
      <TouchableOpacity 
        style={[
          styles.centerItem,
          isSelected && styles.centerItemSelected
        ]}
        onPress={() => toggleCenterSelection(item)}
      >
        <View style={styles.centerInfo}>
          <Text style={styles.centerName}>
            {item.businessName}
          </Text>
          <Text style={styles.centerCategory}>
            {item.category} • {item.department}
          </Text>
        </View>
        <View style={[
          styles.checkbox,
          isSelected && styles.checkedBox
        ]}>
          {isSelected && (
            <Ionicons key={`checkmark-${item.id}`} name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSelectedCenter = ({ item, index }) => (
    <View style={styles.selectedCenterItem}>
      <Text style={styles.selectedCenterName}>{item.businessName}</Text>
      <TouchableOpacity 
        onPress={() => toggleCenterSelection(item)}
        style={styles.removeButton}
      >
        <Ionicons key={`close-${item.id}`} name="close" size={16} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              console.log('Botón de volver atrás presionado (loading)');
              navigation.goBack();
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crear Ruta</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando centros...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            console.log('Botón de volver atrás presionado');
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crear Ruta</Text>
        {showStartPoint && selectedCenters.length > 0 && (
          <TouchableOpacity 
            style={styles.startButton}
            onPress={startRoute}
          >
            <Text style={styles.startButtonText}>Iniciar Ruta</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {/* Sección de Punto de Inicio */}
        <View style={styles.startPointSection}>
          <Text style={styles.sectionTitle}>Tu Punto de Inicio</Text>
          {startPoint ? (
            <TouchableOpacity 
              style={styles.startPointCard}
              onPress={() => setShowStartPoint(!showStartPoint)}
            >
              <View style={styles.startPointInfo}>
                <View style={styles.startPointIcon}>
                  <Ionicons name="location" size={20} color="#3B82F6" />
                </View>
                <View style={styles.startPointText}>
                  <Text style={styles.startPointTitle}>{startPoint.address}</Text>
                  <Text style={styles.startPointSubtitle}>
                    Lat: {startPoint.latitude?.toFixed(4) || 'N/A'}, Lng: {startPoint.longitude?.toFixed(4) || 'N/A'}
                  </Text>
                </View>
              </View>
              <View style={[
                styles.startPointCheckbox,
                showStartPoint && styles.startPointCheckboxSelected
              ]}>
                {showStartPoint && (
                  <Ionicons key="start-point-checkmark" name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.selectStartPointButton}
              onPress={async () => {
                console.log('Abriendo MapPicker funcional...');
                await openMapPicker();
              }}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Ionicons name="map" size={24} color="#3B82F6" />
              )}
              <View style={styles.selectStartPointTextContainer}>
                <Text style={styles.selectStartPointText}>
                  {isLoadingLocation ? 'Obteniendo ubicación...' : 'Seleccionar Punto de Inicio'}
                </Text>
                <Text style={styles.selectStartPointSubtext}>
                  {isLoadingLocation ? 'Espera un momento...' : 'Toca para elegir tu punto de partida en el mapa'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {selectedCenters.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={styles.sectionTitle}>
              Centros seleccionados ({selectedCenters.length})
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

        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar centros..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#6B7280"
            />
          </View>

          <TouchableOpacity 
            style={styles.departmentSelector}
            onPress={() => setShowDepartmentSelector(true)}
          >
            <Ionicons name="location" size={20} color="#3B82F6" />
            <Text style={styles.departmentSelectorText}>
              {selectedDepartment || 'Seleccionar departamento'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#6B7280" />
          </TouchableOpacity>

        </View>

        <Text style={styles.sectionTitle}>
          Selecciona los centros para tu ruta ({filteredCenters.length} centros)
        </Text>
        
        {filteredCenters.length > 0 ? (
          <FlatList
            data={filteredCenters}
            renderItem={renderCenterItem}
            keyExtractor={(item) => item.id}
            style={styles.centersList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {loading ? 'Cargando centros...' : 'No se encontraron centros'}
            </Text>
          </View>
        )}
      </View>

      {/* Modal para seleccionar departamento */}
      <Modal
        visible={showDepartmentSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDepartmentSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.departmentModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Departamento</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowDepartmentSelector(false)}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={nicaraguaDepartments}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.departmentOption,
                    selectedDepartment === item && styles.selectedDepartmentOption
                  ]}
                  onPress={() => {
                    setSelectedDepartment(item === 'Todos' ? '' : item);
                    setShowDepartmentSelector(false);
                  }}
                >
                  <Text style={styles.departmentOptionText}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
              style={styles.departmentList}
            />
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
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
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
    flexShrink: 0, // No se estira
    flexGrow: 0, // No crece
    flexBasis: 40, // Tamaño base fijo
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    textAlign: 'left',
  },
  startButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
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
  selectedCenterInfo: {
    flex: 1,
  },
  selectedCenterName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectedCenterCategory: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
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
  centerItemSelected: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
    borderWidth: 2,
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
  centerIconContainerSelected: {
    backgroundColor: '#3B82F6',
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
  centerNameSelected: {
    color: '#1E40AF',
    fontWeight: '700',
  },
  centerCategory: {
    fontSize: 14,
    color: '#6B7280',
  },
  centerCategorySelected: {
    color: '#3B82F6',
    fontWeight: '500',
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
  searchSection: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  departmentSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  departmentSelectorText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    alignSelf: 'flex-start',
  },
  clearFiltersText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  departmentModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  departmentList: {
    maxHeight: 400,
  },
  departmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedDepartmentOption: {
    backgroundColor: '#EBF4FF',
  },
  departmentOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  selectedDepartmentOptionText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  startPointSection: {
    marginBottom: 24,
  },
  selectStartPointButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  selectStartPointTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  selectStartPointText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  selectStartPointSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  startPointCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  startPointInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  startPointIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  startPointText: {
    flex: 1,
  },
  startPointTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  startPointSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  startPointCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startPointCheckboxSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  locationErrorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  locationErrorText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#EF4444',
    flex: 1,
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  mapFloatingButtons: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1000,
  },
  mapBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    flex: 0, // No se estira
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  centerMarkerButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    alignItems: 'center',
    zIndex: 1000,
  },
  markerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  markerButtonNoBg: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    // Sin fondo, solo el icono
  },
  markerButtonText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  markerButtonTextDisabled: {
    color: '#9CA3AF',
  },
  mapHeader: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  mapSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    margin: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3B82F6',
    marginTop: 16,
    marginBottom: 8,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  mapActions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Estilos para la nueva interfaz del mapa
  mapBottomActions: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1000,
  },
  locateButtonWithText: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  locateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 8,
  },
  confirmButtonWithText: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmButtonWithTextDisabled: {
    backgroundColor: '#10B981', // Mantiene el mismo color verde
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  departmentSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    flex: 1,
    marginHorizontal: 10,
  },
  departmentSearchText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
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
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    maxHeight: 400,
  },
  departmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  departmentOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  coordinatesIndicator: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  coordinatesText: {
    color: '#374151',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'left',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default RouteCreationScreen;
