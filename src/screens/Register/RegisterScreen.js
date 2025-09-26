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
  validateResidence
} from '../../utils/validations';
import { registerUser } from '../../services/auth.js';
import { Picker } from '@react-native-picker/picker';

const RegisterScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
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
    phone: '',
    documentType: '',
    documentNumber: '',
    residence: '',
    interests: [], // ['Cultura','Historia',...]
    // Paso 3: centro turístico
    businessName: '',
    businessCategory: '',
    businessEmail: '',
    businessPhone: '',
    businessSchedule: '',
    businessAddress: '',
    businessLatitude: '',
    businessLongitude: '',
    businessCost: '',
    businessLogo: null,
    businessCover: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateStep1 = () => {
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

  const validateStep2 = () => {
    if (!formData.role) {
      Alert.alert('Error', 'Por favor selecciona un tipo de usuario');
      return false;
    }
    return true;
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
      const documentNumberValidation = validateDocumentNumber(formData.documentNumber);
      if (!documentNumberValidation.isValid) {
        newErrors.documentNumber = documentNumberValidation.message;
      }

      const residenceValidation = validateResidence(formData.residence);
      if (!residenceValidation.isValid) {
        newErrors.residence = residenceValidation.message;
      }
    } else if (formData.role === 'centro_turistico') {
      if (!formData.businessName) newErrors.businessName = 'Nombre del centro turístico requerido';
      if (!formData.businessCategory) newErrors.businessCategory = 'Categoría requerida';
      if (!formData.businessEmail) newErrors.businessEmail = 'Email del centro turístico requerido';
      if (!formData.businessPhone) newErrors.businessPhone = 'Teléfono del centro turístico requerido';
      if (!formData.businessAddress) newErrors.businessAddress = 'Dirección requerida';
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
    navigation.navigate('MapPicker', {
      initialCoords: (formData.businessLatitude && formData.businessLongitude) ? {
        latitude: Number(formData.businessLatitude),
        longitude: Number(formData.businessLongitude),
      } : undefined,
      onPick: ({ latitude, longitude }) => {
        setFormData(prev => ({ ...prev, businessLatitude: String(latitude), businessLongitude: String(longitude) }));
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
    if (currentStep === 3) {
      return 'Crear Cuenta';
    }
    return 'Siguiente';
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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
          residence: formData.residence,
          interests: formData.interests,
          profileImage: formData.profileImage
        } : {
          businessName: formData.businessName,
          businessCategory: formData.businessCategory,
          businessEmail: formData.businessEmail,
          businessPhone: formData.businessPhone,
          businessSchedule: formData.businessSchedule,
          address: formData.businessAddress,
          latitude: formData.businessLatitude,
          longitude: formData.businessLongitude,
          businessCost: formData.businessCost,
          businessLogo: formData.businessLogo,
          businessCover: formData.businessCover
        })
      };

      const result = await registerUser(userData);

      if (result.success) {
        Alert.alert('Éxito', `Registro exitoso como ${formData.role === 'centro_turistico' ? 'Centro Turístico' : 'Turista'}`, [
          {
            text: 'Ver Perfil',
            onPress: () => navigation.navigate('Main', { screen: 'Perfil' })
          }
        ]);
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const stepTitles = ['Datos Básicos', 'Tipo de Usuario', 'Información Adicional'];

  const renderStep1 = () => (
    <View style={styles.form}>
      <Input
        label="Nombres"
        placeholder="Tus nombres"
        value={formData.firstName}
        onChangeText={(value) => handleInputChange('firstName', value)}
        autoCapitalize="words"
        error={errors.firstName}
      />
      <Input
        label="Apellidos"
        placeholder="Tus apellidos"
        value={formData.lastName}
        onChangeText={(value) => handleInputChange('lastName', value)}
        autoCapitalize="words"
        error={errors.lastName}
      />

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

      <Input
        label="Contraseña"
        placeholder="Tu contraseña"
        value={formData.password}
        onChangeText={(value) => handleInputChange('password', value)}
        secureTextEntry
        showPasswordToggle
        error={errors.password}
      />

      {formData.password && (
        <PasswordSecurity password={formData.password} />
      )}

      <PasswordConfirm
        label="Confirmar contraseña"
        placeholder="Confirma tu contraseña"
        value={formData.confirmPassword}
        onChangeText={(value) => handleInputChange('confirmPassword', value)}
        password={formData.password}
        error={errors.confirmPassword}
      />


      <Button
        title="Continuar"
        onPress={nextStep}
        style={styles.nextButton}
      />
    </View>
  );

  const renderStep2 = () => (
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

  const InterestChip = ({ label, selected, onPress }) => (
    <TouchableOpacity onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );

  const interestOptions = ['Cultura', 'Historia', 'Gastronomía', 'Aventura', 'Arte'];

  const renderTouristForm = () => (
    <View style={styles.form}>
      <Text style={styles.roleTitle}>Información del Turista</Text>

      {/* Foto de perfil */}
      <View style={styles.profileImageContainer}>
        <Text style={styles.profileImageLabel}>Foto de Perfil</Text>
        <TouchableOpacity style={styles.profileImageButton} onPress={pickImage}>
          {formData.profileImage ? (
            <Image source={{ uri: formData.profileImage.uri }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="camera" size={30} color="#6B7280" />
              <Text style={styles.profileImageText}>Agregar foto</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Input
        label="Número de Teléfono"
        placeholder="+505 0000 0000"
        value={formData.phone}
        onChangeText={(value) => handleInputChange('phone', value)}
        keyboardType="phone-pad"
        error={errors.phone}
      />


      <Picker
        selectedValue={formData.documentType}
        style={styles.Picker}
        onValueChange={(value) => handleInputChange('documentType', value)}
      >
        <Picker.Item label="Selecciona un tipo de documento" value="" />
        <Picker.Item label="Cédula de Identidad" value="cedula" />
        <Picker.Item label="Pasaporte" value="pasaporte" />
      </Picker>
      {errors.documentType && <Text style={{ color: 'red', marginBottom: 8 }}>{errors.documentType}</Text>}

      <Input
        label="Número de Documento"
        placeholder="Ej. 001-080800-0000X"
        value={formData.documentNumber}
        onChangeText={(value) => handleInputChange('documentNumber', value)}
        error={errors.documentNumber}
      />
      <Input
        label="Residencia"
        placeholder="Ciudad, País"
        value={formData.residence}
        onChangeText={(value) => handleInputChange('residence', value)}
        
        error={errors.residence}
      />

      <Text style={styles.roleSubtitle}>Intereses</Text>
      <View style={styles.chipsRow}>
        {interestOptions.map(opt => (
          <InterestChip
            key={opt}
            label={opt}
            selected={formData.interests.includes(opt)}
            onPress={() => {
              setFormData(prev => {
                const exists = prev.interests.includes(opt);
                return { ...prev, interests: exists ? prev.interests.filter(i => i !== opt) : [...prev.interests, opt] };
              });
            }}
          />
        ))}
      </View>
    </View>
  );

  const renderCentroTuristicoForm = () => (
    <View style={styles.form}>
      <Text style={styles.roleTitle}>Datos del Centro Turístico</Text>
      {/* Logo y portada */}
      <View style={styles.mediaRow}>
        <TouchableOpacity style={styles.logoPicker} onPress={pickLogo}>
          {formData.businessLogo ? (
            <Image source={{ uri: formData.businessLogo.uri }} style={styles.logoImage} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Ionicons name="image" size={20} color="#6B7280" />
              <Text style={styles.logoText}>Logo</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.coverPicker} onPress={pickCover}>
          {formData.businessCover ? (
            <Image source={{ uri: formData.businessCover.uri }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="images" size={20} color="#6B7280" />
              <Text style={styles.coverText}>Portada</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>


      <Input
        label="Nombre del Centro Turístico"
        placeholder="Ej. Museo Nacional, Hotel Granada, Centro Recreativo..."
        value={formData.businessName}
        onChangeText={(value) => handleInputChange('businessName', value)}
        error={errors.businessName}
      />

      <Input
        label="Descripción"
        placeholder="Breve descripción"
        value={formData.businessDescription}
        onChangeText={(value) => handleInputChange('businessDescription', value)}
      />

      <Input
        label="Categoría"
        placeholder="Museo / Hotel / Centro Recreativo / Restaurante / Galería..."
        value={formData.businessCategory}
        onChangeText={(value) => handleInputChange('businessCategory', value)}
        error={errors.businessCategory}
      />

      <Input
        label="Email del Centro Turístico"
        placeholder="contacto@centroturistico.com"
        value={formData.businessEmail}
        onChangeText={(value) => handleInputChange('businessEmail', value)}
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.businessEmail}
      />

      <Input
        label="Teléfono del Centro Turístico"
        placeholder="+505 0000 0000"
        value={formData.businessPhone}
        onChangeText={(value) => handleInputChange('businessPhone', value)}
        keyboardType="phone-pad"
        error={errors.businessPhone}
      />

      <Input
        label="Horario"
        placeholder="Lunes-Viernes 9:00-18:00"
        value={formData.businessSchedule}
        onChangeText={(value) => handleInputChange('businessSchedule', value)}
      />

      <Input
        label="Dirección"
        placeholder="Dirección completa"
        value={formData.businessAddress}
        onChangeText={(value) => handleInputChange('businessAddress', value)}
        error={errors.businessAddress}
      />

      <View style={styles.coordsRow}>
        <View style={{ flex: 1 }}>
          <Input
            label="Latitud"
            placeholder="12.3456"
            value={formData.businessLatitude}
            onChangeText={(value) => handleInputChange('businessLatitude', value)}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Input
            label="Longitud"
            placeholder="-86.1234"
            value={formData.businessLongitude}
            onChangeText={(value) => handleInputChange('businessLongitude', value)}
            keyboardType="decimal-pad"
          />
        </View>
      </View>
      <Button title="Seleccionar en el mapa" variant="secondary" onPress={openMapPicker} />

      <Input
        label="Costo"
        placeholder="$ / $$ / $$$ / $$$$"
        value={formData.businessCost}
        onChangeText={(value) => handleInputChange('businessCost', value)}
      />

    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header with back button extending to camera/notch area */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crear Cuenta</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContainer, { paddingBottom: Math.max(insets.bottom + 24, 100) }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.contentHeader}>
            <Text style={styles.appName}>Mapu</Text>
            <Text style={styles.title}>Crear Cuenta</Text>
          </View>

          <Stepper
            currentStep={currentStep}
            totalSteps={totalSteps}
            stepTitles={stepTitles}
          />

          {currentStep === 1 ? renderStep1() : currentStep === 2 ? renderStep2() : (formData.role === 'centro_turistico' ? renderCentroTuristicoForm() : renderTouristForm())}

          {/* Botones de navegación */}
          {currentStep > 1 && (
            <View style={styles.stepButtons}>
              <Button
                title="Atrás"
                onPress={prevStep}
                variant="secondary"
                style={styles.backButton}
              />
              <Button
                title={getButtonTitle()}
                onPress={nextStep}
                loading={loading}
                style={styles.nextButton}
              />
            </View>
          )}

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
    </View>
  );
};

// Estilos CSS integrados
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
  headerSpacer: {
    width: 40, // Same width as back button to center title
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 100,
  },
  contentHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#3B82F6',
    marginBottom: 16,
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },

  // Indicador de pasos
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
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
    marginTop: 16,
  },
  // Selección de rol
  roleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  roleSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  roleCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#F0F7FF',
  },
  roleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  roleContent: {
    flex: 1,
  },
  roleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  roleNameSelected: {
    color: '#3B82F6',
  },
  roleDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
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
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  backButton: {
    flex: 0.48,
    minHeight: 56,
  },
  registerButton: {
    flex: 0.48,
    minHeight: 56,
  },
  nextButton: {
    flex: 0.48,
    minHeight: 56,
  },
  // Estilos para foto de perfil
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 12,
  },
  profileImageButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F9FAFB',
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
    marginTop: 16,
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
});

export default RegisterScreen;
