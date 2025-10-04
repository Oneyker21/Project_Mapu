import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Modal,
  BackHandler,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig.js';
import { useAuth } from '../../contexts/AuthContext';
import { uploadImage } from '../../services/imageStorage';
import { getDepartmentFromCoordinates, isWithinNicaragua } from '../../utils/geolocation';

// Paleta de colores
const COLOR_PALETTE = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B',
  red: '#EF4444',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    light: '#9CA3AF',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
  }
};

const CentroTuristicoProfileScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState(null);
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState({
    nombreNegocio: '',
    categoriaNegocio: '',
    emailNegocio: '',
    telefonoNegocio: '',
    direccion: '',
    latitud: '',
    longitud: '',
    departamento: '',
    horario: '',
    costo: '',
    logotipo: null,
    portada: null,
  });

  const [scheduleData, setScheduleData] = useState({
    lunes: { open: '09:00', close: '18:00', enabled: true },
    martes: { open: '09:00', close: '18:00', enabled: true },
    miercoles: { open: '09:00', close: '18:00', enabled: true },
    jueves: { open: '09:00', close: '18:00', enabled: true },
    viernes: { open: '09:00', close: '18:00', enabled: true },
    sabado: { open: '09:00', close: '16:00', enabled: true },
    domingo: { open: '09:00', close: '18:00', enabled: false }
  });

  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedField, setSelectedField] = useState(''); // 'open' o 'close'
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedAmPm, setSelectedAmPm] = useState('AM');

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

  const diasSemana = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' }
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  // Detectar cambios en el formulario
  useEffect(() => {
    if (userData) {
      const hasFormChanges = formData.nombreNegocio.trim() !== (userData?.nombreNegocio || '') ||
                            formData.categoriaNegocio.trim() !== (userData?.categoriaNegocio || '') ||
                            formData.emailNegocio.trim() !== (userData?.emailNegocio || '') ||
                            formData.telefonoNegocio.trim() !== (userData?.telefonoNegocio || '') ||
                            formData.direccion.trim() !== (userData?.direccion || '') ||
                            formData.latitud !== (userData?.latitud || '') ||
                            formData.longitud !== (userData?.longitud || '') ||
                            formData.departamento.trim() !== (userData?.departamento || '') ||
                            formData.costo.trim() !== (userData?.costo || '');
      
      // Verificar si hay imágenes seleccionadas (nuevas o cambiadas)
      const hasNewImages = (formData.logotipo && formData.logotipo.uri !== userData?.logotipo) ||
                          (formData.portada && formData.portada.uri !== userData?.portada);
      
      setHasChanges(hasFormChanges || hasNewImages);
    }
  }, [formData, scheduleData, categoriasSeleccionadas, userData]);

  // Manejar el botón de atrás del teléfono
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (hasChanges) {
          Alert.alert(
            'Cambios sin guardar',
            'Tienes cambios sin guardar. ¿Deseas guardar antes de salir?',
            [
              {
                text: 'Descartar',
                style: 'destructive',
                onPress: () => navigation.goBack(),
              },
              {
                text: 'Guardar',
                onPress: () => {
                  handleSave();
                  navigation.goBack();
                },
              },
              {
                text: 'Cancelar',
                style: 'cancel',
              },
            ]
          );
          return true; // Prevenir el comportamiento por defecto
        }
        return false; // Permitir el comportamiento por defecto
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [hasChanges, navigation])
  );

  const loadUserData = async () => {
    try {
      if (authUser) {
        const userDoc = await getDoc(doc(db, 'centrosTuristicos', authUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          
          // Llenar el formulario con los datos existentes
          setFormData({
            nombreNegocio: data.nombreNegocio || '',
            categoriaNegocio: data.categoriaNegocio || '',
            emailNegocio: data.emailNegocio || '',
            telefonoNegocio: data.telefonoNegocio || '',
            direccion: data.direccion || '',
            latitud: data.latitud ? Number(data.latitud).toFixed(8) : '',
            longitud: data.longitud ? Number(data.longitud).toFixed(8) : '',
            departamento: data.departamento || '',
            horario: data.horario || '',
            costo: data.costo || '',
            logotipo: data.logotipo ? { uri: data.logotipo } : null,
            portada: data.portada ? { uri: data.portada } : null,
          });

          // Procesar categorías
          if (data.categoriaNegocio) {
            const categorias = data.categoriaNegocio.split(',').map(cat => cat.trim()).filter(Boolean);
            setCategoriasSeleccionadas(categorias);
          } else {
            setCategoriasSeleccionadas([]);
          }

          // Procesar horario detallado
          if (data.horarioDetallado) {
            setScheduleData(data.horarioDetallado);
          }

          setHasChanges(false);
        }
      }
    } catch (error) {
      console.error('Error cargando datos del centro:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del centro');
    } finally {
      setLoading(false);
    }
  };


  const pickImage = async (type = 'logotipo') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos', 'Se necesitan permisos para acceder a la galería');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'logotipo' ? [1, 1] : [16, 9],
        quality: 0.8,
        exif: false,
        base64: false,
        allowsMultipleSelection: false,
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const field = type === 'logotipo' ? 'logotipo' : 'portada';
        setFormData(prev => ({ ...prev, [field]: result.assets[0] }));
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombreNegocio.trim()) {
      newErrors.nombreNegocio = 'El nombre del negocio es requerido';
    }

    if (!formData.emailNegocio.trim()) {
      newErrors.emailNegocio = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.emailNegocio)) {
      newErrors.emailNegocio = 'El email no es válido';
    }

    if (!formData.telefonoNegocio.trim()) {
      newErrors.telefonoNegocio = 'El teléfono es requerido';
    }

    if (!formData.direccion.trim()) {
      newErrors.direccion = 'La dirección es requerida';
    }

    if (!formData.latitud || !formData.longitud) {
      newErrors.ubicacion = 'La ubicación es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    if (!authUser?.uid) {
      Alert.alert('Error', 'No se pudo obtener la información del usuario');
      return;
    }

    setSaving(true);
    try {
      let logotipoUrl = userData?.logotipo || null;
      let portadaUrl = userData?.portada || null;

      // Subir logotipo si es nuevo
      if (formData.logotipo && !formData.logotipo.uri?.startsWith('http')) {
        try {
          const logotipoResult = await uploadImage(formData.logotipo.uri, `centros_turisticos/${authUser.uid}/logo`, authUser.uid);
          if (logotipoResult.success) {
            logotipoUrl = logotipoResult.url;
          }
        } catch (error) {
          console.error('Error subiendo logotipo:', error);
        }
      }

      // Subir portada si es nueva
      if (formData.portada && !formData.portada.uri?.startsWith('http')) {
        try {
          const portadaResult = await uploadImage(formData.portada.uri, `centros_turisticos/${authUser.uid}/business_cover`, authUser.uid);
          if (portadaResult.success) {
            portadaUrl = portadaResult.url;
          }
        } catch (error) {
          console.error('Error subiendo portada:', error);
        }
      }

      // Actualizar datos en Firestore
      const updateData = {
        nombreNegocio: formData.nombreNegocio.trim(),
        categoriaNegocio: formData.categoriaNegocio.trim(),
        emailNegocio: formData.emailNegocio.trim(),
        telefonoNegocio: formData.telefonoNegocio.trim(),
        direccion: formData.direccion.trim(),
        latitud: formData.latitud ? Number(formData.latitud).toFixed(8) : '',
        longitud: formData.longitud ? Number(formData.longitud).toFixed(8) : '',
        departamento: formData.departamento.trim(),
        horario: convertScheduleTo12h(scheduleData),
        horarioDetallado: scheduleData,
        costo: formData.costo.trim(),
        logotipo: logotipoUrl,
        portada: portadaUrl,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, 'centrosTuristicos', authUser.uid), updateData);

      setHasChanges(false);
      
      // Notificar al HomeScreen que se actualizaron los datos
      if (route?.params?.onProfileUpdate) {
        console.log('Ejecutando callback onProfileUpdate');
        route.params.onProfileUpdate();
      } else {
        console.log('No hay callback onProfileUpdate disponible');
      }
      
      Alert.alert(
        'Éxito',
        'Tu centro ha sido actualizado correctamente'
      );
    } catch (error) {
      console.error('Error guardando centro:', error);
      Alert.alert('Error', 'No se pudo guardar el centro. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    let processedValue = value;
    
    switch (field) {
      case 'nombreNegocio':
        processedValue = value.slice(0, 100);
        break;
      case 'emailNegocio':
        processedValue = value.toLowerCase().trim();
        break;
      case 'telefonoNegocio':
        processedValue = value.replace(/[^0-9\s\-\(\)\+]/g, '').slice(0, 15);
        break;
      case 'direccion':
        processedValue = value.slice(0, 200);
        break;
      case 'horario':
        processedValue = value.slice(0, 100);
        break;
      case 'costo':
        processedValue = value.slice(0, 100);
        break;
      default:
        processedValue = value;
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCategoriaToggle = (categoria) => {
    setCategoriasSeleccionadas(prev => {
      if (prev.includes(categoria)) {
        const nuevasCategorias = prev.filter(cat => cat !== categoria);
        setFormData(prevForm => ({
          ...prevForm,
          categoriaNegocio: nuevasCategorias.join(', ')
        }));
        return nuevasCategorias;
      } else {
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

  const handleScheduleToggle = (day) => {
    setScheduleData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled
      }
    }));
  };

  const handleScheduleTimeChange = (day, field, value) => {
    setScheduleData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const convertScheduleTo12h = (schedule) => {
    if (!schedule) return '';
    
    const formatTime = (time) => {
      if (!time) return '';
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    const enabledDays = Object.entries(schedule)
      .filter(([_, data]) => data.enabled)
      .map(([day, data]) => {
        const dayName = diasSemana.find(d => d.key === day)?.label || day;
        return `${dayName}: ${formatTime(data.open)} - ${formatTime(data.close)}`;
      });

    return enabledDays.join('\n');
  };

  const convertTo24h = (hour, minute, ampm) => {
    let hour24 = hour;
    if (ampm === 'PM' && hour !== 12) {
      hour24 = hour + 12;
    } else if (ampm === 'AM' && hour === 12) {
      hour24 = 0;
    }
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const convertFrom24h = (time24) => {
    if (!time24) return { hour: 9, minute: 0, ampm: 'AM' };
    const [hours, minutes] = time24.split(':');
    const hour24 = parseInt(hours);
    const minute = parseInt(minutes);
    
    let hour12 = hour24;
    let ampm = 'AM';
    
    if (hour24 === 0) {
      hour12 = 12;
    } else if (hour24 === 12) {
      ampm = 'PM';
    } else if (hour24 > 12) {
      hour12 = hour24 - 12;
      ampm = 'PM';
    }
    
    return { hour: hour12, minute, ampm };
  };

  const openTimePicker = (day, field) => {
    const currentTime = scheduleData[day]?.[field] || '09:00';
    const { hour, minute, ampm } = convertFrom24h(currentTime);
    
    setSelectedDay(day);
    setSelectedField(field);
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setSelectedAmPm(ampm);
    setShowTimePicker(true);
  };

  const saveTimeSelection = () => {
    const time24 = convertTo24h(selectedHour, selectedMinute, selectedAmPm);
    handleScheduleTimeChange(selectedDay, selectedField, time24);
    setShowTimePicker(false);
  };

  const handleBackPress = () => {
    if (hasChanges) {
      Alert.alert(
        'Cambios sin guardar',
        'Tienes cambios sin guardar. ¿Deseas guardar antes de salir?',
        [
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
          {
            text: 'Guardar',
            onPress: () => {
              handleSave();
              navigation.goBack();
            },
          },
          {
            text: 'Cancelar',
            style: 'cancel',
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handleLocationPicker = () => {
      navigation.navigate('MapPicker', {
      initialCoords: (formData.latitud && formData.longitud) ? {
          latitude: Number(formData.latitud),
        longitude: Number(formData.longitud),
      } : undefined,
        onPick: (coords) => {
          if (coords && coords.latitude && coords.longitude) {
          // Determinar departamento automáticamente
          const department = getDepartmentFromCoordinates(coords.latitude, coords.longitude);
          const isInNicaragua = isWithinNicaragua(coords.latitude, coords.longitude);
          
            setFormData(prev => ({
              ...prev,
              latitud: coords.latitude.toFixed(8),
            longitud: coords.longitude.toFixed(8),
            departamento: department
          }));
          
          const message = isInNicaragua 
            ? `Ubicación actualizada correctamente.\nDepartamento detectado: ${department}`
            : 'Ubicación actualizada, pero está fuera de Nicaragua.';
          
          Alert.alert('Ubicación Actualizada', message);
                  } else {
                    Alert.alert('Error', 'No se pudo obtener la ubicación. Inténtalo de nuevo.');
                  }
                },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color={COLOR_PALETTE.primary} />
        <Text style={styles.loadingText}>Cargando centro...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]} edges={[]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Ionicons name="arrow-back" size={24} color={COLOR_PALETTE.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Centro</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[
              styles.saveButton, 
              !hasChanges && styles.saveButtonDisabled,
              saving && styles.saveButtonSaving
            ]}
            onPress={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLOR_PALETTE.background.primary} />
            ) : (
              <>
                <Ionicons 
                  name="checkmark" 
                  size={16} 
                  color={hasChanges ? COLOR_PALETTE.background.primary : '#9CA3AF'} 
                />
                <Text style={[
                  styles.saveButtonText,
                  !hasChanges && styles.saveButtonTextDisabled
                ]}>
                  Guardar
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

        <KeyboardAvoidingView 
        style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Sección de imágenes */}
          <View style={styles.imageSection}>
            {/* Imagen de portada */}
            <View style={styles.coverImageContainer}>
              <TouchableOpacity 
                style={styles.coverImageButton} 
                onPress={() => pickImage('portada')}
              >
                {formData.portada ? (
                  <Image 
                    source={{ uri: typeof formData.portada.uri === 'string' ? formData.portada.uri : String(formData.portada.uri) }} 
                    style={styles.coverImage} 
                  />
                ) : (
                  <View style={styles.coverImagePlaceholder}>
                    <Ionicons name="image" size={32} color={COLOR_PALETTE.text.light} />
                    <Text style={styles.coverImageText}>
                      Agregar portada
              </Text>
                  </View>
                )}
              </TouchableOpacity>
              {formData.portada && (
                <TouchableOpacity 
                  style={styles.removeCoverButton} 
                  onPress={() => setFormData(prev => ({ ...prev, portada: null }))}
                >
                  <Ionicons name="close-circle" size={20} color={COLOR_PALETTE.red} />
                  <Text style={styles.removeCoverText}>Eliminar</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Logotipo */}
            <View style={styles.logoContainer}>
              <TouchableOpacity 
                style={styles.logoButton} 
                onPress={() => pickImage('logotipo')}
              >
                {formData.logotipo ? (
                  <Image 
                    source={{ uri: typeof formData.logotipo.uri === 'string' ? formData.logotipo.uri : String(formData.logotipo.uri) }} 
                    style={styles.logoImage} 
                  />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Ionicons name="business" size={24} color={COLOR_PALETTE.text.light} />
                    <Text style={styles.logoText}>
                      Logo
                </Text>
                  </View>
                )}
              </TouchableOpacity>
              {formData.logotipo && (
                        <TouchableOpacity
                  style={styles.removeLogoButton} 
                  onPress={() => setFormData(prev => ({ ...prev, logotipo: null }))}
                        >
                  <Ionicons name="close-circle" size={16} color={COLOR_PALETTE.red} />
                        </TouchableOpacity>
              )}
                      </View>
                  </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            {/* Información básica del negocio */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Información del Negocio</Text>
              <View style={styles.sectionUnderline} />
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nombre del Negocio *</Text>
                <TextInput
                  style={[styles.textInput, errors.nombreNegocio && styles.inputError]}
                  value={formData.nombreNegocio}
                  onChangeText={(value) => handleInputChange('nombreNegocio', value)}
                  placeholder="Ej. Hotel Paradise"
                />
                {errors.nombreNegocio && <Text style={styles.errorText}>{errors.nombreNegocio}</Text>}
                <Text style={styles.characterCount}>
                  {(formData.nombreNegocio || '').length}/100
                </Text>
                </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Categorías del Negocio</Text>
                <View style={styles.categoriesContainer}>
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
                </View>
                {(
              <TouchableOpacity
                style={styles.addCategoryButton}
                onPress={() => setShowAddCategory(true)}
              >
                    <Ionicons name="add" size={20} color={COLOR_PALETTE.primary} />
                <Text style={styles.addCategoryButtonText}>Agregar Categoría</Text>
              </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Información de contacto */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Información de Contacto</Text>
              <View style={styles.sectionUnderline} />
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email del Negocio *</Text>
              <TextInput
                  style={[styles.textInput, errors.emailNegocio && styles.inputError]}
                value={formData.emailNegocio}
                  onChangeText={(value) => handleInputChange('emailNegocio', value)}
                placeholder="reservas@hotelparadise.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
                {errors.emailNegocio && <Text style={styles.errorText}>{errors.emailNegocio}</Text>}
            </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Teléfono del Negocio *</Text>
              <TextInput
                  style={[styles.textInput, errors.telefonoNegocio && styles.inputError]}
                value={formData.telefonoNegocio}
                  onChangeText={(value) => handleInputChange('telefonoNegocio', value)}
                placeholder="2222-2222 o (505) 2222-2222"
                keyboardType="phone-pad"
              />
                {errors.telefonoNegocio && <Text style={styles.errorText}>{errors.telefonoNegocio}</Text>}
                <Text style={styles.characterCount}>
                  {(formData.telefonoNegocio || '').replace(/\s/g, '').length}/15
              </Text>
              </View>
            </View>

            {/* Ubicación */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Ubicación</Text>
              <Text style={styles.sectionSubtext}>Selecciona la ubicación exacta de tu centro</Text>
              <View style={styles.sectionUnderline} />
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Dirección *</Text>
              <TextInput
                  style={[styles.textInput, errors.direccion && styles.inputError]}
                value={formData.direccion}
                  onChangeText={(value) => handleInputChange('direccion', value)}
                placeholder="Calle Principal, Granada"
              />
                {errors.direccion && <Text style={styles.errorText}>{errors.direccion}</Text>}
                <Text style={styles.characterCount}>
                  {(formData.direccion || '').length}/200
              </Text>
            </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Ubicación en el Mapa *</Text>
                <TouchableOpacity 
                  style={styles.locationButton} 
                  onPress={handleLocationPicker}
                >
                  <Ionicons name="location" size={20} color={COLOR_PALETTE.primary} />
                <Text style={styles.locationButtonText}>
                  {formData.latitud && formData.longitud 
                    ? `Editar ubicación: ${parseFloat(formData.latitud).toFixed(4)}, ${parseFloat(formData.longitud).toFixed(4)}`
                      : 'Seleccionar ubicación en el mapa'
                  }
                </Text>
                  <Ionicons name="chevron-forward" size={20} color={COLOR_PALETTE.text.light} />
              </TouchableOpacity>
                {errors.ubicacion && <Text style={styles.errorText}>{errors.ubicacion}</Text>}
                
                {formData.departamento && (
                  <View style={styles.departmentInfo}>
                    <Ionicons name="location" size={16} color={COLOR_PALETTE.secondary} />
                    <Text style={styles.departmentText}>
                      Departamento detectado: {formData.departamento}
              </Text>
                  </View>
                )}
                </View>
            </View>

            {/* Sistema de Horario */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Horario de Atención</Text>
              <Text style={styles.sectionSubtext}>Configura los horarios de atención para cada día de la semana</Text>
              <View style={styles.sectionUnderline} />
              
              <TouchableOpacity 
                style={styles.scheduleButton}
                onPress={() => setShowScheduleModal(true)}
              >
                <View style={styles.scheduleButtonContent}>
                  <Ionicons name="time" size={24} color={COLOR_PALETTE.primary} />
                  <View style={styles.scheduleButtonText}>
                    <Text style={styles.scheduleButtonTitle}>Sistema de Horario</Text>
                    <Text style={styles.scheduleButtonSubtitle}>
                      {Object.values(scheduleData).filter(day => day.enabled).length} días configurados
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLOR_PALETTE.text.light} />
                </View>
              </TouchableOpacity>

              {/* Vista previa del horario */}
              <View style={styles.schedulePreview}>
                <Text style={styles.schedulePreviewTitle}>Horario Actual:</Text>
                <View style={styles.schedulePreviewContent}>
                  {diasSemana
                    .filter(dia => scheduleData[dia.key]?.enabled)
                    .map((dia) => {
                      const data = scheduleData[dia.key];
                      const { hour, minute, ampm } = convertFrom24h(data.open);
                      const { hour: closeHour, minute: closeMinute, ampm: closeAmpm } = convertFrom24h(data.close);
                      return (
                        <View key={dia.key} style={styles.schedulePreviewItem}>
                          <Text style={styles.schedulePreviewDay}>{dia.label}</Text>
                          <Text style={styles.schedulePreviewTime}>
                            {hour}:{minute.toString().padStart(2, '0')} {ampm} - {closeHour}:{closeMinute.toString().padStart(2, '0')} {closeAmpm}
                          </Text>
                        </View>
                      );
                    })}
                  {Object.values(scheduleData).filter(day => day.enabled).length === 0 && (
                    <Text style={styles.schedulePreviewEmpty}>No hay horarios configurados</Text>
                  )}
                </View>
              </View>
            </View>



          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal para agregar categoría personalizada */}
        <Modal
        visible={showAddCategory}
          transparent={true}
          animationType="slide"
        onRequestClose={() => setShowAddCategory(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Categoría</Text>
            <TextInput
              style={styles.modalInput}
              value={nuevaCategoria}
              onChangeText={setNuevaCategoria}
              placeholder="Escribe el nombre de la categoría"
              placeholderTextColor={COLOR_PALETTE.text.light}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowAddCategory(false);
                  setNuevaCategoria('');
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalAddButton}
                onPress={handleAddCustomCategory}
              >
                <Text style={styles.modalAddButtonText}>Agregar</Text>
              </TouchableOpacity>
            </View>
            </View>
          </View>
        </Modal>

        {/* Modal del Sistema de Horario */}
        <Modal
          visible={showScheduleModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowScheduleModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.scheduleModalContent}>
              <View style={styles.scheduleModalHeader}>
                <Text style={styles.scheduleModalTitle}>Sistema de Horario</Text>
                <TouchableOpacity 
                  style={styles.scheduleModalCloseButton}
                  onPress={() => setShowScheduleModal(false)}
                >
                  <Ionicons name="close" size={24} color={COLOR_PALETTE.text.secondary} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.scheduleModalBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.scheduleModalSubtitle}>
                  Configura los horarios de atención para cada día de la semana
                </Text>
                
                {diasSemana.map((dia) => (
                  <View key={dia.key} style={styles.scheduleDayContainer}>
                    <View style={styles.scheduleDayHeader}>
                      <TouchableOpacity 
                        style={styles.scheduleDayToggle}
                        onPress={() => handleScheduleToggle(dia.key)}
                      >
                        <View style={[
                          styles.checkbox,
                          scheduleData[dia.key]?.enabled && styles.checkboxChecked
                        ]}>
                          {scheduleData[dia.key]?.enabled && (
                            <Ionicons name="checkmark" size={16} color={COLOR_PALETTE.background.primary} />
                          )}
                        </View>
                        <Text style={[
                          styles.scheduleDayLabel,
                          scheduleData[dia.key]?.enabled && styles.scheduleDayLabelEnabled
                        ]}>
                          {dia.label}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    {scheduleData[dia.key]?.enabled && (
                      <View style={styles.scheduleTimeContainer}>
                        <View style={styles.timeInputContainer}>
                          <Text style={styles.timeLabel}>Apertura</Text>
                          <TouchableOpacity 
                            style={styles.timeButton}
                            onPress={() => openTimePicker(dia.key, 'open')}
                          >
                            <Text style={styles.timeButtonText}>
                              {convertFrom24h(scheduleData[dia.key]?.open || '09:00').hour}:
                              {convertFrom24h(scheduleData[dia.key]?.open || '09:00').minute.toString().padStart(2, '0')} 
                              {convertFrom24h(scheduleData[dia.key]?.open || '09:00').ampm}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color={COLOR_PALETTE.text.light} />
                          </TouchableOpacity>
                        </View>
                        
                        <Text style={styles.timeSeparator}>-</Text>
                        
                        <View style={styles.timeInputContainer}>
                          <Text style={styles.timeLabel}>Cierre</Text>
                          <TouchableOpacity 
                            style={styles.timeButton}
                            onPress={() => openTimePicker(dia.key, 'close')}
                          >
                            <Text style={styles.timeButtonText}>
                              {convertFrom24h(scheduleData[dia.key]?.close || '18:00').hour}:
                              {convertFrom24h(scheduleData[dia.key]?.close || '18:00').minute.toString().padStart(2, '0')} 
                              {convertFrom24h(scheduleData[dia.key]?.close || '18:00').ampm}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color={COLOR_PALETTE.text.light} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
              
              <View style={styles.scheduleModalFooter}>
                <TouchableOpacity 
                  style={styles.scheduleModalCancelButton}
                  onPress={() => setShowScheduleModal(false)}
                >
                  <Text style={styles.scheduleModalCancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.scheduleModalSaveButton}
                  onPress={() => setShowScheduleModal(false)}
                >
                  <Text style={styles.scheduleModalSaveButtonText}>Guardar Horario</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal del Selector de Hora */}
        <Modal
          visible={showTimePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.timePickerModalContent}>
              <View style={styles.timePickerModalHeader}>
                <Text style={styles.timePickerModalTitle}>
                  Seleccionar Hora - {selectedField === 'open' ? 'Apertura' : 'Cierre'}
                </Text>
                <TouchableOpacity 
                  style={styles.timePickerModalCloseButton}
                  onPress={() => setShowTimePicker(false)}
                >
                  <Ionicons name="close" size={24} color={COLOR_PALETTE.text.secondary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.timePickerContainer}>
                <View style={styles.timePickerColumn}>
                  <Text style={styles.timePickerLabel}>Hora</Text>
                  <ScrollView 
                    style={styles.timePickerScroll} 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.timePickerContent}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                      <TouchableOpacity
                        key={hour}
                        style={[
                          styles.timePickerItem,
                          selectedHour === hour && styles.timePickerItemSelected
                        ]}
                        onPress={() => setSelectedHour(hour)}
                      >
                        <Text style={[
                          styles.timePickerItemText,
                          selectedHour === hour && styles.timePickerItemTextSelected
                        ]}>
                          {hour}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.timePickerColumn}>
                  <Text style={styles.timePickerLabel}>Minuto</Text>
                  <ScrollView 
                    style={styles.timePickerScroll} 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.timePickerContent}
                  >
                    {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                      <TouchableOpacity
                        key={minute}
                        style={[
                          styles.timePickerItem,
                          selectedMinute === minute && styles.timePickerItemSelected
                        ]}
                        onPress={() => setSelectedMinute(minute)}
                      >
                        <Text style={[
                          styles.timePickerItemText,
                          selectedMinute === minute && styles.timePickerItemTextSelected
                        ]}>
                          {minute.toString().padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.timePickerColumn}>
                  <Text style={styles.timePickerLabel}>AM/PM</Text>
                  <ScrollView 
                    style={styles.timePickerScroll} 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.timePickerContent}
                  >
                    {['AM', 'PM'].map((ampm) => (
                      <TouchableOpacity
                        key={ampm}
                        style={[
                          styles.timePickerItem,
                          selectedAmPm === ampm && styles.timePickerItemSelected
                        ]}
                        onPress={() => setSelectedAmPm(ampm)}
                      >
                        <Text style={[
                          styles.timePickerItemText,
                          selectedAmPm === ampm && styles.timePickerItemTextSelected
                        ]}>
                          {ampm}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.timePickerModalFooter}>
                <TouchableOpacity 
                  style={styles.timePickerModalCancelButton}
                  onPress={() => setShowTimePicker(false)}
                >
                  <Text style={styles.timePickerModalCancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.timePickerModalSaveButton}
                  onPress={saveTimeSelection}
                >
                  <Text style={styles.timePickerModalSaveButtonText}>Seleccionar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Overlay de carga durante el guardado */}
        {saving && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4ADE80" />
              <Text style={styles.loadingText}>Actualizando perfil...</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOR_PALETTE.background.secondary,
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLOR_PALETTE.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLOR_PALETTE.gray[200],
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLOR_PALETTE.gray[100],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLOR_PALETTE.text.primary,
    marginLeft: 12,
    flex: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLOR_PALETTE.primary,
  },
  saveButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  saveButtonSaving: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonTextDisabled: {
    color: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLOR_PALETTE.background.primary,
    marginLeft: 4,
  },
  placeholderButton: {
    width: 80,
    height: 40,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLOR_PALETTE.gray[100],
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 'auto',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLOR_PALETTE.gray[100],
    borderWidth: 1,
    borderColor: COLOR_PALETTE.primary,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLOR_PALETTE.primary,
    marginLeft: 4,
  },
  editModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLOR_PALETTE.primary,
  },
  editModeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLOR_PALETTE.background.primary,
    marginLeft: 4,
  },
  loadingText: {
    fontSize: 16,
    color: COLOR_PALETTE.text.secondary,
    marginTop: 8,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Espacio para evitar solapamiento con navegación
  },
  imageSection: {
    backgroundColor: COLOR_PALETTE.background.primary,
    marginBottom: 16,
  },
  coverImageContainer: {
    height: 120,
    position: 'relative',
  },
  coverImageButton: {
    width: '100%',
    height: '100%',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR_PALETTE.gray[100],
  },
  coverImageText: {
    fontSize: 14,
    color: COLOR_PALETTE.text.light,
    marginTop: 8,
    fontWeight: '500',
  },
  removeCoverButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLOR_PALETTE.background.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  removeCoverText: {
    fontSize: 12,
    color: COLOR_PALETTE.red,
    marginLeft: 4,
    fontWeight: '500',
  },
  logoContainer: {
    position: 'absolute',
    bottom: -40,
    left: 20,
    alignItems: 'center',
  },
  logoButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: COLOR_PALETTE.background.primary,
    backgroundColor: COLOR_PALETTE.gray[100],
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR_PALETTE.gray[100],
  },
  logoText: {
    fontSize: 10,
    color: COLOR_PALETTE.text.light,
    marginTop: 2,
  },
  removeLogoButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLOR_PALETTE.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  formContainer: {
    marginTop: 50,
    paddingHorizontal: 16,
  },
  sectionContainer: {
    backgroundColor: COLOR_PALETTE.background.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLOR_PALETTE.text.primary,
    marginBottom: 2,
  },
  sectionSubtext: {
    fontSize: 12,
    color: COLOR_PALETTE.text.secondary,
    marginBottom: 6,
    lineHeight: 16,
  },
  sectionUnderline: {
    height: 2,
    backgroundColor: COLOR_PALETTE.primary,
    borderRadius: 1,
    marginBottom: 16,
    width: 30,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLOR_PALETTE.text.primary,
    marginBottom: 8,
    backgroundColor: COLOR_PALETTE.background.primary,
    paddingHorizontal: 4,
    alignSelf: 'flex-start',
    zIndex: 1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLOR_PALETTE.gray[200],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: COLOR_PALETTE.text.primary,
    backgroundColor: COLOR_PALETTE.background.primary,
  },
  inputError: {
    borderColor: COLOR_PALETTE.red,
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  characterCount: {
    fontSize: 11,
    color: COLOR_PALETTE.text.light,
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    color: COLOR_PALETTE.red,
    fontSize: 12,
    marginTop: 4,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLOR_PALETTE.gray[100],
    borderWidth: 1,
    borderColor: COLOR_PALETTE.gray[200],
  },
  categoryChipSelected: {
    backgroundColor: COLOR_PALETTE.primary,
    borderColor: COLOR_PALETTE.primary,
  },
  categoryChipText: {
    fontSize: 12,
    color: COLOR_PALETTE.text.secondary,
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: COLOR_PALETTE.background.primary,
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
  },
  addCategoryButtonText: {
    fontSize: 14,
    color: COLOR_PALETTE.primary,
    marginLeft: 6,
    fontWeight: '500',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLOR_PALETTE.gray[200],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: COLOR_PALETTE.background.primary,
  },
  locationButtonText: {
    flex: 1,
    fontSize: 16,
    color: COLOR_PALETTE.text.primary,
    marginLeft: 8,
  },
  departmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  departmentText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  editButtonContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  editInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR_PALETTE.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: COLOR_PALETTE.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  editInfoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLOR_PALETTE.background.primary,
    marginLeft: 8,
  },
  cancelButtonContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR_PALETTE.background.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLOR_PALETTE.red,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLOR_PALETTE.red,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLOR_PALETTE.background.primary,
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLOR_PALETTE.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLOR_PALETTE.gray[200],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLOR_PALETTE.text.primary,
    backgroundColor: COLOR_PALETTE.background.primary,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modalCancelButtonText: {
    fontSize: 14,
    color: COLOR_PALETTE.text.secondary,
    fontWeight: '500',
  },
  modalAddButton: {
    backgroundColor: COLOR_PALETTE.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modalAddButtonText: {
    fontSize: 14,
    color: COLOR_PALETTE.background.primary,
    fontWeight: '600',
  },
  // Estilos para el sistema de horario
  scheduleDayContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: COLOR_PALETTE.gray[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLOR_PALETTE.gray[200],
  },
  scheduleDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleDayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLOR_PALETTE.gray[300],
    backgroundColor: COLOR_PALETTE.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: COLOR_PALETTE.primary,
    borderColor: COLOR_PALETTE.primary,
  },
  scheduleDayLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLOR_PALETTE.text.secondary,
  },
  scheduleDayLabelEnabled: {
    color: COLOR_PALETTE.text.primary,
    fontWeight: '600',
  },
  scheduleTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingLeft: 32,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: COLOR_PALETTE.text.secondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: COLOR_PALETTE.gray[200],
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLOR_PALETTE.text.primary,
    backgroundColor: COLOR_PALETTE.background.primary,
    textAlign: 'center',
  },
  timeInputDisabled: {
    backgroundColor: COLOR_PALETTE.gray[100],
    color: COLOR_PALETTE.text.light,
  },
  timeSeparator: {
    fontSize: 16,
    color: COLOR_PALETTE.text.secondary,
    marginHorizontal: 12,
    fontWeight: '500',
  },
  // Estilos para el botón del sistema de horario
  scheduleButton: {
    backgroundColor: COLOR_PALETTE.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLOR_PALETTE.gray[200],
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scheduleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  scheduleButtonText: {
    flex: 1,
    marginLeft: 12,
  },
  scheduleButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLOR_PALETTE.text.primary,
    marginBottom: 2,
  },
  scheduleButtonSubtitle: {
    fontSize: 14,
    color: COLOR_PALETTE.text.secondary,
  },
  schedulePreview: {
    backgroundColor: COLOR_PALETTE.gray[50],
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLOR_PALETTE.gray[200],
    marginBottom: 20, // Espacio extra para evitar solapamiento
    zIndex: 1,
    elevation: 1,
  },
  schedulePreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLOR_PALETTE.text.primary,
    marginBottom: 4,
  },
  schedulePreviewContent: {
    marginTop: 8,
  },
  schedulePreviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLOR_PALETTE.gray[100],
  },
  schedulePreviewDay: {
    fontSize: 14,
    fontWeight: '600',
    color: COLOR_PALETTE.text.primary,
    flex: 1,
  },
  schedulePreviewTime: {
    fontSize: 13,
    color: COLOR_PALETTE.text.secondary,
    fontWeight: '500',
  },
  schedulePreviewEmpty: {
    fontSize: 13,
    color: COLOR_PALETTE.text.light,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  // Estilos para el modal del sistema de horario
  scheduleModalContent: {
    backgroundColor: COLOR_PALETTE.background.primary,
    borderRadius: 16,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  scheduleModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLOR_PALETTE.gray[200],
  },
  scheduleModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLOR_PALETTE.text.primary,
  },
  scheduleModalCloseButton: {
    padding: 4,
  },
  scheduleModalBody: {
    maxHeight: 400,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  scheduleModalSubtitle: {
    fontSize: 14,
    color: COLOR_PALETTE.text.secondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  scheduleModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLOR_PALETTE.gray[200],
    gap: 12,
  },
  scheduleModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLOR_PALETTE.gray[300],
    alignItems: 'center',
  },
  scheduleModalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLOR_PALETTE.text.secondary,
  },
  scheduleModalSaveButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLOR_PALETTE.primary,
  },
  scheduleModalSaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLOR_PALETTE.background.primary,
  },
  // Estilos para el botón de hora
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLOR_PALETTE.gray[200],
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLOR_PALETTE.background.primary,
  },
  timeButtonText: {
    fontSize: 14,
    color: COLOR_PALETTE.text.primary,
    fontWeight: '500',
  },
  // Estilos para el modal del selector de hora
  timePickerModalContent: {
    backgroundColor: COLOR_PALETTE.background.primary,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  timePickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLOR_PALETTE.gray[200],
  },
  timePickerModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLOR_PALETTE.text.primary,
    flex: 1,
  },
  timePickerModalCloseButton: {
    padding: 4,
  },
  timePickerContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    height: 300,
  },
  timePickerColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  timePickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLOR_PALETTE.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  timePickerScroll: {
    flex: 1,
  },
  timePickerContent: {
    paddingVertical: 20,
  },
  timePickerItem: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLOR_PALETTE.gray[50],
    borderWidth: 1,
    borderColor: COLOR_PALETTE.gray[200],
  },
  timePickerItemSelected: {
    backgroundColor: COLOR_PALETTE.primary,
    borderColor: COLOR_PALETTE.primary,
    shadowColor: COLOR_PALETTE.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  timePickerItemText: {
    fontSize: 18,
    fontWeight: '500',
    color: COLOR_PALETTE.text.primary,
  },
  timePickerItemTextSelected: {
    color: COLOR_PALETTE.background.primary,
    fontWeight: '700',
    fontSize: 20,
  },
  timePickerModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLOR_PALETTE.gray[200],
    gap: 12,
  },
  timePickerModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLOR_PALETTE.gray[300],
    alignItems: 'center',
  },
  timePickerModalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLOR_PALETTE.text.secondary,
  },
  timePickerModalSaveButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLOR_PALETTE.primary,
  },
  timePickerModalSaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLOR_PALETTE.background.primary,
  },
});

export default CentroTuristicoProfileScreen;