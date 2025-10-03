import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Register/RegisterScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import CentroTuristicoProfileScreen from '../screens/Profile/CentroTuristicoProfileScreen';
import TuristaProfileScreen from '../screens/Profile/TuristaProfileScreen';
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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: route.name === 'Home' ? false : true,
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
          const name = route.name === 'Home' ? 'map' : 'person-circle';
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Mapa' }}
      />
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
    <Stack.Navigator initialRouteName="Main" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={TabsNavigator} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="MapPicker" component={MapPickerScreen} />
      <Stack.Screen name="CentroTuristicoProfile" component={CentroTuristicoProfileScreen} />
      <Stack.Screen name="TuristaProfile" component={TuristaProfileScreen} />
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
    </Stack.Navigator>
  );
}

export default AppNavigator;


