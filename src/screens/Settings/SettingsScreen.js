import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

const SettingsScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar Cuenta',
      'Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar tu cuenta permanentemente?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            // Aquí implementarías la lógica para eliminar la cuenta
            Alert.alert('Función en desarrollo', 'Esta función estará disponible próximamente');
          },
        },
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contactar Soporte',
      '¿Cómo te gustaría contactarnos?',
      [
        {
          text: 'Email',
          onPress: () => Linking.openURL('mailto:soporte@mapu.com'),
        },
        {
          text: 'WhatsApp',
          onPress: () => Linking.openURL('https://wa.me/50512345678'),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const isCenter = user?.role === 'centro_turistico' || user?.tipoUsuario === 'CentroTuristico';

  const settingsSections = [
    {
      title: 'Cuenta',
      items: [
        {
          icon: 'person-outline',
          title: 'Perfil',
          subtitle: 'Editar información personal',
          onPress: () => navigation.navigate(isCenter ? 'CentroTuristicoProfile' : 'TuristaProfile'),
        },
        {
          icon: 'shield-checkmark-outline',
          title: 'Privacidad y Seguridad',
          subtitle: 'Gestionar tu privacidad',
          onPress: () => navigation.navigate('PrivacyPolicy'),
        },
      ],
    },
    {
      title: 'Notificaciones',
      items: [
        {
          icon: 'notifications-outline',
          title: 'Notificaciones Push',
          subtitle: 'Recibir notificaciones de la app',
          rightComponent: (
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              thumbColor={notifications ? '#FFFFFF' : '#9CA3AF'}
            />
          ),
        },
      ],
    },
    {
      title: 'Servicios',
      items: [
        {
          icon: 'location-outline',
          title: 'Servicios de Ubicación',
          subtitle: 'Permitir acceso a tu ubicación',
          rightComponent: (
            <Switch
              value={locationServices}
              onValueChange={setLocationServices}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              thumbColor={locationServices ? '#FFFFFF' : '#9CA3AF'}
            />
          ),
        },
        {
          icon: 'map-outline',
          title: 'Mapas',
          subtitle: 'Configurar preferencias de mapas',
          onPress: () => Alert.alert('Próximamente', 'Esta función estará disponible pronto'),
        },
      ],
    },
    {
      title: 'Apariencia',
      items: [
        {
          icon: 'moon-outline',
          title: 'Modo Oscuro',
          subtitle: 'Cambiar tema de la aplicación',
          rightComponent: (
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              thumbColor={darkMode ? '#FFFFFF' : '#9CA3AF'}
            />
          ),
        },
      ],
    },
    {
      title: 'Ayuda y Soporte',
      items: [
        {
          icon: 'help-circle-outline',
          title: 'Centro de Ayuda',
          subtitle: 'Preguntas frecuentes y guías',
          onPress: () => Alert.alert('Próximamente', 'Esta función estará disponible pronto'),
        },
        {
          icon: 'chatbubble-outline',
          title: 'Contactar Soporte',
          subtitle: 'Obtener ayuda personalizada',
          onPress: handleContactSupport,
        },
        {
          icon: 'star-outline',
          title: 'Calificar App',
          subtitle: 'Deja tu opinión en la tienda',
          onPress: () => Alert.alert('Próximamente', 'Esta función estará disponible pronto'),
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        {
          icon: 'document-text-outline',
          title: 'Términos y Condiciones',
          subtitle: 'Leer términos de uso',
          onPress: () => navigation.navigate('TermsAndConditions'),
        },
        {
          icon: 'shield-outline',
          title: 'Política de Privacidad',
          subtitle: 'Cómo protegemos tus datos',
          onPress: () => navigation.navigate('PrivacyPolicy'),
        },
      ],
    },
    {
      title: 'Cuenta',
      items: [
        {
          icon: 'log-out-outline',
          title: 'Cerrar Sesión',
          subtitle: 'Salir de tu cuenta',
          onPress: handleLogout,
          textColor: '#EF4444',
        },
        {
          icon: 'trash-outline',
          title: 'Eliminar Cuenta',
          subtitle: 'Eliminar permanentemente tu cuenta',
          onPress: handleDeleteAccount,
          textColor: '#EF4444',
        },
      ],
    },
  ];

  const renderSettingItem = (item, index) => (
    <TouchableOpacity
      key={index}
      style={styles.settingItem}
      onPress={item.onPress}
      disabled={!item.onPress}
    >
      <View style={styles.settingItemLeft}>
        <View style={styles.settingIconContainer}>
          <Ionicons
            name={item.icon}
            size={24}
            color={item.textColor || '#6B7280'}
          />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: item.textColor || '#1F2937' }]}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      {item.rightComponent || (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuraciones</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => renderSettingItem(item, itemIndex))}
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.appVersion}>Mapu v1.0.0</Text>
          <Text style={styles.copyright}>© 2024 Mapu. Todos los derechos reservados.</Text>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  appVersion: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default SettingsScreen;
