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
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig.js';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components';
import { 
  validateName, 
  validateLastName, 
  validatePhone,
  validateDocumentType,
  validateDocumentNumber,
  validateResidence,
  formatCedula
} from '../../utils/validations';
import { uploadImage } from '../../services/imageStorage';

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

const TuristaProfileScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState(null);
  const [errors, setErrors] = useState({});
  const readOnly = route?.params?.readOnly === true;
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    documentType: '',
    documentNumber: '',
    city: '',
    country: '',
    profileImage: null,
    coverImage: null,
  });
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // Lista de ciudades principales de Nicaragua
  const nicaraguaCities = [
    'Managua', 'León', 'Chinandega', 'Masaya', 'Granada', 'Estelí', 
    'Matagalpa', 'Jinotega', 'Rivas', 'Boaco', 'Carazo', 'Chontales',
    'Madriz', 'Nueva Segovia', 'Río San Juan', 'Bluefields', 'Puerto Cabezas',
    'San Carlos', 'Ocotal', 'Somoto', 'Jinotepe', 'Diriamba', 'Masatepe',
    'Nandaime', 'Ticuantepe', 'Tipitapa', 'Ciudad Sandino', 'El Crucero'
  ];

  // Lista de países de Centroamérica y otros
  const countries = [
    'Nicaragua', 'Costa Rica', 'Honduras', 'El Salvador', 'Guatemala', 
    'Belice', 'Panamá', 'México', 'Estados Unidos', 'Canadá', 'España',
    'Colombia', 'Venezuela', 'Argentina', 'Chile', 'Perú', 'Brasil',
    'Ecuador', 'Uruguay', 'Paraguay', 'Bolivia', 'República Dominicana',
    'Cuba', 'Puerto Rico', 'Jamaica', 'Haití', 'Otro'
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  // Detectar cambios en el formulario
  useEffect(() => {
    if (userData) {
      const hasFormChanges = 
        formData.firstName !== (userData.nombres || userData.firstName || '') ||
        formData.lastName !== (userData.apellidos || userData.lastName || '') ||
        formData.phone !== (userData.telefono || userData.phone || '') ||
        formData.documentType !== (userData.tipoDocumento || userData.documentType || '') ||
        formData.documentNumber !== (userData.numeroDocumento || userData.documentNumber || '') ||
        formData.city !== (userData.ciudad || userData.city || '') ||
        formData.country !== (userData.pais || userData.country || '') ||
        (formData.profileImage?.uri && formData.profileImage.uri !== userData.imagenPerfil) ||
        (formData.coverImage?.uri && formData.coverImage.uri !== userData.imagenPortada);
      
      setHasChanges(hasFormChanges);
    }
  }, [formData, userData]);

  // Función para manejar el botón atrás
  const handleBackPress = () => {
    if (hasChanges) {
      Alert.alert(
        'Cambios sin guardar',
        'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Salir',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const loadUserData = async () => {
    try {
      if (authUser) {
        const userDoc = await getDoc(doc(db, 'turistas', authUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          
          // Llenar el formulario con los datos existentes
          setFormData({
            firstName: data.nombres || data.firstName || '',
            lastName: data.apellidos || data.lastName || '',
            phone: data.telefono || data.phone || '',
            documentType: data.tipoDocumento || data.documentType || '',
            documentNumber: data.numeroDocumento || data.documentNumber || '',
            city: data.ciudad || data.city || '',
            country: data.pais || data.country || '',
            profileImage: data.imagenPerfil ? { uri: data.imagenPerfil } : null,
            coverImage: data.portada ? { uri: data.portada } : null,
          });
        }
      }
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del perfil');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (type = 'profile') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos', 'Se necesitan permisos para acceder a la galería');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'profile' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      const field = type === 'profile' ? 'profileImage' : 'coverImage';
      setFormData(prev => ({ ...prev, [field]: result.assets[0] }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    const firstNameValidation = validateName(formData.firstName);
    if (!firstNameValidation.isValid) {
      newErrors.firstName = firstNameValidation.message;
    }

    const lastNameValidation = validateLastName(formData.lastName);
    if (!lastNameValidation.isValid) {
      newErrors.lastName = lastNameValidation.message;
    }

    if (formData.phone) {
      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation.isValid) {
        newErrors.phone = phoneValidation.message;
      }
    }

    if (formData.documentType) {
      const documentTypeValidation = validateDocumentType(formData.documentType);
      if (!documentTypeValidation.isValid) {
        newErrors.documentType = documentTypeValidation.message;
      }
    }

    if (formData.documentNumber) {
      const documentNumberValidation = validateDocumentNumber(formData.documentNumber, formData.documentType);
      if (!documentNumberValidation.isValid) {
        newErrors.documentNumber = documentNumberValidation.message;
      }
    }

    if (formData.city) {
      const cityValidation = validateResidence(formData.city);
      if (!cityValidation.isValid) {
        newErrors.city = cityValidation.message;
      }
    }
    
    if (formData.country) {
      const countryValidation = validateResidence(formData.country);
      if (!countryValidation.isValid) {
        newErrors.country = countryValidation.message;
      }
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
      let profileImageUrl = userData?.imagenPerfil || null;
      let coverImageUrl = userData?.portada || null;

      // Subir imagen de perfil si es nueva
      if (formData.profileImage && !formData.profileImage.uri?.startsWith('http')) {
        try {
          const profileResult = await uploadImage(formData.profileImage.uri, `turistas/${authUser.uid}/profile`, authUser.uid);
          if (profileResult.success) {
            profileImageUrl = profileResult.url;
          }
        } catch (error) {
          console.error('Error subiendo imagen de perfil:', error);
        }
      }

      // Subir imagen de portada si es nueva
      if (formData.coverImage && !formData.coverImage.uri?.startsWith('http')) {
        try {
          const coverResult = await uploadImage(formData.coverImage.uri, `turistas/${authUser.uid}/cover`, authUser.uid);
          if (coverResult.success) {
            coverImageUrl = coverResult.url;
          }
        } catch (error) {
          console.error('Error subiendo imagen de portada:', error);
        }
      }

      // Actualizar datos en Firestore usando los nombres correctos de los campos
      const updateData = {
        nombres: formData.firstName,
        apellidos: formData.lastName,
        telefono: formData.phone,
        tipoDocumento: formData.documentType,
        numeroDocumento: formData.documentNumber,
        ciudad: formData.city,
        pais: formData.country,
        residencia: formData.city && formData.country ? `${formData.city}, ${formData.country}` : '',
        imagenPerfil: profileImageUrl,
        portada: coverImageUrl,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, 'turistas', authUser.uid), updateData);
      
      // Resetear el estado de cambios después de guardar exitosamente
      setHasChanges(false);
      
      // Notificar al HomeScreen que se actualizaron los datos
      if (route?.params?.onProfileUpdate) {
        console.log('TuristaProfileScreen - Ejecutando callback onProfileUpdate');
        route.params.onProfileUpdate();
      } else {
        console.log('TuristaProfileScreen - No hay callback onProfileUpdate disponible');
      }
      
      Alert.alert(
        'Éxito',
        'Tu perfil ha sido actualizado correctamente'
      );
    } catch (error) {
      console.error('Error guardando perfil:', error);
      Alert.alert('Error', 'No se pudo guardar el perfil. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const formatPhoneNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const limited = cleaned.slice(0, 8);
    if (limited.length <= 4) {
      return limited;
    } else {
      return `${limited.slice(0, 4)} ${limited.slice(4)}`;
    }
  };

  const validateAlphabetic = (text) => {
    return text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
  };

  const handleInputChange = (field, value) => {
    let processedValue = value;
    
    switch (field) {
      case 'firstName':
      case 'lastName':
        processedValue = validateAlphabetic(value).slice(0, 50);
        break;
      case 'phone':
        processedValue = formatPhoneNumber(value);
        break;
      case 'documentNumber':
        if (formData.documentType === 'cedula') {
          processedValue = formatCedula(value);
        } else {
          processedValue = value.slice(0, 12);
        }
        break;
      case 'city':
      case 'country':
        processedValue = value.slice(0, 30);
        break;
      default:
        processedValue = value;
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLOR_PALETTE.primary} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Ionicons name="arrow-back" size={24} color={COLOR_PALETTE.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <View style={styles.headerButtons}>
          {!readOnly && (
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
          )}
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Sección de imágenes */}
          <View style={styles.imageSection}>
            {/* Imagen de portada */}
            <View style={styles.coverImageContainer}>
              <TouchableOpacity 
                style={styles.coverImageButton} 
                onPress={!readOnly ? () => pickImage('cover') : undefined}
                disabled={readOnly}
              >
                {formData.coverImage ? (
                  <Image 
                    source={{ uri: typeof formData.coverImage.uri === 'string' ? formData.coverImage.uri : String(formData.coverImage.uri) }} 
                    style={styles.coverImage} 
                  />
                ) : (
                  <View style={styles.coverImagePlaceholder}>
                    <Ionicons name="image" size={32} color={COLOR_PALETTE.text.light} />
                    <Text style={styles.coverImageText}>
                      {'Agregar portada'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {formData.coverImage && !readOnly && (
                <TouchableOpacity 
                  style={styles.removeCoverButton} 
                  onPress={() => setFormData(prev => ({ ...prev, coverImage: null }))}
                >
                  <Ionicons name="close-circle" size={20} color={COLOR_PALETTE.red} />
                  <Text style={styles.removeCoverText}>Eliminar</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Imagen de perfil */}
            <View style={styles.profileImageContainer}>
              <TouchableOpacity 
                style={styles.profileImageButton} 
                onPress={!readOnly ? () => pickImage('profile') : undefined}
                disabled={readOnly}
              >
                {formData.profileImage ? (
                  <Image 
                    source={{ uri: typeof formData.profileImage.uri === 'string' ? formData.profileImage.uri : String(formData.profileImage.uri) }} 
                    style={styles.profileImage} 
                  />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Ionicons name="camera" size={24} color={COLOR_PALETTE.text.light} />
                    <Text style={styles.profileImageText}>
                      {'Foto'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {formData.profileImage && !readOnly && (
                <TouchableOpacity 
                  style={styles.removeImageButton} 
                  onPress={() => setFormData(prev => ({ ...prev, profileImage: null }))}
                >
                  <Ionicons name="close-circle" size={16} color={COLOR_PALETTE.red} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            {/* Información básica */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Información Básica</Text>
              <View style={styles.sectionUnderline} />
              
              <View style={styles.inputContainer}>
                <Input
                  label="Nombres"
                  placeholder="Tus nombres"
                  value={formData.firstName}
                  onChangeText={(value) => handleInputChange('firstName', value)}
                  autoCapitalize="words"
                  error={errors.firstName}
                  leftIcon="person"
                  editable={!readOnly}
                />
                <Text style={styles.characterCount}>
                  {(formData.firstName || '').length}/50
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Input
                  label="Apellidos"
                  placeholder="Tus apellidos"
                  value={formData.lastName}
                  onChangeText={(value) => handleInputChange('lastName', value)}
                  autoCapitalize="words"
                  error={errors.lastName}
                  leftIcon="person"
                  editable={!readOnly}
                />
                <Text style={styles.characterCount}>
                  {(formData.lastName || '').length}/50
                </Text>
              </View>
            </View>

            {/* Información de contacto */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Información de Contacto</Text>
              <View style={styles.sectionUnderline} />
              
              <View style={styles.inputContainer}>
                <Input
                  label="Número de Teléfono"
                  placeholder="#### ####"
                  value={formData.phone}
                  onChangeText={(value) => handleInputChange('phone', value)}
                  keyboardType="phone-pad"
                  error={errors.phone}
                  leftIcon="call"
                  editable={!readOnly}
                />
                <Text style={styles.characterCount}>
                  {(formData.phone || '').replace(/\s/g, '').length}/8
                </Text>
              </View>
            </View>

            {/* Documentación */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Documentación</Text>
              <View style={styles.sectionUnderline} />
              
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Tipo de Documento</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={formData.documentType}
                    style={[styles.picker, readOnly && styles.pickerDisabled]}
                    onValueChange={!readOnly ? (value) => {
                      handleInputChange('documentType', value);
                      if (value !== formData.documentType) {
                        setFormData(prev => ({ ...prev, documentNumber: '' }));
                      }
                    } : undefined}
                    enabled={!readOnly}
                  >
                    <Picker.Item label="Selecciona un tipo de documento" value="" />
                    <Picker.Item label="Cédula de Identidad" value="cedula" />
                    <Picker.Item label="Pasaporte" value="pasaporte" />
                  </Picker>
                  <Ionicons name="chevron-down" size={20} color={COLOR_PALETTE.text.light} style={styles.pickerIcon} />
                </View>
                {errors.documentType && <Text style={styles.errorText}>{errors.documentType}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Input
                  label="Número de Documento"
                  placeholder={formData.documentType === 'cedula' ? "Ej. 001-080800-0000A" : "Ej. A1234567"}
                  value={formData.documentNumber}
                  onChangeText={(value) => handleInputChange('documentNumber', value)}
                  error={errors.documentNumber}
                  leftIcon="card"
                  editable={!readOnly}
                />
              </View>
            </View>

            {/* Ubicación */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Ubicación</Text>
              <Text style={styles.sectionSubtext}>Indica tu lugar de residencia actual</Text>
              <View style={styles.sectionUnderline} />
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Ciudad *</Text>
                <TouchableOpacity 
                  style={[styles.selectorButton, errors.city && styles.selectorButtonError]}
                  onPress={() => !readOnly && setShowCityPicker(true)}
                  disabled={readOnly}
                >
                  <View style={styles.selectorContent}>
                    <Ionicons name="location" size={20} color="#6B7280" />
                    <Text style={[styles.selectorText, !formData.city && styles.selectorPlaceholder]}>
                      {formData.city || 'Seleccionar ciudad'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                  </View>
                </TouchableOpacity>
                {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>País *</Text>
                <TouchableOpacity 
                  style={[styles.selectorButton, errors.country && styles.selectorButtonError]}
                  onPress={() => !readOnly && setShowCountryPicker(true)}
                  disabled={readOnly}
                >
                  <View style={styles.selectorContent}>
                    <Ionicons name="globe" size={20} color="#6B7280" />
                    <Text style={[styles.selectorText, !formData.country && styles.selectorPlaceholder]}>
                      {formData.country || 'Seleccionar país'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                  </View>
                </TouchableOpacity>
                {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}
              </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Overlay de carga durante el guardado */}
      {saving && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4ADE80" />
            <Text style={styles.loadingText}>Actualizando perfil...</Text>
          </View>
        </View>
      )}

      {/* Modal para seleccionar ciudad */}
      <Modal
        visible={showCityPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Ciudad</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowCityPicker(false)}
            >
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {nicaraguaCities.map((city) => (
              <TouchableOpacity
                key={city}
                style={[
                  styles.optionItem,
                  formData.city === city && styles.selectedOptionItem
                ]}
                onPress={() => {
                  handleInputChange('city', city);
                  setShowCityPicker(false);
                }}
              >
                <Text style={[
                  styles.optionText,
                  formData.city === city && styles.selectedOptionText
                ]}>
                  {city}
                </Text>
                {formData.city === city && (
                  <Ionicons name="checkmark" size={20} color="#3B82F6" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Modal para seleccionar país */}
      <Modal
        visible={showCountryPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar País</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowCountryPicker(false)}
            >
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {countries.map((country) => (
              <TouchableOpacity
                key={country}
                style={[
                  styles.optionItem,
                  formData.country === country && styles.selectedOptionItem
                ]}
                onPress={() => {
                  handleInputChange('country', country);
                  setShowCountryPicker(false);
                }}
              >
                <Text style={[
                  styles.optionText,
                  formData.country === country && styles.selectedOptionText
                ]}>
                  {country}
                </Text>
                {formData.country === country && (
                  <Ionicons name="checkmark" size={20} color="#3B82F6" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOR_PALETTE.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginLeft: 8,
    flex: 1,
  },
  headerButtons: {
    position: 'absolute',
    right: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLOR_PALETTE.primary,
  },
  saveButtonDisabled: {
    backgroundColor: COLOR_PALETTE.gray[300],
  },
  saveButtonSaving: {
    backgroundColor: COLOR_PALETTE.primary,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLOR_PALETTE.background.primary,
    marginLeft: 4,
  },
  saveButtonTextDisabled: {
    color: '#9CA3AF',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLOR_PALETTE.gray[100],
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
    paddingBottom: 30, // Margen al final del formulario
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
  profileImageContainer: {
    position: 'absolute',
    bottom: -40,
    left: 20,
    alignItems: 'center',
  },
  profileImageButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: COLOR_PALETTE.background.primary,
    backgroundColor: COLOR_PALETTE.gray[100],
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR_PALETTE.gray[100],
  },
  profileImageText: {
    fontSize: 10,
    color: COLOR_PALETTE.text.light,
    marginTop: 2,
  },
  removeImageButton: {
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
  characterCount: {
    fontSize: 11,
    color: COLOR_PALETTE.text.light,
    textAlign: 'right',
    marginTop: 4,
    marginRight: 4,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLOR_PALETTE.text.primary,
    marginBottom: 8,
  },
  pickerWrapper: {
    position: 'relative',
    backgroundColor: COLOR_PALETTE.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLOR_PALETTE.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  picker: {
    height: 50,
    color: COLOR_PALETTE.text.primary,
  },
  pickerIcon: {
    position: 'absolute',
    right: 16,
    top: 15,
    pointerEvents: 'none',
  },
  errorText: {
    color: COLOR_PALETTE.red,
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  pickerDisabled: {
    opacity: 0.6,
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
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: COLOR_PALETTE.text.primary,
    textAlign: 'center',
  },
  // Estilos para selectores
  selectorButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  selectorButtonError: {
    borderColor: '#EF4444',
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  selectorPlaceholder: {
    color: '#9CA3AF',
  },
  // Estilos para modales
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  optionItem: {
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
  selectedOptionItem: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
  },
  optionText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  selectedOptionText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});

export default TuristaProfileScreen;
