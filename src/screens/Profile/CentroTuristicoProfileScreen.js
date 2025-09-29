import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig.js';
import { useAuth } from '../../contexts/AuthContext';
import { uploadImageToStorage } from '../../services/imageStorage.js';
import { validatePhone, validateEmail } from '../../utils/validations.js';

const CentroTuristicoProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    nombreNegocio: '',
    categoriaNegocio: '',
    emailNegocio: '',
    telefonoNegocio: '',
    direccion: '',
    latitud: '',
    longitud: '',
    horario: '',
    costo: '',
    logotipo: '',
    portada: ''
  });
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imageType, setImageType] = useState(''); // 'logo' o 'portada'
  const [showLocationPermissionModal, setShowLocationPermissionModal] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const categoriasNegocio = [
    'Hoteles',
    'Restaurantes',
    'Museos',
    'Parques',
    'Playas',
    'Montañas',
    'Centros Históricos',
    'Aventura',
    'Ecoturismo',
    'Cultura',
    'Gastronomía',
    'Artesanías',
    'Otros'
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
          setFormData({
            nombreNegocio: data.nombreNegocio || '',
            categoriaNegocio: data.categoriaNegocio || '',
            emailNegocio: data.emailNegocio || '',
            telefonoNegocio: data.telefonoNegocio || '',
            direccion: data.direccion || '',
            latitud: data.latitud ? Number(data.latitud).toFixed(8) : '',
            longitud: data.longitud ? Number(data.longitud).toFixed(8) : '',
            horario: data.horario || '',
            costo: data.costo || '',
            logotipo: data.logotipo || '',
            portada: data.portada || ''
          });
          
          // Cargar categorías seleccionadas
          if (data.categoriaNegocio) {
            const categorias = data.categoriaNegocio.split(', ').filter(cat => cat.trim() !== '');
            setCategoriasSeleccionadas(categorias);
          }
        }
      }
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    let processedValue = value;
    
    // Validaciones específicas por campo
    switch (field) {
      case 'telefonoNegocio':
        // Solo permitir números, espacios, guiones, paréntesis y el símbolo +
        processedValue = value.replace(/[^0-9\s\-\(\)\+]/g, '');
        // Limitar a 15 caracteres (mismo límite del registro)
        if (processedValue.length > 15) {
          processedValue = processedValue.substring(0, 15);
        }
        break;
      case 'emailNegocio':
        // Convertir a minúsculas y remover espacios
        processedValue = value.toLowerCase().trim();
        break;
      case 'nombreNegocio':
        // Limitar a 100 caracteres
        if (processedValue.length > 100) {
          processedValue = processedValue.substring(0, 100);
        }
        break;
      case 'direccion':
        // Limitar a 200 caracteres
        if (processedValue.length > 200) {
          processedValue = processedValue.substring(0, 200);
        }
        break;
      case 'horario':
        // Limitar a 100 caracteres
        if (processedValue.length > 100) {
          processedValue = processedValue.substring(0, 100);
        }
        break;
      case 'costo':
        // Limitar a 100 caracteres
        if (processedValue.length > 100) {
          processedValue = processedValue.substring(0, 100);
        }
        break;
      default:
        break;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  };

  const handleCategoriaToggle = (categoria) => {
    setCategoriasSeleccionadas(prev => {
      if (prev.includes(categoria)) {
        // Remover categoría
        const nuevasCategorias = prev.filter(cat => cat !== categoria);
        setFormData(prevForm => ({
          ...prevForm,
          categoriaNegocio: nuevasCategorias.join(', ')
        }));
        return nuevasCategorias;
      } else {
        // Agregar categoría
        const nuevasCategorias = [...prev, categoria];
        setFormData(prevForm => ({
          ...prevForm,
          categoriaNegocio: nuevasCategorias.join(', ')
        }));
        return nuevasCategorias;
      }
    });
  };

  const handleAddCustomCategory = () => {
    if (nuevaCategoria.trim() && !categoriasSeleccionadas.includes(nuevaCategoria.trim())) {
      const nuevasCategorias = [...categoriasSeleccionadas, nuevaCategoria.trim()];
      setCategoriasSeleccionadas(nuevasCategorias);
      setFormData(prev => ({
        ...prev,
        categoriaNegocio: nuevasCategorias.join(', ')
      }));
      setNuevaCategoria('');
      setShowAddCategory(false);
    }
  };

  const handleRemoveCategory = (categoria) => {
    const nuevasCategorias = categoriasSeleccionadas.filter(cat => cat !== categoria);
    setCategoriasSeleccionadas(nuevasCategorias);
    setFormData(prev => ({
      ...prev,
      categoriaNegocio: nuevasCategorias.join(', ')
    }));
  };

  const handleAcceptLocationPermission = () => {
    setShowLocationPermissionModal(false);
    // Intentar abrir configuración del sistema
    Alert.alert(
      'Configuración',
      'Se abrirá la configuración de tu dispositivo.\n\n' +
      '1. Busca "Privacidad" o "Ubicación"\n' +
      '2. Habilita "Servicios de ubicación"\n' +
      '3. Asegúrate de que esta app tenga permisos\n' +
      '4. Regresa e intenta seleccionar ubicación nuevamente',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Abrir Configuración', 
          style: 'default',
          onPress: () => {
            // Aquí podrías intentar abrir la configuración del sistema
            // Por ahora solo cerramos el modal
            setShowLocationPermissionModal(false);
          }
        }
      ]
    );
  };

  const handleCancelLocationPermission = () => {
    setShowLocationPermissionModal(false);
    setLocationError(null);
  };

  const getLocationErrorInfo = () => {
    if (!locationError) return { title: 'Error de Ubicación', message: 'No se pudo acceder a la ubicación.' };
    
    if (locationError.code === 'PERMISSION_DENIED' || (locationError.message && locationError.message.includes('permission'))) {
      return {
        title: 'Permisos de Ubicación',
        message: 'Se necesita permiso para acceder a la ubicación.',
        icon: 'location-outline',
        color: '#3B82F6'
      };
    } else if (locationError.message && locationError.message.includes('location services')) {
      return {
        title: 'Servicios de Ubicación',
        message: 'Los servicios de ubicación están deshabilitados.',
        icon: 'settings-outline',
        color: '#F59E0B'
      };
    } else if (locationError.message && locationError.message.includes('network')) {
      return {
        title: 'Error de Conexión',
        message: 'Error de conexión a internet.',
        icon: 'wifi-outline',
        color: '#EF4444'
      };
    } else {
      return {
        title: 'Error de Ubicación',
        message: 'No se pudo obtener la ubicación.',
        icon: 'location-outline',
        color: '#6B7280'
      };
    }
  };

  const handleImagePicker = (type) => {
    setImageType(type);
    setShowImagePicker(true);
  };

  const pickImage = async (source) => {
    try {
      let result;
      
      if (source === 'camera') {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
          Alert.alert('Permisos', 'Se necesita acceso a la cámara para tomar fotos');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: imageType === 'logo' ? [1, 1] : [16, 9],
          quality: 0.8,
        });
      } else {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
          Alert.alert('Permisos', 'Se necesita acceso a la galería para seleccionar fotos');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: imageType === 'logo' ? [1, 1] : [16, 9],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        await uploadImage(imageUri, imageType);
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    } finally {
      setShowImagePicker(false);
    }
  };

  const uploadImage = async (imageUri, type) => {
    try {
      setSaving(true);
      const imageUrl = await uploadImageToStorage(
        imageUri,
        authUser.uid,
        type === 'logo' ? 'logo' : 'business_cover',
        'centro_turistico'
      );
      
      setFormData(prev => ({
        ...prev,
        [type === 'logo' ? 'logotipo' : 'portada']: imageUrl
      }));
      
      Alert.alert('Éxito', 'Imagen subida correctamente');
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      Alert.alert('Error', 'No se pudo subir la imagen');
    } finally {
      setSaving(false);
    }
  };

  const handleLocationPicker = () => {
    // Si ya tiene ubicación registrada, ir directamente a esas coordenadas
    if (formData.latitud && formData.longitud) {
      navigation.navigate('MapPicker', {
        initialCoords: {
          latitude: Number(formData.latitud),
          longitude: Number(formData.longitud)
        },
        onPick: (coords) => {
          if (coords && coords.latitude && coords.longitude) {
            setFormData(prev => ({
              ...prev,
              latitud: coords.latitude.toFixed(8),
              longitud: coords.longitude.toFixed(8)
            }));
            Alert.alert('Ubicación Actualizada', 'La ubicación se ha actualizado correctamente');
          } else {
            Alert.alert('Error', 'No se pudo obtener la ubicación. Inténtalo de nuevo.');
          }
        },
        onError: (error) => {
          // Solo logear para debugging interno, no mostrar al usuario
          console.log('Error interno en MapPicker:', error.message);
          
          // Mostrar vista de permisos en lugar de alertas
          setLocationError(error);
          setShowLocationPermissionModal(true);
        }
      });
    } else {
      // Si no tiene ubicación, mostrar la vista de permisos primero
      Alert.alert(
        'Seleccionar Ubicación',
        'Para seleccionar la ubicación de tu centro turístico necesitas habilitar los servicios de ubicación.\n\n¿Quieres continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Continuar', 
            style: 'default',
            onPress: () => {
              navigation.navigate('MapPicker', {
                onPick: (coords) => {
                  if (coords && coords.latitude && coords.longitude) {
                    setFormData(prev => ({
                      ...prev,
                      latitud: coords.latitude.toFixed(8),
                      longitud: coords.longitude.toFixed(8)
                    }));
                    Alert.alert('Ubicación Actualizada', 'La ubicación se ha actualizado correctamente');
                  } else {
                    Alert.alert('Error', 'No se pudo obtener la ubicación. Inténtalo de nuevo.');
                  }
                },
                onError: (error) => {
                  // Solo logear para debugging interno, no mostrar al usuario
                  console.log('Error interno en MapPicker:', error.message);
                  
                  // Mostrar vista de permisos en lugar de alertas
                  setLocationError(error);
                  setShowLocationPermissionModal(true);
                }
              });
            }
          }
        ]
      );
    }
  };

  const validateForm = () => {
    // Validar nombre del negocio
    if (!formData.nombreNegocio.trim()) {
      Alert.alert('Error', 'El nombre del negocio es requerido');
      return false;
    }
    if (formData.nombreNegocio.trim().length < 3) {
      Alert.alert('Error', 'El nombre del negocio debe tener al menos 3 caracteres');
      return false;
    }

    // Validar categorías
    if (!formData.categoriaNegocio.trim()) {
      Alert.alert('Error', 'Debe seleccionar al menos una categoría');
      return false;
    }

    // Validar email si se proporciona
    if (formData.emailNegocio.trim()) {
      const emailValidation = validateEmail(formData.emailNegocio.trim());
      if (!emailValidation.isValid) {
        Alert.alert('Error', emailValidation.message);
        return false;
      }
    }

    // Validar teléfono si se proporciona
    if (formData.telefonoNegocio.trim()) {
      const phoneValidation = validatePhone(formData.telefonoNegocio.trim());
      if (!phoneValidation.isValid) {
        Alert.alert('Error', phoneValidation.message);
        return false;
      }
    }

    // Validar dirección
    if (!formData.direccion.trim()) {
      Alert.alert('Error', 'La dirección es requerida');
      return false;
    }
    if (formData.direccion.trim().length < 10) {
      Alert.alert('Error', 'La dirección debe ser más específica (mínimo 10 caracteres)');
      return false;
    }

    // Validar ubicación
    if (!formData.latitud || !formData.longitud) {
      Alert.alert('Error', 'Debe seleccionar la ubicación en el mapa');
      return false;
    }

    // Validar coordenadas numéricas
    const lat = parseFloat(formData.latitud);
    const lng = parseFloat(formData.longitud);
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Error', 'Las coordenadas de ubicación no son válidas');
      return false;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert('Error', 'Las coordenadas de ubicación están fuera del rango válido');
      return false;
    }

    return true;
  };


  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      
      const updateData = {
        nombreNegocio: formData.nombreNegocio.trim(),
        categoriaNegocio: formData.categoriaNegocio.trim(),
        emailNegocio: formData.emailNegocio.trim(),
        telefonoNegocio: formData.telefonoNegocio.trim(),
        direccion: formData.direccion.trim(),
        latitud: formData.latitud ? Number(formData.latitud).toFixed(8) : '',
        longitud: formData.longitud ? Number(formData.longitud).toFixed(8) : '',
        horario: formData.horario.trim(),
        costo: formData.costo.trim(),
        logotipo: formData.logotipo,
        portada: formData.portada,
        ultimaActualizacion: new Date().toISOString()
      };

      await updateDoc(doc(db, 'centrosTuristicos', authUser.uid), updateData);
      
      Alert.alert(
        'Éxito',
        'Perfil actualizado correctamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const getFieldStatus = (value) => {
    if (!value || value.trim() === '') {
      return { status: 'empty', color: '#EF4444', text: 'Pendiente' };
    }
    return { status: 'complete', color: '#10B981', text: 'Completado' };
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personalizar Perfil</Text>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Información del Negocio */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información del Negocio</Text>
            
            {/* Nombre del Negocio */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Nombre del Negocio *
                <Text style={[styles.statusText, { color: getFieldStatus(formData.nombreNegocio).color }]}>
                  {' '}({getFieldStatus(formData.nombreNegocio).text})
                </Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={formData.nombreNegocio}
                onChangeText={(value) => handleInputChange('nombreNegocio', value)}
                placeholder="Ej: Hotel Paradise"
                placeholderTextColor="#9CA3AF"
                maxLength={100}
              />
              <Text style={styles.fieldHint}>
                Mínimo 3 caracteres. Máximo 100 caracteres.
              </Text>
            </View>

            {/* Categoría del Negocio */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Categorías del Negocio *
                <Text style={[styles.statusText, { color: getFieldStatus(formData.categoriaNegocio).color }]}>
                  {' '}({getFieldStatus(formData.categoriaNegocio).text})
                </Text>
              </Text>
              
              {/* Categorías seleccionadas */}
              {categoriasSeleccionadas.length > 0 && (
                <View style={styles.selectedCategoriesContainer}>
                  <Text style={styles.selectedCategoriesTitle}>Categorías seleccionadas:</Text>
                  <View style={styles.selectedCategoriesList}>
                    {categoriasSeleccionadas.map((categoria) => (
                      <View key={categoria} style={styles.selectedCategoryChip}>
                        <Text style={styles.selectedCategoryText}>{categoria}</Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveCategory(categoria)}
                          style={styles.removeCategoryButton}
                        >
                          <Ionicons name="close" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Categorías predefinidas */}
              <Text style={styles.categoriesSubtitle}>Categorías disponibles:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
                {categoriasNegocio.map((categoria) => (
                  <TouchableOpacity
                    key={categoria}
                    style={[
                      styles.categoryChip,
                      categoriasSeleccionadas.includes(categoria) && styles.categoryChipSelected
                    ]}
                    onPress={() => handleCategoriaToggle(categoria)}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      categoriasSeleccionadas.includes(categoria) && styles.categoryChipTextSelected
                    ]}>
                      {categoria}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Agregar categoría personalizada */}
              <TouchableOpacity
                style={styles.addCategoryButton}
                onPress={() => setShowAddCategory(true)}
              >
                <Ionicons name="add" size={20} color="#3B82F6" />
                <Text style={styles.addCategoryButtonText}>Agregar Categoría</Text>
              </TouchableOpacity>

              {/* Modal para agregar categoría personalizada */}
              {showAddCategory && (
                <View style={styles.addCategoryModal}>
                  <Text style={styles.addCategoryModalTitle}>Nueva Categoría</Text>
                  <TextInput
                    style={styles.addCategoryInput}
                    value={nuevaCategoria}
                    onChangeText={setNuevaCategoria}
                    placeholder="Escribe el nombre de la categoría"
                    placeholderTextColor="#9CA3AF"
                    autoFocus={true}
                  />
                  <View style={styles.addCategoryButtons}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setShowAddCategory(false);
                        setNuevaCategoria('');
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={handleAddCustomCategory}
                    >
                      <Text style={styles.addButtonText}>Agregar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Email del Negocio */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Email del Negocio
                <Text style={[styles.statusText, { color: getFieldStatus(formData.emailNegocio).color }]}>
                  {' '}({getFieldStatus(formData.emailNegocio).text})
                </Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={formData.emailNegocio}
                onChangeText={(value) => handleInputChange('emailNegocio', value)}
                placeholder="reservas@hotelparadise.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Teléfono del Negocio */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Teléfono del Negocio
                <Text style={[styles.statusText, { color: getFieldStatus(formData.telefonoNegocio).color }]}>
                  {' '}({getFieldStatus(formData.telefonoNegocio).text})
                </Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={formData.telefonoNegocio}
                onChangeText={(value) => handleInputChange('telefonoNegocio', value)}
                placeholder="2222-2222 o (505) 2222-2222"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={15}
              />
              <Text style={styles.fieldHint}>
                Formato: 8-15 caracteres. Solo números, espacios, guiones, paréntesis y +.
              </Text>
            </View>

            {/* Dirección */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Dirección *
                <Text style={[styles.statusText, { color: getFieldStatus(formData.direccion).color }]}>
                  {' '}({getFieldStatus(formData.direccion).text})
                </Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={formData.direccion}
                onChangeText={(value) => handleInputChange('direccion', value)}
                placeholder="Calle Principal, Granada"
                placeholderTextColor="#9CA3AF"
                maxLength={200}
              />
              <Text style={styles.fieldHint}>
                Mínimo 10 caracteres. Máximo 200 caracteres.
              </Text>
            </View>

            {/* Ubicación en el Mapa */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Ubicación en el Mapa *
                <Text style={[styles.statusText, { color: getFieldStatus(formData.latitud).color }]}>
                  {' '}({getFieldStatus(formData.latitud).text})
                </Text>
              </Text>
              <TouchableOpacity style={styles.locationButton} onPress={handleLocationPicker}>
                <Ionicons name="location" size={20} color="#3B82F6" />
                <Text style={styles.locationButtonText}>
                  {formData.latitud && formData.longitud 
                    ? `Editar ubicación: ${parseFloat(formData.latitud).toFixed(4)}, ${parseFloat(formData.longitud).toFixed(4)}`
                    : 'Toca para seleccionar ubicación en el mapa'
                  }
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              <Text style={styles.fieldHint}>
                Requerido. Selecciona la ubicación exacta de tu centro turístico.{'\n'}
                Asegúrate de tener habilitados los servicios de ubicación en tu dispositivo.
              </Text>
              <TouchableOpacity 
                style={styles.helpButton}
                onPress={() => {
                  Alert.alert(
                    'Habilitar Ubicación',
                    'Para seleccionar tu ubicación necesitas habilitar los servicios de ubicación.\n\n' +
                    '¿Quieres ver las instrucciones paso a paso?',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { 
                        text: 'Ver Instrucciones', 
                        style: 'default',
                        onPress: () => {
                          Alert.alert(
                            'Instrucciones Paso a Paso',
                            '1. Ve a Configuración de tu dispositivo\n' +
                            '2. Busca "Privacidad" o "Ubicación"\n' +
                            '3. Habilita "Servicios de ubicación"\n' +
                            '4. Asegúrate de que esta app tenga permisos\n' +
                            '5. Regresa e intenta seleccionar ubicación',
                            [{ text: 'Entendido' }]
                          );
                        }
                      }
                    ]
                  );
                }}
              >
                <Ionicons name="help-circle-outline" size={16} color="#3B82F6" />
                <Text style={styles.helpButtonText}>¿Cómo habilitar la ubicación?</Text>
              </TouchableOpacity>
            </View>

            {/* Horario */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Horario de Atención
                <Text style={[styles.statusText, { color: getFieldStatus(formData.horario).color }]}>
                  {' '}({getFieldStatus(formData.horario).text})
                </Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={formData.horario}
                onChangeText={(value) => handleInputChange('horario', value)}
                placeholder="Ej: 24/7, Lunes a Viernes 8:00-18:00"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Costo */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Información de Costos
                <Text style={[styles.statusText, { color: getFieldStatus(formData.costo).color }]}>
                  {' '}({getFieldStatus(formData.costo).text})
                </Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={formData.costo}
                onChangeText={(value) => handleInputChange('costo', value)}
                placeholder="Ej: Desde $50/noche, Entrada $10"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Imágenes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Imágenes del Centro</Text>
            
            {/* Logo */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Logo del Centro
                <Text style={[styles.statusText, { color: getFieldStatus(formData.logotipo).color }]}>
                  {' '}({getFieldStatus(formData.logotipo).text})
                </Text>
              </Text>
              <TouchableOpacity 
                style={styles.imageButton}
                onPress={() => handleImagePicker('logo')}
              >
                {formData.logotipo ? (
                  <Image source={{ uri: formData.logotipo }} style={styles.previewImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera" size={30} color="#9CA3AF" />
                    <Text style={styles.imagePlaceholderText}>Subir Logo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Portada */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Imagen de Portada
                <Text style={[styles.statusText, { color: getFieldStatus(formData.portada).color }]}>
                  {' '}({getFieldStatus(formData.portada).text})
                </Text>
              </Text>
              <TouchableOpacity 
                style={styles.imageButton}
                onPress={() => handleImagePicker('portada')}
              >
                {formData.portada ? (
                  <Image source={{ uri: formData.portada }} style={styles.previewImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image" size={30} color="#9CA3AF" />
                    <Text style={styles.imagePlaceholderText}>Subir Portada</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Modal para seleccionar imagen */}
        <Modal
          visible={showImagePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowImagePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {imageType === 'logo' ? 'Seleccionar Logo' : 'Seleccionar Portada'}
              </Text>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => pickImage('camera')}
              >
                <Ionicons name="camera" size={24} color="#3B82F6" />
                <Text style={styles.modalOptionText}>Tomar Foto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => pickImage('gallery')}
              >
                <Ionicons name="images" size={24} color="#3B82F6" />
                <Text style={styles.modalOptionText}>Elegir de Galería</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowImagePicker(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal de Permisos de Ubicación */}
        <Modal
          visible={showLocationPermissionModal}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCancelLocationPermission}
        >
          <View style={styles.permissionModalOverlay}>
            <View style={styles.permissionModalContent}>
              {(() => {
                const errorInfo = getLocationErrorInfo();
                return (
                  <>
                    <View style={styles.permissionHeader}>
                      <View style={[styles.permissionIconContainer, { backgroundColor: errorInfo.color + '20' }]}>
                        <Ionicons name={errorInfo.icon} size={48} color={errorInfo.color} />
                      </View>
                      <Text style={styles.permissionTitle}>{errorInfo.title}</Text>
                      <Text style={styles.permissionMessage}>{errorInfo.message}</Text>
                    </View>

                    <View style={styles.permissionBody}>
                      <Text style={styles.permissionInstructions}>
                        Para continuar, necesitas habilitar los servicios de ubicación:
                      </Text>
                      
                      <View style={styles.permissionSteps}>
                        <View style={styles.permissionStep}>
                          <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>1</Text>
                          </View>
                          <Text style={styles.stepText}>Ve a Configuración de tu dispositivo</Text>
                        </View>
                        
                        <View style={styles.permissionStep}>
                          <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>2</Text>
                          </View>
                          <Text style={styles.stepText}>Busca "Privacidad" o "Ubicación"</Text>
                        </View>
                        
                        <View style={styles.permissionStep}>
                          <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>3</Text>
                          </View>
                          <Text style={styles.stepText}>Habilita "Servicios de ubicación"</Text>
                        </View>
                        
                        <View style={styles.permissionStep}>
                          <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>4</Text>
                          </View>
                          <Text style={styles.stepText}>Asegúrate de que esta app tenga permisos</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.permissionFooter}>
                      <TouchableOpacity 
                        style={styles.permissionCancelButton}
                        onPress={handleCancelLocationPermission}
                      >
                        <Text style={styles.permissionCancelText}>Cancelar</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.permissionAcceptButton, { backgroundColor: errorInfo.color }]}
                        onPress={handleAcceptLocationPermission}
                      >
                        <Ionicons name="settings" size={20} color="#FFFFFF" />
                        <Text style={styles.permissionAcceptText}>Ir a Configuración</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                );
              })()}
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
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '400',
  },
  fieldHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#EBF4FF',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  helpButtonText: {
    fontSize: 12,
    color: '#3B82F6',
    marginLeft: 4,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  categoriesContainer: {
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  selectedCategoriesContainer: {
    marginBottom: 12,
  },
  selectedCategoriesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  selectedCategoriesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectedCategoryText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    marginRight: 4,
  },
  removeCategoryButton: {
    marginLeft: 4,
  },
  categoriesSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
  },
  addCategoryButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    marginLeft: 6,
  },
  addCategoryModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addCategoryModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  addCategoryInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  addCategoryButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Estilos para el modal de permisos
  permissionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  permissionHeader: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  permissionIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  permissionMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionBody: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  permissionInstructions: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  permissionSteps: {
    gap: 16,
  },
  permissionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
    lineHeight: 22,
  },
  permissionFooter: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 16,
    gap: 12,
  },
  permissionCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  permissionCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  permissionAcceptButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  permissionAcceptText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  locationButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  imageButton: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  modalCancel: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
});

export default CentroTuristicoProfileScreen;
