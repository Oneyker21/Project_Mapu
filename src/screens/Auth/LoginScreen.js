import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const LoginScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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
    try {
      // Aquí iría la lógica de autenticación
      // Por ahora simulamos un delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulamos login exitoso
      Alert.alert('Éxito', 'Inicio de sesión exitoso');
      // navigation.navigate('Home'); // Descomenta cuando tengas navegación configurada
    } catch (error) {
      Alert.alert('Error', 'Error al iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
        <View style={styles.header}>
          <Text style={styles.appName}>Mapu</Text>
          <Text style={styles.title}>¡Bienvenido!</Text>
          <Text style={styles.subtitle}>
            Inicia sesión para continuar
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

          <TouchableOpacity style={styles.forgotPassword}>
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
              onPress={() => Alert.alert('Info', 'Registro pendiente')}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
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
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    flex: 1,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6B7280',
    fontSize: 14,
  },
  googleButton: {
    marginBottom: 32,
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
    paddingBottom: 20,
    minHeight: 40,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLink: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default LoginScreen;
