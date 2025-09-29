import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Switch,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const NotificationsScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('settings');
  const [settings, setSettings] = useState({
    newBookings: true,
    bookingReminders: true,
    reviews: true,
    payments: false,
    promotions: true,
    systemUpdates: false,
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
  });

  const notifications = [
    {
      id: 1,
      title: 'Nueva reserva recibida',
      message: 'María González ha hecho una reserva para el 15 de marzo',
      time: '2 min',
      read: false,
      type: 'booking',
      icon: 'calendar',
      color: '#3B82F6'
    },
    {
      id: 2,
      title: 'Reseña 5 estrellas',
      message: '"Excelente experiencia, muy recomendado!" - Carlos Mendoza',
      time: '1 hora',
      read: false,
      type: 'review',
      icon: 'star',
      color: '#F59E0B'
    },
    {
      id: 3,
      title: 'Recordatorio de cita',
      message: 'Tour programado para hoy a las 10:00 AM con 4 personas',
      time: '3 horas',
      read: true,
      type: 'reminder',
      icon: 'alarm',
      color: '#10B981'
    },
    {
      id: 4,
      title: 'Pago procesado',
      message: 'Se ha recibido un pago de $150.00 por tour guiado',
      time: '1 día',
      read: true,
      type: 'payment',
      icon: 'card',
      color: '#8B5CF6'
    },
    {
      id: 5,
      title: 'Promoción activa',
      message: 'Tu promoción "Tour de Fin de Semana" ha sido utilizada 5 veces',
      time: '2 días',
      read: true,
      type: 'promotion',
      icon: 'megaphone',
      color: '#EC4899'
    },
  ];

  const notificationTypes = [
    {
      title: 'Reservas',
      settings: [
        { key: 'newBookings', label: 'Nuevas reservas', description: 'Notificar cuando recibas una nueva reserva' },
        { key: 'bookingReminders', label: 'Recordatorios', description: 'Recordatorios de citas próximas' },
      ]
    },
    {
      title: 'Interacciones',
      settings: [
        { key: 'reviews', label: 'Reseñas', description: 'Nuevas reseñas y calificaciones' },
        { key: 'payments', label: 'Pagos', description: 'Confirmaciones de pagos recibidos' },
      ]
    },
    {
      title: 'Marketing',
      settings: [
        { key: 'promotions', label: 'Promociones', description: 'Uso de promociones activas' },
        { key: 'systemUpdates', label: 'Actualizaciones', description: 'Noticias y actualizaciones del sistema' },
      ]
    },
  ];

  const deliveryMethods = [
    { key: 'pushNotifications', label: 'Notificaciones Push', icon: 'phone-portrait' },
    { key: 'emailNotifications', label: 'Correo Electrónico', icon: 'mail' },
    { key: 'smsNotifications', label: 'SMS', icon: 'chatbubble' },
  ];

  const tabs = [
    { key: 'notifications', title: 'Historial', icon: 'list' },
    { key: 'settings', title: 'Configuración', icon: 'settings' },
  ];

  const toggleSetting = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity style={[styles.notificationItem, !item.read && styles.unreadNotification]}>
      <View style={[styles.notificationIcon, { backgroundColor: `${item.color}20` }]}>
        <Ionicons name={item.icon} size={20} color={item.color} />
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationTime}>{item.time}</Text>
        </View>
        <Text style={styles.notificationMessage} numberOfLines={2}>{item.message}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const renderSettingGroup = (group) => (
    <View key={group.title} style={styles.settingGroup}>
      <Text style={styles.groupTitle}>{group.title}</Text>
      {group.settings.map((setting) => (
        <View key={setting.key} style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>{setting.label}</Text>
            <Text style={styles.settingDescription}>{setting.description}</Text>
          </View>
          <Switch
            value={settings[setting.key]}
            onValueChange={() => toggleSetting(setting.key)}
            trackColor={{ false: '#F3F4F6', true: '#4ADE80' }}
            thumbColor={settings[setting.key] ? '#FFFFFF' : '#D1D5DB'}
          />
        </View>
      ))}
    </View>
  );

  const renderDeliveryMethod = (method) => (
    <View key={method.key} style={styles.settingItem}>
      <View style={styles.deliveryMethodInfo}>
        <Ionicons name={method.icon} size={20} color="#6B7280" style={styles.deliveryIcon} />
        <Text style={styles.settingLabel}>{method.label}</Text>
      </View>
      <Switch
        value={settings[method.key]}
        onValueChange={() => toggleSetting(method.key)}
        trackColor={{ false: '#F3F4F6', true: '#4ADE80' }}
        thumbColor={settings[method.key] ? '#FFFFFF' : '#D1D5DB'}
      />
    </View>
  );

  const NotificationsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.notificationHeader}>
        <TouchableOpacity style={styles.markAllButton}>
          <Text style={styles.markAllText}>Marcar todo como leído</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const SettingsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Tipos de Notificación</Text>
        {notificationTypes.map(renderSettingGroup)}
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Métodos de Entrega</Text>
        <View style={styles.settingGroup}>
          {deliveryMethods.map(renderDeliveryMethod)}
        </View>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Horarios de Notificación</Text>
        <View style={styles.settingGroup}>
          <TouchableOpacity style={styles.timeSettingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>No molestar</Text>
              <Text style={styles.settingDescription}>10:00 PM - 7:00 AM</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.timeSettingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Días laborables</Text>
              <Text style={styles.settingDescription}>Lunes a Viernes</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedTab === tab.key && styles.selectedTab
            ]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Ionicons 
              name={tab.icon} 
              size={20} 
              color={selectedTab === tab.key ? '#4ADE80' : '#6B7280'} 
            />
            <Text style={[
              styles.tabText,
              selectedTab === tab.key && styles.selectedTabText
            ]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {selectedTab === 'notifications' ? <NotificationsTab /> : <SettingsTab />}
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  moreButton: {
    padding: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  selectedTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4ADE80',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  selectedTabText: {
    color: '#4ADE80',
  },
  tabContent: {
    flex: 1,
  },
  notificationHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  markAllButton: {
    alignSelf: 'flex-end',
  },
  markAllText: {
    fontSize: 14,
    color: '#4ADE80',
    fontWeight: '600',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  unreadNotification: {
    backgroundColor: '#F0FDF4',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    marginLeft: 8,
  },
  settingsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  settingGroup: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 8,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  deliveryMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deliveryIcon: {
    marginRight: 12,
  },
  timeSettingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
});

export default NotificationsScreen;
