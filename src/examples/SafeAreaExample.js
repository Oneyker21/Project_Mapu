import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const SafeAreaExample = () => {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState(
    Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      title: `Elemento ${i + 1}`,
      description: `Descripción del elemento ${i + 1}`,
    }))
  );

  const handleItemPress = (item) => {
    Alert.alert('Elemento presionado', `Seleccionaste: ${item.title}`);
  };

  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { 
          paddingTop: insets.top, 
          paddingBottom: insets.bottom 
        }
      ]} 
      edges={[]}
    >
      {/* Header fijo */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ejemplo SafeArea</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="menu" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Contenido con scroll */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 } // Espacio extra para el bottom
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Lista de Elementos</Text>
          <Text style={styles.sectionSubtitle}>
            Este ejemplo muestra cómo usar SafeAreaView correctamente para evitar 
            que el contenido se superponga con las barras del sistema.
          </Text>

          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.item}
              onPress={() => handleItemPress(item)}
            >
              <View style={styles.itemIcon}>
                <Ionicons name="document" size={24} color="#3B82F6" />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Footer fijo */}
      <View style={[
        styles.footer,
        { paddingBottom: insets.bottom }
      ]}>
        <TouchableOpacity style={styles.footerButton}>
          <Ionicons name="home" size={24} color="#3B82F6" />
          <Text style={styles.footerButtonText}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton}>
          <Ionicons name="search" size={24} color="#6B7280" />
          <Text style={styles.footerButtonText}>Buscar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton}>
          <Ionicons name="person" size={24} color="#6B7280" />
          <Text style={styles.footerButtonText}>Perfil</Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 24,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  footerButton: {
    alignItems: 'center',
    padding: 8,
  },
  footerButtonText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});

export default SafeAreaExample;
