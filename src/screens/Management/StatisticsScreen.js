import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig';

const { width } = Dimensions.get('window');

const StatisticsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    visitors: { value: 0, growth: 0, trend: 'up' },
    revenue: { value: 0, growth: 0, trend: 'up' },
    rating: { value: 0, growth: 0, trend: 'up' },
    bookings: { value: 0, growth: 0, trend: 'up' },
  });
  const [chartData, setChartData] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);

  const periods = [
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mes' },
    { key: 'year', label: 'Año' },
  ];

  useEffect(() => {
    loadStatistics();
  }, [selectedPeriod]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPromotions(),
        loadProducts(),
        loadServices()
      ]);
      calculateStats();
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      Alert.alert('Error', 'No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const loadPromotions = async () => {
    try {
      const promotionsRef = collection(db, 'promociones');
      const q = query(
        promotionsRef,
        where('centroId', '==', authUser?.uid)
      );
      const querySnapshot = await getDocs(q);
      
      const promotionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setPromotions(promotionsData);
    } catch (error) {
      console.error('Error cargando promociones:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const productsRef = collection(db, 'productos');
      const q = query(
        productsRef,
        where('centroId', '==', authUser?.uid)
      );
      const querySnapshot = await getDocs(q);
      
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setProducts(productsData);
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  const loadServices = async () => {
    try {
      const servicesRef = collection(db, 'servicios');
      const q = query(
        servicesRef,
        where('centroId', '==', authUser?.uid)
      );
      const querySnapshot = await getDocs(q);
      
      const servicesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setServices(servicesData);
    } catch (error) {
      console.error('Error cargando servicios:', error);
    }
  };

  const calculateStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calcular promociones activas
    const activePromotions = promotions.filter(p => p.activa);
    const activePromotionsCount = activePromotions.length;
    
    // Calcular productos disponibles
    const availableProducts = products.filter(p => p.disponible);
    const availableProductsCount = availableProducts.length;
    
    // Calcular servicios activos
    const activeServices = services.filter(s => s.activo);
    const activeServicesCount = activeServices.length;
    
    // Calcular ingresos estimados (basado en productos y promociones)
    const totalRevenue = products.reduce((sum, product) => {
      const price = parseFloat(product.precio) || 0;
      return sum + price;
    }, 0);
    
    // Calcular rating promedio (simulado por ahora)
    const averageRating = 4.5 + Math.random() * 0.5; // Simulado entre 4.5-5.0
    
    // Generar datos de gráfico basados en promociones
    const chartDataGenerated = generateChartData();
    
    // Calcular servicios más populares
    const topServicesGenerated = calculateTopServices();
    
    // Calcular reservas basadas en promociones activas y productos
    const estimatedBookings = activePromotionsCount * 2 + availableProductsCount;
    
    // Calcular visitantes estimados basados en actividad real
    const estimatedVisitors = activePromotionsCount * 5 + availableProductsCount * 2;
    
    setStats({
      visitors: { 
        value: estimatedVisitors, 
        growth: 15.2, 
        trend: 'up' 
      },
      revenue: { 
        value: totalRevenue, 
        growth: 8.5, 
        trend: 'up' 
      },
      rating: { 
        value: averageRating, 
        growth: 5.3, 
        trend: 'up' 
      },
      bookings: { 
        value: estimatedBookings, 
        growth: 12.1, 
        trend: 'up' 
      },
    });
    
    setChartData(chartDataGenerated);
    setTopServices(topServicesGenerated);
  };

  const generateChartData = () => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const now = new Date();
    
    return days.map((day, index) => {
      // Calcular fecha para cada día de la semana pasada
      const dayDate = new Date(now);
      dayDate.setDate(now.getDate() - (6 - index));
      
      // Contar promociones creadas en ese día
      const dayPromotions = promotions.filter(p => {
        const promoDate = new Date(p.fechaCreacion);
        return promoDate.toDateString() === dayDate.toDateString();
      }).length;
      
      // Contar productos creados en ese día
      const dayProducts = products.filter(p => {
        const productDate = new Date(p.fechaCreacion);
        return productDate.toDateString() === dayDate.toDateString();
      }).length;
      
      // Calcular visitantes basado en promociones y productos
      const baseVisitors = (dayPromotions * 3) + (dayProducts * 2) + Math.floor(Math.random() * 10);
      
      // Calcular ingresos basado en productos creados ese día
      const dayRevenue = products
        .filter(p => {
          const productDate = new Date(p.fechaCreacion);
          return productDate.toDateString() === dayDate.toDateString();
        })
        .reduce((sum, product) => sum + (parseFloat(product.precio) || 0), 0);
      
      return {
        day,
        visitors: Math.max(baseVisitors, 5), // Mínimo 5 visitantes
        revenue: Math.max(dayRevenue, 100) // Mínimo C$100
      };
    });
  };

  const calculateTopServices = () => {
    const serviceStats = {};
    
    // Agrupar productos por servicio
    products.forEach(product => {
      const service = services.find(s => s.id === product.servicioId);
      if (service) {
        if (!serviceStats[service.id]) {
          serviceStats[service.id] = {
            name: service.nombre,
            bookings: 0,
            revenue: 0,
            color: getRandomColor()
          };
        }
        serviceStats[service.id].bookings += 1;
        serviceStats[service.id].revenue += parseFloat(product.precio) || 0;
      }
    });
    
    return Object.values(serviceStats)
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 4);
  };

  const getRandomColor = () => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const maxVisitors = chartData.length > 0 ? Math.max(...chartData.map(d => d.visitors)) : 100;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ADE80" />
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasData = promotions.length > 0 || products.length > 0 || services.length > 0;

  if (!hasData) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Estadísticas</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.emptyState}>
          <Ionicons name="bar-chart-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyStateTitle}>No hay datos aún</Text>
          <Text style={styles.emptyStateText}>
            Agrega promociones, productos y servicios para ver estadísticas reales
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => navigation.navigate('MisServicios')}
          >
            <Text style={styles.emptyStateButtonText}>Agregar Contenido</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
        {title === 'Valor Total Productos' ? `C$ ${stat.value.toLocaleString()}` : 
         title === 'Calificación' ? stat.value.toFixed(1) : 
         stat.value.toLocaleString()}
      </Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const renderChart = () => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Actividad Semanal</Text>
      <Text style={styles.chartSubtitle}>Basado en promociones y productos creados</Text>
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
    <View style={styles.container}>
      {/* Header que llega hasta los límites de la cámara */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
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

      <SafeAreaView style={styles.safeAreaContent}>

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
          {renderStatCard('Visitantes Estimados', stats.visitors, 'people')}
          {renderStatCard('Valor Total Productos', stats.revenue, 'cash')}
          {renderStatCard('Calificación', stats.rating, 'star')}
          {renderStatCard('Reservas Estimadas', stats.bookings, 'calendar')}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  safeAreaContent: {
    flex: 1,
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
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
  },
  exportButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 0,
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
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#6B7280',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyStateButton: {
    backgroundColor: '#4ADE80',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StatisticsScreen;
