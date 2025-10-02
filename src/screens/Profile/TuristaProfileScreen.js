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
  const [isEditing, setIsEditing] = useState(false);

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

  useEffect(() => {
    loadUserData();
  }, []);

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

    setSaving(true);
    try {
      let profileImageUrl = userData?.imagenPerfil || null;
      let coverImageUrl = userData?.portada || null;

      // Subir imagen de perfil si es nueva
      if (formData.profileImage && !formData.profileImage.uri?.startsWith('http')) {
        try {
          profileImageUrl = await uploadImage(formData.profileImage.uri, `profiles/${authUser.uid}/profile`);
        } catch (error) {
          console.error('Error subiendo imagen de perfil:', error);
        }
      }

      // Subir imagen de portada si es nueva
      if (formData.coverImage && !formData.coverImage.uri?.startsWith('http')) {
        try {
          coverImageUrl = await uploadImage(formData.coverImage.uri, `profiles/${authUser.uid}/cover`);
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

      setIsEditing(false);
      
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
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLOR_PALETTE.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        {isEditing ? (
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLOR_PALETTE.primary} />
            ) : (
              <Text style={styles.saveButtonText}>Guardar</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <Ionicons name="pencil" size={16} color={COLOR_PALETTE.primary} />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Sección de imágenes */}
          <View style={styles.imageSection}>
            {/* Imagen de portada */}
            <View style={styles.coverImageContainer}>
              <TouchableOpacity 
                style={styles.coverImageButton} 
                onPress={isEditing ? () => pickImage('cover') : undefined}
                disabled={!isEditing}
              >
                {formData.coverImage ? (
                  <Image source={{ uri: formData.coverImage.uri }} style={styles.coverImage} />
                ) : (
                  <View style={styles.coverImagePlaceholder}>
                    <Ionicons name="image" size={32} color={COLOR_PALETTE.text.light} />
                    <Text style={styles.coverImageText}>
                      {isEditing ? 'Agregar portada' : 'Sin portada'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {formData.coverImage && isEditing && (
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
                onPress={isEditing ? () => pickImage('profile') : undefined}
                disabled={!isEditing}
              >
                {formData.profileImage ? (
                  <Image source={{ uri: formData.profileImage.uri }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Ionicons name="camera" size={24} color={COLOR_PALETTE.text.light} />
                    <Text style={styles.profileImageText}>
                      {isEditing ? 'Foto' : 'Sin foto'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {formData.profileImage && isEditing && (
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
                  onChangeText={isEditing ? (value) => handleInputChange('firstName', value) : undefined}
                  autoCapitalize="words"
                  error={errors.firstName}
                  leftIcon="person"
                  editable={isEditing}
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
                  onChangeText={isEditing ? (value) => handleInputChange('lastName', value) : undefined}
                  autoCapitalize="words"
                  error={errors.lastName}
                  leftIcon="person"
                  editable={isEditing}
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
                  onChangeText={isEditing ? (value) => handleInputChange('phone', value) : undefined}
                  keyboardType="phone-pad"
                  error={errors.phone}
                  leftIcon="call"
                  editable={isEditing}
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
                    style={[styles.picker, !isEditing && styles.pickerDisabled]}
                    onValueChange={isEditing ? (value) => {
                      handleInputChange('documentType', value);
                      if (value !== formData.documentType) {
                        setFormData(prev => ({ ...prev, documentNumber: '' }));
                      }
                    } : undefined}
                    enabled={isEditing}
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
                  onChangeText={isEditing ? (value) => handleInputChange('documentNumber', value) : undefined}
                  error={errors.documentNumber}
                  leftIcon="card"
                  editable={isEditing}
                />
              </View>
            </View>

            {/* Ubicación */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Ubicación</Text>
              <Text style={styles.sectionSubtext}>Indica tu lugar de residencia actual</Text>
              <View style={styles.sectionUnderline} />
              
              <View style={styles.inputContainer}>
                <Input
                  label="Ciudad"
                  placeholder="Ej. Managua, Granada, León..."
                  value={formData.city}
                  onChangeText={isEditing ? (value) => handleInputChange('city', value) : undefined}
                  error={errors.city}
                  leftIcon="location"
                  editable={isEditing}
                />
                <Text style={styles.characterCount}>
                  {(formData.city || '').length}/30
                </Text>
              </View>
              
              <View style={styles.inputContainer}>
                <Input
                  label="País"
                  placeholder="Ej. Nicaragua, Costa Rica, Honduras..."
                  value={formData.country}
                  onChangeText={isEditing ? (value) => handleInputChange('country', value) : undefined}
                  error={errors.country}
                  leftIcon="globe"
                  editable={isEditing}
                />
                <Text style={styles.characterCount}>
                  {(formData.country || '').length}/30
                </Text>
              </View>
            </View>

            {/* Botón de editar información */}
            {!isEditing && (
              <View style={styles.editButtonContainer}>
                <TouchableOpacity 
                  style={styles.editInfoButton}
                  onPress={() => setIsEditing(true)}
                >
                  <Ionicons name="pencil" size={20} color={COLOR_PALETTE.background.primary} />
                  <Text style={styles.editInfoButtonText}>Editar Información</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Botón de cancelar edición */}
            {isEditing && (
              <View style={styles.cancelButtonContainer}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsEditing(false);
                    setErrors({});
                    // Recargar los datos originales
                    loadUserData();
                  }}
                >
                  <Ionicons name="close" size={20} color={COLOR_PALETTE.red} />
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLOR_PALETTE.primary,
  },
  saveButtonDisabled: {
    backgroundColor: COLOR_PALETTE.gray[300],
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLOR_PALETTE.background.primary,
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
});

export default TuristaProfileScreen;
