import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser } from '../../services/auth.js';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig.js';
import { useAuth } from '../../contexts/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      if (authUser) {
        setUser(authUser);
        
        // Obtener datos adicionales del usuario desde Firestore
        const userDoc = await getDoc(doc(db, 'users', authUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  const getMenuOptions = () => {
    const isCenter = userData?.role === 'centro_turistico';
    
    if (isCenter) {
      return [
        {
          id: 'business_info',
          title: 'Mi Centro Turístico',
          icon: 'business',
          description: 'Editar información, horarios y servicios',
          onPress: () => Alert.alert('Mi Centro', 'Editar información del centro turístico')
        },
        {
          id: 'location',
          title: 'Ubicación del Centro',
          icon: 'location',
          description: 'Actualizar ubicación en el mapa',
          onPress: () => navigation.navigate('MapPicker', {
            onPick: (coords) => {
              Alert.alert('Ubicación Actualizada', `Nueva ubicación: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
            }
          })
        },
        {
          id: 'reservations',
          title: 'Reservaciones',
          icon: 'calendar',
          description: 'Gestionar reservas de visitantes',
          onPress: () => Alert.alert('Reservaciones', 'Sistema de reservaciones en desarrollo')
        },
        {
          id: 'reviews',
          title: 'Reseñas y Calificaciones',
          icon: 'star',
          description: 'Ver y responder reseñas',
          onPress: () => Alert.alert('Reseñas', 'Sistema de reseñas en desarrollo')
        },
        {
          id: 'analytics',
          title: 'Estadísticas',
          icon: 'bar-chart',
          description: 'Visitas, popularidad y métricas',
          onPress: () => Alert.alert('Estadísticas', 'Panel de estadísticas en desarrollo')
        },
        {
          id: 'promotions',
          title: 'Promociones',
          icon: 'megaphone',
          description: 'Crear ofertas especiales',
          onPress: () => Alert.alert('Promociones', 'Sistema de promociones en desarrollo')
        },
        {
          id: 'photos',
          title: 'Galería de Fotos',
          icon: 'images',
          description: 'Subir fotos del centro',
          onPress: () => Alert.alert('Galería', 'Sistema de galería en desarrollo')
        },
        {
          id: 'settings',
          title: 'Configuración',
          icon: 'settings',
          description: 'Preferencias y notificaciones',
          onPress: () => Alert.alert('Configuración', 'Panel de configuración en desarrollo')
        }
      ];
    } else {
      return [
        {
          id: 'profile',
          title: 'Mi Perfil',
          icon: 'person',
          description: 'Editar información personal',
          onPress: () => Alert.alert('Perfil', 'Editar información personal')
        },
        {
          id: 'favorites',
          title: 'Favoritos',
          icon: 'heart',
          description: 'Centros turísticos guardados',
          onPress: () => Alert.alert('Favoritos', 'Lista de centros favoritos')
        },
        {
          id: 'history',
          title: 'Historial de Visitas',
          icon: 'time',
          description: 'Centros que has visitado',
          onPress: () => Alert.alert('Historial', 'Historial de visitas')
        },
        {
          id: 'reviews',
          title: 'Mis Reseñas',
          icon: 'star',
          description: 'Reseñas que has escrito',
          onPress: () => Alert.alert('Mis Reseñas', 'Tus reseñas y calificaciones')
        },
        {
          id: 'notifications',
          title: 'Notificaciones',
          icon: 'notifications',
          description: 'Alertas y actualizaciones',
          onPress: () => Alert.alert('Notificaciones', 'Configurar notificaciones')
        },
        {
          id: 'settings',
          title: 'Configuración',
          icon: 'settings',
          description: 'Preferencias de la app',
          onPress: () => Alert.alert('Configuración', 'Configuración de la aplicación')
        }
      ];
    }
  };

  const menuOptions = getMenuOptions();

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header del perfil */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="business" size={30} color="#3B82F6" />
          </View>
          <Text style={styles.userName}>
            {userData?.businessName || user?.displayName || 'Centro Turístico'}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.userRole}>
            {userData?.role === 'centro_turistico' ? 'Centro Turístico' : 'Usuario'}
          </Text>
        </View>

        {/* Opciones del menú */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>
            {userData?.role === 'centro_turistico' ? 'Gestionar Centro' : 'Mi Cuenta'}
          </Text>
          {menuOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.menuItem}
              onPress={option.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name={option.icon} size={24} color="#3B82F6" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuItemTitle}>{option.title}</Text>
                  <Text style={styles.menuItemDescription}>{option.description}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Botón de cerrar sesión */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="#EF4444" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  userRole: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
});

export default ProfileScreen;