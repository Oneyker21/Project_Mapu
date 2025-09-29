import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const StatisticsScreen = ({ navigation }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const stats = {
    visitors: { value: 1245, growth: 12.5, trend: 'up' },
    revenue: { value: 25890, growth: -5.2, trend: 'down' },
    rating: { value: 4.8, growth: 8.3, trend: 'up' },
    bookings: { value: 189, growth: 15.7, trend: 'up' },
  };

  const chartData = [
    { day: 'Lun', visitors: 45, revenue: 1200 },
    { day: 'Mar', visitors: 52, revenue: 1500 },
    { day: 'Mié', visitors: 38, revenue: 980 },
    { day: 'Jue', visitors: 61, revenue: 1800 },
    { day: 'Vie', visitors: 75, revenue: 2100 },
    { day: 'Sáb', visitors: 89, revenue: 2500 },
    { day: 'Dom', visitors: 94, revenue: 2800 },
  ];

  const topServices = [
    { name: 'Tour Guiado', bookings: 45, revenue: 4500, color: '#3B82F6' },
    { name: 'Degustación', bookings: 38, revenue: 3800, color: '#10B981' },
    { name: 'Evento Privado', bookings: 25, revenue: 7500, color: '#F59E0B' },
    { name: 'Tour Fotográfico', bookings: 32, revenue: 3200, color: '#8B5CF6' },
  ];

  const periods = [
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mes' },
    { key: 'year', label: 'Año' },
  ];

  const maxVisitors = Math.max(...chartData.map(d => d.visitors));

  const renderStatCard = (title, stat, icon) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: `${stat.trend === 'up' ? '#10B981' : '#EF4444'}20` }]}>
          <Ionicons name={icon} size={20} color={stat.trend === 'up' ? '#10B981' : '#EF4444'} />
        </View>
        <View style={styles.trendContainer}>
          <Ionicons 
            name={stat.trend === 'up' ? 'trending-up' : 'trending-down'} 
            size={16} 
            color={stat.trend === 'up' ? '#10B981' : '#EF4444'} 
          />
          <Text style={[styles.trendText, { color: stat.trend === 'up' ? '#10B981' : '#EF4444' }]}>
            {Math.abs(stat.growth)}%
          </Text>
        </View>
      </View>
      <Text style={styles.statValue}>
        {title === 'Ingresos' ? `$${stat.value.toLocaleString()}` : 
         title === 'Calificación' ? stat.value.toFixed(1) : 
         stat.value.toLocaleString()}
      </Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const renderChart = () => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Visitantes por Día</Text>
      <View style={styles.chart}>
        {chartData.map((item, index) => (
          <View key={index} style={styles.chartBar}>
            <View 
              style={[
                styles.bar, 
                { 
                  height: (item.visitors / maxVisitors) * 100,
                  backgroundColor: '#4ADE80'
                }
              ]} 
            />
            <Text style={styles.barValue}>{item.visitors}</Text>
            <Text style={styles.barLabel}>{item.day}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderServiceCard = (service, index) => (
    <View key={index} style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <View style={[styles.serviceIndicator, { backgroundColor: service.color }]} />
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.serviceDetails}>
            {service.bookings} reservas • ${service.revenue.toLocaleString()}
          </Text>
        </View>
      </View>
      <View style={styles.serviceProgress}>
        <View 
          style={[
            styles.progressBar, 
            { 
              width: `${(service.bookings / 50) * 100}%`,
              backgroundColor: service.color 
            }
          ]} 
        />
      </View>
    </View>
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
        <Text style={styles.headerTitle}>Estadísticas</Text>
        <TouchableOpacity style={styles.exportButton}>
          <Ionicons name="download" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.selectedPeriod
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text style={[
                styles.periodText,
                selectedPeriod === period.key && styles.selectedPeriodText
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          {renderStatCard('Visitantes', stats.visitors, 'people')}
          {renderStatCard('Ingresos', stats.revenue, 'cash')}
          {renderStatCard('Calificación', stats.rating, 'star')}
          {renderStatCard('Reservas', stats.bookings, 'calendar')}
        </View>

        {/* Chart */}
        {renderChart()}

        {/* Top Services */}
        <View style={styles.servicesContainer}>
          <Text style={styles.sectionTitle}>Servicios Más Populares</Text>
          {topServices.map((service, index) => renderServiceCard(service, index))}
        </View>

        {/* Recent Activity */}
        <View style={styles.activityContainer}>
          <Text style={styles.sectionTitle}>Actividad Reciente</Text>
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.activityText}>Nueva reserva de María González</Text>
              <Text style={styles.activityTime}>Hace 2h</Text>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.activityText}>Reseña 5 estrellas recibida</Text>
              <Text style={styles.activityTime}>Hace 4h</Text>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.activityText}>Tour completado - 6 personas</Text>
              <Text style={styles.activityTime}>Hace 6h</Text>
            </View>
          </View>
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
  exportButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  selectedPeriod: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedPeriodText: {
    color: '#1F2937',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    width: (width - 48) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: 20,
    borderRadius: 4,
    marginBottom: 8,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  servicesContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  serviceCard: {
    marginBottom: 16,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  serviceDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  serviceProgress: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    marginLeft: 24,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  activityContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityList: {
    marginTop: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default StatisticsScreen;
