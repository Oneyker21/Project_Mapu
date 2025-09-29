import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Input, Button } from '../../components';
import { loginUser } from '../../services/auth.js';
import { getSavedCredentials } from '../../services/storage.js';
import { useAuth } from '../../contexts/AuthContext';

const LoginScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [rememberUser, setRememberUser] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Cargar credenciales guardadas al montar el componente
  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const result = await getSavedCredentials();
      if (result.success && result.rememberUser && result.credentials) {
        setFormData({
          email: result.credentials.email,
          password: result.credentials.password,
        });
        setRememberUser(true);
      }
    } catch (error) {
      console.error('Error al cargar credenciales:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setLoginError(''); // Limpiar error anterior
    try {
      const result = await loginUser(formData.email, formData.password, rememberUser);
      
      if (result.success) {
        login(result.user);
        // No mostrar alert, el AuthNavigator manejará la navegación automáticamente
      } else {
        setLoginError(result.error || 'Error al iniciar sesión. Inténtalo de nuevo.');
      }
    } catch (error) {
      setLoginError('Error al iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Limpiar error de login cuando el usuario empiece a escribir
    if (loginError) {
      setLoginError('');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
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
        >
        <View style={styles.contentHeader}>
          <Text style={styles.appName}>Mapu</Text>
          <Text style={styles.title}>¡Bienvenido!</Text>
          <Text style={styles.subtitle}>
            Descubre lugares increíbles y conecta con el turismo
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="Ingresa tu email"
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

          <TouchableOpacity 
            style={styles.rememberContainer}
            onPress={() => setRememberUser(!rememberUser)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, rememberUser && styles.checkboxChecked]}>
              {rememberUser && <Ionicons name="checkmark" size={16} color="white" />}
            </View>
            <Text style={styles.rememberText}>¿Desea recordar la contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotPasswordText}>
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>

          <Button
            title="Iniciar Sesión"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />

          {/* Mensaje de error de login */}
          {loginError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{loginError}</Text>
            </View>
          ) : null}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            title="Continuar con Google"
            onPress={() => Alert.alert('Info', 'Funcionalidad de Google pendiente')}
            variant="secondary"
            style={styles.googleButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ¿No tienes cuenta?{' '}
            <Text 
              style={styles.footerLink}
              onPress={() => navigation.navigate('Register')}
              suppressHighlighting={true}
            >
              Regístrate aquí
            </Text>
          </Text>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// Estilos CSS integrados - Tema Turístico Modo Oscuro
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  systemNavBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0F0F0F',
    zIndex: 1000,
  },
  systemTopBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0F0F0F',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(15, 15, 15, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
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
    paddingBottom: 100,
  },
  contentHeader: {
    alignItems: 'center',
    marginBottom: 48,
    paddingTop: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#4ADE80', // Verde más brillante para modo oscuro
    marginBottom: 8,
    letterSpacing: 1,
    textShadowColor: '#DAA621',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4ADE80', // Verde más brillante para modo oscuro
    textAlign: 'center',
    fontWeight: '500',
  },
  form: {
    flex: 1,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#DAA621',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
  },
  checkboxChecked: {
    backgroundColor: '#4ADE80', // Verde más brillante para modo oscuro
    borderColor: '#4ADE80',
  },
  rememberText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    color: '#4ADE80', // Verde más brillante para modo oscuro
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: 16,
    backgroundColor: '#4ADE80', // Verde más brillante para modo oscuro
    borderRadius: 12,
    shadowColor: '#4ADE80',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D1B1B',
    borderWidth: 1,
    borderColor: '#5B2C2C',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DAA621',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#4ADE80', // Verde más brillante para modo oscuro
    fontSize: 14,
    fontWeight: '600',
  },
  googleButton: {
    marginBottom: 32,
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#DAA621',
    borderRadius: 12,
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  footerLink: {
    color: '#4ADE80', // Verde más brillante para modo oscuro
    fontWeight: '700',
  },
});

export default LoginScreen;
