import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Input, Button, Stepper, PasswordSecurity, PasswordConfirm } from '../../components';
import { 
  validateName, 
  validateLastName, 
  validateEmail, 
  validatePassword, 
  validateConfirmPassword,
  validatePhone,
  validateDocumentType,
  validateDocumentNumber,
  validateResidence,
  formatCedula
} from '../../utils/validations';
import { getDepartmentFromCoordinates, isWithinNicaragua } from '../../utils/geolocation';
import { registerUser, loginUser } from '../../services/auth.js';
import { useAuth } from '../../contexts/AuthContext';
import { Picker } from '@react-native-picker/picker';
import { Modal } from 'react-native';

const RegisterScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState({
    // Paso 1: básicos
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Paso 2: rol
    role: '', // 'centro_turistico' | 'tourist'
    // Paso 3: turista
    profileImage: null,
    coverImage: null,
    phone: '',
    documentType: '',
    documentNumber: '',
    city: '',
    country: '',
    // Paso 3: centro turístico
    businessName: '',
    businessCategory: [],
    businessEmail: '',
    businessPhone: '',
    businessSchedule: '',
    businessAddress: '',
    businessLatitude: '',
    businessLongitude: '',
    businessDepartment: '',
    businessCost: '',
    businessLogo: null,
    businessCover: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [availableCategories, setAvailableCategories] = useState([
    'Museo', 'Hotel', 'Restaurante', 'Centro Recreativo', 'Galería', 
    'Parque', 'Playa', 'Montaña', 'Ciudad', 'Pueblo'
  ]);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const validateStep1 = () => {
    if (!formData.role) {
      Alert.alert('Error', 'Por favor selecciona un tipo de usuario');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    const firstNameValidation = validateName(formData.firstName);
    if (!firstNameValidation.isValid) {
      newErrors.firstName = firstNameValidation.message;
    }

    const lastNameValidation = validateLastName(formData.lastName);
    if (!lastNameValidation.isValid) {
      newErrors.lastName = lastNameValidation.message;
    }

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.message;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message;
    }

    const confirmPasswordValidation = validateConfirmPassword(formData.password, formData.confirmPassword);
    if (!confirmPasswordValidation.isValid) {
      newErrors.confirmPassword = confirmPasswordValidation.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (formData.role === 'tourist') {
      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation.isValid) {
        newErrors.phone = phoneValidation.message;
      }
      const documentTypeValidation = validateDocumentType(formData.documentType);
      if (!documentTypeValidation.isValid) {
        newErrors.documentType = documentTypeValidation.message;
      }
      const documentNumberValidation = validateDocumentNumber(formData.documentNumber, formData.documentType);
      if (!documentNumberValidation.isValid) {
        newErrors.documentNumber = documentNumberValidation.message;
      }

      const cityValidation = validateResidence(formData.city);
      if (!cityValidation.isValid) {
        newErrors.city = cityValidation.message;
      }
      
      const countryValidation = validateResidence(formData.country);
      if (!countryValidation.isValid) {
        newErrors.country = countryValidation.message;
      }
    } else if (formData.role === 'centro_turistico') {
      if (!formData.businessName) newErrors.businessName = 'Nombre del centro turístico requerido';
      if (!formData.businessCategory || formData.businessCategory.length === 0) newErrors.businessCategory = 'Selecciona al menos una categoría';
      if (!formData.businessEmail) newErrors.businessEmail = 'Email del centro turístico requerido';
      if (!formData.businessPhone) newErrors.businessPhone = 'Teléfono del centro turístico requerido';
    }
    
    // Validar aceptación de términos y condiciones
    if (!acceptTerms) {
      newErrors.acceptTerms = 'Debes aceptar los términos y condiciones para continuar';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const totalSteps = 3;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos', 'Se necesitan permisos para acceder a la galería');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setFormData({ ...formData, profileImage: result.assets[0] });
    }
  };

  const pickCoverImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos', 'Se necesitan permisos para acceder a la galería');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      setFormData({ ...formData, coverImage: result.assets[0] });
    }
  };


  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos', 'Se necesitan permisos para acceder a la galería');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setFormData(prev => ({ ...prev, businessLogo: result.assets[0] }));
    }
  };

  const pickCover = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos', 'Se necesitan permisos para acceder a la galería');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });
    if (!result.canceled) {
      setFormData(prev => ({ ...prev, businessCover: result.assets[0] }));
    }
  };

  const openMapPicker = () => {
    console.log('Abriendo MapPicker...');
    navigation.navigate('MapPicker', {
      initialCoords: (formData.businessLatitude && formData.businessLongitude) ? {
        latitude: Number(formData.businessLatitude),
        longitude: Number(formData.businessLongitude),
      } : undefined,
      onPick: ({ latitude, longitude }) => {
        console.log('Ubicación seleccionada:', { latitude, longitude });
        
        // Determinar departamento automáticamente
        const department = getDepartmentFromCoordinates(latitude, longitude);
        const isInNicaragua = isWithinNicaragua(latitude, longitude);
        
        console.log('Departamento detectado:', department);
        console.log('¿Está en Nicaragua?:', isInNicaragua);
        
        setFormData(prev => ({ 
          ...prev, 
          businessLatitude: String(latitude), 
          businessLongitude: String(longitude),
          businessDepartment: department
        }));
      }
    });
  };

  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    } else if (currentStep === 3 && validateStep3()) {
      handleRegister();
    }
  };

  const getButtonTitle = () => {
    if (currentStep === 1) {
      return 'Continuar';
    } else if (currentStep === 3) {
      return 'Crear Cuenta';
    }
    return 'Siguiente';
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      // Si está en el primer paso, volver al login
      navigation.navigate('Login');
    }
  };

  const handleBackPress = () => {
    if (currentStep > 1) {
      prevStep();
    } else {
      navigation.navigate('Login');
    }
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      // Preparar datos para Firebase
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        ...(formData.role === 'tourist' ? {
          phone: formData.phone,
          documentType: formData.documentType,
          documentNumber: formData.documentNumber,
          city: formData.city,
          country: formData.country,
          residence: `${formData.city}, ${formData.country}`, // Mantener compatibilidad
          profileImage: formData.profileImage,
          coverImage: formData.coverImage
        } : {
          businessName: formData.businessName,
          businessCategory: formData.businessCategory.join(', '),
          businessEmail: formData.businessEmail,
          businessPhone: formData.businessPhone,
          businessSchedule: formData.businessSchedule,
          address: formData.businessAddress,
          latitude: formData.businessLatitude,
          longitude: formData.businessLongitude,
          department: formData.businessDepartment,
          businessCost: formData.businessCost,
          businessLogo: formData.businessLogo,
          businessCover: formData.businessCover
        })
      };

      const result = await registerUser(userData);
      
      if (result.success) {
        // Si es un centro turístico, hacer login automático
        if (formData.role === 'centro_turistico') {
          // Hacer login automático para centro turístico
          const loginResult = await loginUser(formData.email, formData.password, false);
          if (loginResult.success) {
            login(loginResult.user);
            // El AuthNavigator manejará la navegación automáticamente
          } else {
            // Si falla el login automático, mostrar alerta y ir al login
            Alert.alert(
              'Éxito', 
              `¡Bienvenido a Mapu! Tu registro como Centro Turístico se completó exitosamente.`,
              [
                {
                  text: 'Iniciar Sesión',
                  onPress: () => {
                    navigation.navigate('Login');
                  }
                }
              ]
            );
          }
        } else {
          // Para turistas, mostrar alerta y ir al login
          Alert.alert(
            'Éxito', 
            `¡Bienvenido a Mapu! Tu registro como Turista se completó exitosamente.`,
            [
              {
                text: 'Iniciar Sesión',
                onPress: () => {
                  navigation.navigate('Login');
                }
              }
            ]
          );
        }
      } else {
        Alert.alert('Error', result.error || 'Error al registrarse. Inténtalo de nuevo.');
      }
    } catch (error) {
      Alert.alert('Error', 'Error al registrarse. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const selectRole = (role) => {
    setFormData(prev => ({ ...prev, role }));
  };

  // Función para formatear teléfono
  const formatPhoneNumber = (text) => {
    // Remover todos los caracteres no numéricos
    const cleaned = text.replace(/\D/g, '');
    // Limitar a 8 dígitos
    const limited = cleaned.slice(0, 8);
    // Formatear como #### ####
    if (limited.length <= 4) {
      return limited;
    } else {
      return `${limited.slice(0, 4)} ${limited.slice(4)}`;
    }
  };

  // Función para validar solo letras y espacios
  const validateAlphabetic = (text) => {
    return text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
  };

  // Función para validar solo números
  const validateNumeric = (text) => {
    return text.replace(/\D/g, '');
  };

  const handleCategoryToggle = (category) => {
    setFormData(prev => {
      const currentCategories = prev.businessCategory || [];
      
      if (currentCategories.includes(category)) {
        // Si ya está seleccionada, la removemos
        return {
          ...prev,
          businessCategory: currentCategories.filter(cat => cat !== category)
        };
      } else if (currentCategories.length < 3) {
        // Si no está seleccionada y no hemos llegado al límite, la agregamos
        return {
          ...prev,
          businessCategory: [...currentCategories, category]
        };
      }
      
      // Si ya tenemos 3 categorías, no hacemos nada
      return prev;
    });
  };

  const handleAddCustomCategory = () => {
    const trimmedCategory = customCategory.trim();
    if (trimmedCategory && 
        !availableCategories.includes(trimmedCategory) && 
        trimmedCategory.length <= 30) {
      setAvailableCategories(prev => [...prev, trimmedCategory]);
      setCustomCategory('');
      setShowCategoryModal(false);
    } else if (trimmedCategory.length > 30) {
      Alert.alert('Error', 'El nombre de la categoría no puede exceder 30 caracteres.');
    }
  };

  const openCategoryModal = () => {
    setShowCategoryModal(true);
  };

  const handleInputChange = (field, value) => {
    let processedValue = value;
    
    // Aplicar validaciones según el tipo de campo
    switch (field) {
      case 'firstName':
      case 'lastName':
        processedValue = validateAlphabetic(value).slice(0, 50);
        break;
      case 'businessName':
        // Permitir letras, números, espacios, guiones y puntos para nombres de negocios
        processedValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-\.]/g, '').slice(0, 50);
        break;
      case 'phone':
      case 'businessPhone':
        processedValue = formatPhoneNumber(value);
        break;
      case 'documentNumber':
        // Formatear automáticamente si es cédula
        if (formData.documentType === 'cedula') {
          processedValue = formatCedula(value);
        } else {
          processedValue = value.slice(0, 12);
        }
        break;
      case 'businessDescription':
        processedValue = value.slice(0, 200);
        break;
      case 'email':
      case 'businessEmail':
        processedValue = value.slice(0, 100);
        break;
      case 'businessAddress':
        processedValue = value.slice(0, 150);
        break;
      case 'city':
      case 'country':
        processedValue = value.slice(0, 30);
        break;
      case 'password':
      case 'confirmPassword':
        processedValue = value.slice(0, 50);
        break;
      default:
        processedValue = value;
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const stepTitles = ['Tipo de Usuario', 'Datos Básicos', 'Información Adicional'];

  const renderStep1 = () => (
    <View style={styles.form}>
      <Text style={styles.roleTitle}>¿Cómo te defines?</Text>
      <Text style={styles.roleSubtitle}>Selecciona el tipo de usuario que mejor te describa</Text>

      <TouchableOpacity
        style={[styles.roleCard, formData.role === 'centro_turistico' && styles.roleCardSelected]}
        onPress={() => selectRole('centro_turistico')}
      >
        <View style={styles.roleIcon}>
          <Ionicons 
            name="business" 
            size={32} 
            color={formData.role === 'centro_turistico' ? '#3B82F6' : '#6B7280'} 
          />
        </View>
        <View style={styles.roleContent}>
          <Text style={[styles.roleName, formData.role === 'centro_turistico' && styles.roleNameSelected]}>
            Centro Turístico
          </Text>
          <Text style={[styles.roleDescription, formData.role === 'centro_turistico' && styles.roleDescriptionSelected]}>
            Tienes un museo, hotel, centro recreativo o negocio turístico que quieres promocionar
          </Text>
        </View>
        {formData.role === 'centro_turistico' && (
          <View style={styles.roleCheck}>
            <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.roleCard, formData.role === 'tourist' && styles.roleCardSelected]}
        onPress={() => selectRole('tourist')}
      >
        <View style={styles.roleIcon}>
          <Ionicons 
            name="airplane" 
            size={32} 
            color={formData.role === 'tourist' ? '#3B82F6' : '#6B7280'} 
          />
        </View>
        <View style={styles.roleContent}>
          <Text style={[styles.roleName, formData.role === 'tourist' && styles.roleNameSelected]}>
            Turista
          </Text>
          <Text style={[styles.roleDescription, formData.role === 'tourist' && styles.roleDescriptionSelected]}>
            Quieres descubrir nuevos lugares y experiencias auténticas de la zona
          </Text>
        </View>
        {formData.role === 'tourist' && (
          <View style={styles.roleCheck}>
            <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.form}>
      <View style={styles.inputContainer}>
      <Input
        label="Nombres"
        placeholder="Tus nombres"
        value={formData.firstName}
        onChangeText={(value) => handleInputChange('firstName', value)}
        autoCapitalize="words"
        error={errors.firstName}
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
      />
        <Text style={styles.characterCount}>
          {(formData.lastName || '').length}/50
        </Text>
      </View>

      <View style={styles.inputContainer}>
      <Input
        label="Email"
        placeholder="tu@email.com"
        value={formData.email}
        onChangeText={(value) => handleInputChange('email', value)}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        error={errors.email}
      />
        <Text style={styles.characterCount}>
          {(formData.email || '').length}/100
        </Text>
      </View>

      <View style={styles.inputContainer}>
      <Input
        label="Contraseña"
        placeholder="Tu contraseña"
        value={formData.password}
        onChangeText={(value) => handleInputChange('password', value)}
        secureTextEntry
        showPasswordToggle
        error={errors.password}
      />
        <Text style={styles.characterCount}>
          {(formData.password || '').length}/50
        </Text>
      </View>
      
        <PasswordSecurity password={formData.password} />

      <PasswordConfirm
        label="Confirmar contraseña"
        placeholder="Confirma tu contraseña"
        value={formData.confirmPassword}
        onChangeText={(value) => handleInputChange('confirmPassword', value)}
        password={formData.password}
        error={errors.confirmPassword}
      />
    </View>
  );

  const InterestChip = ({ label, selected, onPress }) => (
    <TouchableOpacity onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );


  const renderTouristForm = () => (
    <View style={styles.form}>
      <Text style={[styles.roleTitle, { textAlign: 'left' }]}>Información del Turista</Text>
      <View style={styles.titleUnderline} />
      
      {/* Foto de perfil mejorada */}
      <View style={styles.profileImageContainer}>
        <Text style={styles.profileImageLabel}>Foto de Perfil</Text>
        <View style={styles.profileImageWrapper}>
          <TouchableOpacity style={styles.profileImageButton} onPress={pickImage}>
            {formData.profileImage ? (
              <Image source={{ uri: formData.profileImage.uri }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="camera" size={24} color="#6B7280" />
                <Text style={styles.profileImageText}>Agregar</Text>
              </View>
            )}
          </TouchableOpacity>
          {formData.profileImage && (
            <TouchableOpacity 
              style={styles.removeImageButton} 
              onPress={() => setFormData(prev => ({ ...prev, profileImage: null }))}
            >
              <Ionicons name="close-circle" size={16} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Portada estilo Facebook */}
      <View style={styles.coverImageContainer}>
        <Text style={styles.coverImageLabel}>Portada (Opcional)</Text>
        <TouchableOpacity style={styles.coverImageButton} onPress={pickCoverImage}>
          {formData.coverImage ? (
            <Image source={{ uri: formData.coverImage.uri }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverImagePlaceholder}>
              <Ionicons name="image" size={32} color="#6B7280" />
              <Text style={styles.coverImageText}>Agregar portada</Text>
            </View>
          )}
        </TouchableOpacity>
        {formData.coverImage && (
          <TouchableOpacity 
            style={styles.removeCoverButton} 
            onPress={() => setFormData(prev => ({ ...prev, coverImage: null }))}
          >
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text style={styles.removeCoverText}>Eliminar</Text>
          </TouchableOpacity>
        )}
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
              style={styles.picker}
              onValueChange={(value) => {
                handleInputChange('documentType', value);
                // Limpiar el número de documento cuando cambie el tipo
                if (value !== formData.documentType) {
                  setFormData(prev => ({ ...prev, documentNumber: '' }));
                }
              }}
            >
              <Picker.Item label="Selecciona un tipo de documento" value="" />
              <Picker.Item label="Cédula de Identidad" value="cedula" />
              <Picker.Item label="Pasaporte" value="pasaporte" />
            </Picker>
            <Ionicons name="chevron-down" size={20} color="#6B7280" style={styles.pickerIcon} />
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
          />
        </View>
      </View>

      {/* Ubicación */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Ubicación</Text>
        <Text style={styles.sectionSubtext}>Indica tu lugar de residencia actual</Text>
        <View style={styles.sectionUnderline} />
        
        <View style={styles.locationContainer}>
          <View style={styles.inputContainer}>
            <Input
              label="Ciudad"
              placeholder="Ej. Managua, Granada, León..."
              value={formData.city}
              onChangeText={(value) => handleInputChange('city', value)}
              error={errors.city}
              leftIcon="location"
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
              onChangeText={(value) => handleInputChange('country', value)}
              error={errors.country}
              leftIcon="globe"
            />
            <Text style={styles.characterCount}>
              {(formData.country || '').length}/30
            </Text>
          </View>
        </View>
      </View>

    </View>
  );

  const renderCentroTuristicoForm = () => (
    <View style={styles.form}>
      <Text style={[styles.roleTitle, { textAlign: 'left' }]}>Datos del Centro Turístico</Text>
      <View style={styles.titleUnderline} />
      
      <View style={styles.inputContainer}>
      <Input
        label="Nombre del Centro Turístico"
          placeholder="Ej. Hotel Granada 2024, Centro Recreativo #1, Museo Nacional..."
        value={formData.businessName}
        onChangeText={(value) => handleInputChange('businessName', value)}
        error={errors.businessName}
      />
        <Text style={styles.characterCount}>
          {(formData.businessName || '').length}/50
        </Text>
      </View>

        <View style={styles.categoryContainer}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryLabel}>Categorías</Text>
            <Text style={styles.categoryCounter}>
              {formData.businessCategory?.length || 0}/3
            </Text>
          </View>
          <View style={styles.categoryChips}>
            {availableCategories.map((category) => {
              const isSelected = formData.businessCategory?.includes(category) || false;
              const isDisabled = !isSelected && (formData.businessCategory?.length || 0) >= 3;
              
              return (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipSelected,
                    isDisabled && styles.categoryChipDisabled
                  ]}
                  onPress={() => handleCategoryToggle(category)}
                  disabled={isDisabled}
                >
                  <Text style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextSelected,
                    isDisabled && styles.categoryChipTextDisabled
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity style={styles.addMoreButton} onPress={openCategoryModal}>
            <Ionicons name="add-circle-outline" size={20} color="#3B82F6" />
            <Text style={styles.addMoreText}>Agregar más categorías</Text>
          </TouchableOpacity>
        </View>

      {/* Separador visual */}
      <View style={styles.sectionSeparator}>
        <View style={styles.separatorIcon}>
          <Ionicons name="mail" size={16} color="#6B7280" />
        </View>
        <View style={styles.separatorLine} />
      </View>

      <View style={styles.inputContainer}>
        <Input
          label="Email del Centro Turístico"
          placeholder="contacto@centroturistico.com"
          value={formData.businessEmail}
          onChangeText={(value) => handleInputChange('businessEmail', value)}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.businessEmail}
        />
        <Text style={styles.characterCount}>
          {(formData.businessEmail || '').length}/100
        </Text>
      </View>

      {/* Separador visual */}
      <View style={styles.sectionSeparator}>
        <View style={styles.separatorIcon}>
          <Ionicons name="call" size={16} color="#6B7280" />
        </View>
        <View style={styles.separatorLine} />
      </View>

      <View style={styles.inputContainer}>
      <Input
        label="Teléfono del Centro Turístico"
          placeholder="#### ####"
        value={formData.businessPhone}
        onChangeText={(value) => handleInputChange('businessPhone', value)}
        keyboardType="phone-pad"
        error={errors.businessPhone}
      />
        <Text style={styles.characterCount}>
          {(formData.businessPhone || '').replace(/\s/g, '').length}/8
        </Text>
      </View>

      {/* Separador visual */}
      <View style={styles.sectionSeparator}>
        <View style={styles.separatorIcon}>
          <Ionicons name="location" size={16} color="#6B7280" />
        </View>
        <View style={styles.separatorLine} />
      </View>

      <View style={styles.mapSection}>
        <Text style={styles.mapLabel}>Ubicación del Centro</Text>
        <Text style={styles.mapSubtext}>
          {formData.businessLatitude && formData.businessLongitude 
            ? `Lat: ${parseFloat(formData.businessLatitude).toFixed(6)}, Lng: ${parseFloat(formData.businessLongitude).toFixed(6)}`
            : 'Selecciona la ubicación en el mapa'
          }
        </Text>
        {formData.businessDepartment && (
          <View style={styles.departmentInfo}>
            <Ionicons name="location" size={16} color="#10B981" />
            <Text style={styles.departmentText}>
              Departamento detectado: {formData.businessDepartment}
            </Text>
          </View>
        )}
        <TouchableOpacity style={styles.mapButton} onPress={openMapPicker}>
          <Ionicons name="location" size={20} color="#3B82F6" />
          <Text style={styles.mapButtonText}>
            {formData.businessLatitude && formData.businessLongitude ? 'Cambiar Ubicación' : 'Seleccionar Ubicación'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Fondo para el sistema de navegación */}
      <View style={[styles.systemNavBackground, { height: insets.bottom }]} />
      
      {/* Fondo para el área superior del sistema */}
      <View style={[styles.systemTopBackground, { height: insets.top }]} />

      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContainer, {
            paddingTop: insets.top + 40,
            paddingBottom: Math.max(insets.bottom + 20, 100)
          }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          scrollEnabled={!loading}
        >

        <View style={styles.contentHeader}>
            <View style={styles.titleRow}>
          <Text style={styles.appName}>Mapu</Text>
              <Text style={styles.stepIndicator}>Paso {currentStep} de {totalSteps}</Text>
            </View>
            <Text style={[styles.subtitle, { textAlign: 'left' }]}>
              Crea tu cuenta para descubrir y promocionar los mejores destinos turísticos
            </Text>
        </View>

        <Stepper 
          currentStep={currentStep} 
          totalSteps={totalSteps} 
          stepTitles={stepTitles} 
        />

        {currentStep === 1 ? renderStep1() : currentStep === 2 ? renderStep2() : (formData.role === 'centro_turistico' ? renderCentroTuristicoForm() : renderTouristForm())}

        {/* Checkbox de términos y condiciones - solo en el paso 3 */}
        {currentStep === 3 && (
          <View style={styles.termsContainer}>
            <TouchableOpacity
              style={styles.termsCheckbox}
              onPress={() => setAcceptTerms(!acceptTerms)}
            >
              <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                {acceptTerms && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>
              <View style={styles.termsTextContainer}>
                <Text style={styles.termsText}>
                  Acepto los{' '}
                  <Text 
                    style={styles.termsLink}
                    onPress={() => navigation.navigate('TermsAndConditions')}
                    suppressHighlighting={true}
                  >
                    Términos y Condiciones
                  </Text>
                  {' '}y la{' '}
                  <Text 
                    style={styles.termsLink}
                    onPress={() => navigation.navigate('PrivacyPolicy')}
                    suppressHighlighting={true}
                  >
                    Política de Privacidad
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
            {errors.acceptTerms && (
              <Text style={styles.errorText}>{errors.acceptTerms}</Text>
            )}
          </View>
        )}

        {/* Botones de navegación */}
        <View style={styles.stepButtons}>
          <TouchableOpacity
            style={[styles.backButtonWithIcon, loading && styles.disabledButton]}
            onPress={currentStep === 1 ? () => navigation.navigate('Login') : prevStep} 
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={18} color={loading ? "#9CA3AF" : "#6B7280"} />
            <Text style={[styles.backButtonTextWithIcon, loading && styles.disabledButtonText]}>Atrás</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              currentStep === 1 ? styles.nextButtonWithIcon : (loading ? styles.nextButtonWithIconDisabled : styles.nextButtonWithIcon),
              loading && styles.disabledButton
            ]}
            onPress={nextStep} 
            disabled={loading}
          >
            <Text style={styles.nextButtonTextWithIcon}>
              {loading ? 'Guardando...' : getButtonTitle()}
            </Text>
            {!loading && <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ¿Ya tienes cuenta?{' '}
            <Text 
              style={styles.footerLink}
              onPress={() => navigation.navigate('Login')}
              suppressHighlighting={true}
            >
              Inicia sesión aquí
            </Text>
          </Text>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>

        {/* Modal para agregar categorías personalizadas */}
        <Modal
          visible={showCategoryModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Agregar Categoría</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setShowCategoryModal(false)}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                <Text style={styles.modalSubtitle}>
                  Escribe el nombre de la nueva categoría
                </Text>
                
                <View style={styles.inputContainer}>
                  <Input
                    label="Nombre de la categoría"
                    placeholder="Ej. Spa, Casino, Teatro..."
                    value={customCategory}
                    onChangeText={(value) => {
                      if (value.length <= 30) {
                        setCustomCategory(value);
                      }
                    }}
                    autoCapitalize="words"
                  />
                  <Text style={styles.characterCount}>
                    {(customCategory || '').length}/30
                  </Text>
                </View>
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.modalCancelButton}
                    onPress={() => setShowCategoryModal(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.modalAddButton,
                      (!customCategory.trim() || 
                       availableCategories.includes(customCategory.trim()) || 
                       customCategory.trim().length > 30) && styles.modalAddButtonDisabled
                    ]}
                    onPress={handleAddCustomCategory}
                    disabled={!customCategory.trim() || 
                             availableCategories.includes(customCategory.trim()) || 
                             customCategory.trim().length > 30}
                  >
                    <Text style={[
                      styles.modalAddText,
                      (!customCategory.trim() || 
                       availableCategories.includes(customCategory.trim()) || 
                       customCategory.trim().length > 30) && styles.modalAddTextDisabled
                    ]}>
                      Agregar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Overlay de carga durante el registro */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Creando tu cuenta...</Text>
              <Text style={styles.loadingSubtext}>Por favor espera</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

// Estilos CSS integrados
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  systemNavBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F9FAFB',
    zIndex: 1000,
  },
  systemTopBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F9FAFB',
    zIndex: 1000,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  contentHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3B82F6',
    letterSpacing: 1,
  },
  stepIndicator: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'right',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  
  // Indicador de pasos
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  step: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActive: {
    backgroundColor: '#3B82F6',
  },
  stepText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  stepTextActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  stepLineActive: {
    backgroundColor: '#3B82F6',
  },
  // Formulario
  form: {
    flex: 1,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  nextButton: {
    marginTop: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  backButtonWithIcon: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  backButtonTextWithIcon: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 6,
  },
  nextButtonWithIcon: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  nextButtonTextWithIcon: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 6,
  },
  nextButtonWithIconDisabled: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#9CA3AF',
    borderRadius: 12,
  },
  // Selección de rol
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
  },
  titleUnderline: {
    height: 2,
    backgroundColor: '#3B82F6',
    marginBottom: 16,
    borderRadius: 1,
  },
  roleSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  roleCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#F0F7FF',
  },
  roleIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roleContent: {
    flex: 1,
  },
  roleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 3,
  },
  roleNameSelected: {
    color: '#3B82F6',
  },
  roleDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  roleDescriptionSelected: {
    color: '#1E40AF',
  },
  roleCheck: {
    marginLeft: 16,
  },
  // Botones de navegación
  stepButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
    gap: 12,
  },
  backButton: {
    flex: 1,
    minHeight: 48,
  },
  registerButton: {
    flex: 1,
    minHeight: 48,
  },
  nextButton: {
    flex: 1,
    minHeight: 48,
  },
  // Estilos para foto de perfil mejorada
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImageLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  profileImageWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  profileImageButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  // Chips de intereses
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  logoPicker: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  Picker: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    height: 60,
    width: '100%',
  },
  logoText: {
    fontSize: 12,
    color: '#6B7280',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  coverPicker: {
    flex: 1,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  coverText: {
    fontSize: 12,
    color: '#6B7280',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#F0F7FF',
  },
  chipText: {
    color: '#111827',
    fontSize: 14,
  },
  chipTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
    paddingBottom: 4,
  },
  // Estilos estilo Facebook
  facebookStyleContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  coverContainer: {
    height: 140,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    marginBottom: 60,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  coverText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  coverSubtext: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  coverEditButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  logoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  logoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    borderRadius: 40,
  },
  // Estilos de categorías
  categoryContainer: {
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  categoryCounter: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
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
    fontWeight: '600',
  },
  categoryChipDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    opacity: 0.5,
  },
  categoryChipTextDisabled: {
    color: '#9CA3AF',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  addMoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
    marginLeft: 6,
  },
  // Separador de secciones
  sectionSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    marginHorizontal: 0,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
    marginLeft: 12,
  },
  separatorIcon: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  // Estilos del modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  modalAddButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  modalAddButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  modalAddText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  modalAddTextDisabled: {
    color: '#9CA3AF',
  },
  // Overlay de carga
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  // Estilos para botones deshabilitados
  disabledButton: {
    opacity: 0.6,
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
  // Botón de ancho completo para el paso 1
  nextButtonWithIconFullWidth: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  // Estilos de horario
  scheduleContainer: {
    marginBottom: 12,
  },
  scheduleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: 16,
  },
  timeSelector: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
  },
  timeText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  // Estilos para contador de caracteres
  inputContainer: {
    marginBottom: 20,
  },
  characterCount: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: -8,
    marginRight: 4,
    marginBottom: -2,
    lineHeight: 14,
  },
  // Estilos para sección de mapa
  mapSection: {
    marginBottom: 20,
  },
  mapLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  mapSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3B82F6',
    marginLeft: 12,
    flex: 1,
  },
  departmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  departmentText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
  footerLink: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  // Nuevos estilos para el formulario del turista mejorado
  profileImageSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
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
  sectionContainer: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  sectionSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 16,
  },
  sectionUnderline: {
    height: 2,
    backgroundColor: '#3B82F6',
    borderRadius: 1,
    marginBottom: 12,
    width: 30,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  pickerWrapper: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  picker: {
    height: 50,
    color: '#111827',
  },
  pickerIcon: {
    position: 'absolute',
    right: 16,
    top: 15,
    pointerEvents: 'none',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  interestsCounter: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  locationContainer: {
    gap: 8,
  },
  // Estilos para portada estilo Facebook
  coverImageContainer: {
    marginBottom: 16,
  },
  coverImageLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  coverImageButton: {
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#F0F7FF',
  },
  coverImageText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '500',
  },
  removeCoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    alignSelf: 'center',
  },
  removeCoverText: {
    fontSize: 12,
    color: '#EF4444',
    marginLeft: 4,
    fontWeight: '500',
  },
  // Estilos para el checkbox de términos y condiciones
  termsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  termsCheckbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  termsLink: {
    color: '#3B82F6',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});

export default RegisterScreen;
