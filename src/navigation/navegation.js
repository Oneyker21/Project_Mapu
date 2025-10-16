import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Register/RegisterScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import CentroTuristicoProfileScreen from '../screens/Profile/CentroTuristicoProfileScreen';
import TuristaProfileScreen from '../screens/Profile/TuristaProfileScreen';
import MisServiciosScreen from '../screens/Management/MisServiciosScreen';
import ServicesMainScreen from '../screens/Services/ServicesMainScreen';
import MapPickerScreen from '../screens/Map/MapPickerScreen';
import ReviewsScreen from '../screens/Reviews/ReviewsScreen';
import ReservationsScreen from '../screens/Management/ReservationsScreen';
import StatisticsScreen from '../screens/Management/StatisticsScreen';
import PromotionsScreen from '../screens/Management/PromotionsScreen';
import NotificationsScreen from '../screens/Management/NotificationsScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import PrivacyPolicyScreen from '../screens/Legal/PrivacyPolicyScreen';
import TermsAndConditionsScreen from '../screens/Legal/TermsAndConditionsScreen';
import { 
  SearchByDepartmentScreen, 
  SearchByCategoryScreen, 
  CreateRouteScreen, 
  NearbyCentersScreen,
  UnifiedSearchScreen,
  CenterDetailScreen
} from '../screens/Search';
import CentersMapScreen from '../screens/Search/CentersMapScreen';
import { 
  RouteCreationScreen,
  RouteNavigationScreen,
  RouteSummaryScreen
} from '../screens/Route';
import RouteEvaluationScreen from '../screens/Route/RouteEvaluationScreen';
import ExploreRoutesScreen from '../screens/Route/ExploreRoutesScreen';
import FavoriteRoutesScreen from '../screens/Route/FavoriteRoutesScreen';
import GroupsScreen from '../screens/Groups/GroupsScreen';
import GroupDetailScreen from '../screens/Groups/GroupDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabsNavigator() {
  const { user } = useAuth();
  const isCenter = user?.role === 'centro_turistico' || user?.tipoUsuario === 'CentroTuristico';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // Ocultar todos los headers
        headerStyle: {
          backgroundColor: '#FFFFFF',
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3.84,
          elevation: 5,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: '#111827',
        },
        tabBarStyle: {
          display: 'none', // Ocultar el tab bar ya que tenemos footer personalizado
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarIcon: ({ color, size }) => {
          const iconMap = {
            'Home': 'home',
            'ExplorarCentros': 'compass',
            'ExplorarRutas': 'map',
            'MisServicios': 'business',
            'Reservations': 'calendar',
            'Perfil': 'person-circle'
          };
          return <Ionicons name={iconMap[route.name] || 'help'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Inicio' }}
      />
      
      {/* Pestañas solo para turistas */}
      {!isCenter && (
        <>
          <Tab.Screen 
            name="ExplorarCentros" 
            component={UnifiedSearchScreen}
            options={{ title: 'Explorar Centros' }}
          />
          <Tab.Screen 
            name="ExplorarRutas" 
            component={ExploreRoutesScreen}
            options={{ title: 'Explorar Rutas' }}
          />
        </>
      )}
      
      {/* Pestañas solo para centros turísticos */}
      {isCenter && (
        <>
          <Tab.Screen 
            name="MisServicios" 
            component={MisServiciosScreen}
            options={{ title: 'Mis Servicios' }}
          />
          <Tab.Screen 
            name="Reservations" 
            component={ReservationsScreen}
            options={{ title: 'Reservaciones' }}
          />
        </>
      )}
      
      <Tab.Screen 
        name="Perfil" 
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

// Drawer eliminado para evitar panel lateral por deslizamiento

export function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Tabs" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabsNavigator} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="MapPicker" component={MapPickerScreen} />
      <Stack.Screen name="CentroTuristicoProfile" component={CentroTuristicoProfileScreen} />
      <Stack.Screen name="TuristaProfile" component={TuristaProfileScreen} />
      <Stack.Screen name="MisServicios" component={MisServiciosScreen} />
      <Stack.Screen 
        name="ServicesMain" 
        component={ServicesMainScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Reviews" component={ReviewsScreen} />
      <Stack.Screen 
        name="Reservations" 
        component={ReservationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Statistics" 
        component={StatisticsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Promotions" 
        component={PromotionsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PrivacyPolicy" 
        component={PrivacyPolicyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="TermsAndConditions" 
        component={TermsAndConditionsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="SearchByDepartment" 
        component={SearchByDepartmentScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="SearchByCategory" 
        component={SearchByCategoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CreateRoute" 
        component={CreateRouteScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="NearbyCenters" 
        component={NearbyCentersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="UnifiedSearch" 
        component={UnifiedSearchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CenterDetail" 
        component={CenterDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CentersMap" 
        component={CentersMapScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RouteCreation" 
        component={RouteCreationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RouteNavigation" 
        component={RouteNavigationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RouteSummary" 
        component={RouteSummaryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RouteEvaluation" 
        component={RouteEvaluationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ExploreRoutes" 
        component={ExploreRoutesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="FavoriteRoutes" 
        component={FavoriteRoutesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Groups" 
        component={GroupsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="GroupDetail" 
        component={GroupDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default AppNavigator;


