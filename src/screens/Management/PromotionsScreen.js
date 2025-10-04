import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig';

const PromotionsScreen = ({ navigation }) => {
  const { user: authUser } = useAuth();
  const [selectedTab, setSelectedTab] = useState('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEditStartDatePicker, setShowEditStartDatePicker] = useState(false);
  const [showEditEndDatePicker, setShowEditEndDatePicker] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  const [newPromotion, setNewPromotion] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'percentage', // percentage, fixed, special
    descuento: '',
    fechaInicio: '',
    fechaFin: '',
    limiteUsos: null,
    activa: true,
    productoId: '', // ID del producto seleccionado
    imagen: ''
  });

  const tiposPromocion = [
    { id: 'percentage', nombre: 'Descuento Porcentual', icon: 'pricetag', color: '#3B82F6' },
    { id: 'fixed', nombre: 'Descuento Fijo', icon: 'cash', color: '#F59E0B' },
    { id: 'special', nombre: 'Oferta Especial', icon: 'gift', color: '#10B981' },
  ];

  const tabs = [
    { key: 'active', title: 'Activas' },
    { key: 'draft', title: 'Borradores' },
    { key: 'expired', title: 'Expiradas' },
  ];

  useEffect(() => {
    loadPromotions();
    loadProducts();
    loadServices();
  }, []);

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

  const getFilteredProducts = () => {
    let filteredProducts = products;

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      filteredProducts = filteredProducts.filter(product =>
        product.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.descripcion?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrar por categoría
    if (selectedCategory !== 'todos') {
      filteredProducts = filteredProducts.filter(product => {
        const service = services.find(s => s.id === product.servicioId);
        return service && service.tipo === selectedCategory;
      });
    }

    // Filtrar por rango de precio
    if (priceRange.min || priceRange.max) {
      filteredProducts = filteredProducts.filter(product => {
        if (!product.precio) return false;
        const price = parseFloat(product.precio);
        const min = priceRange.min ? parseFloat(priceRange.min) : 0;
        const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        return price >= min && price <= max;
      });
    }

    return filteredProducts;
  };

  const getProductCategories = () => {
    const categories = [{ id: 'todos', nombre: 'Todos', icon: 'grid', count: products.length }];
    
    const tiposServicio = [
      { id: 'restaurante', nombre: 'Restaurante', icon: 'restaurant' },
      { id: 'hotel', nombre: 'Hotel', icon: 'bed' },
      { id: 'actividad', nombre: 'Actividad', icon: 'bicycle' },
      { id: 'tienda', nombre: 'Tienda', icon: 'storefront' },
    ];

    tiposServicio.forEach(tipo => {
      const count = products.filter(product => {
        const service = services.find(s => s.id === product.servicioId);
        return service && service.tipo === tipo.id;
      }).length;
      
      if (count > 0) {
        categories.push({
          id: tipo.id,
          nombre: tipo.nombre,
          icon: tipo.icon,
          count: count
        });
      }
    });
    
    return categories;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('todos');
    setPriceRange({ min: '', max: '' });
  };

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'promociones'),
        where('centroId', '==', authUser?.uid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const promotionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Ordenar por fecha de creación en el cliente
        promotionsData.sort((a, b) => 
          new Date(b.fechaCreacion) - new Date(a.fechaCreacion)
        );
        
        setPromotions(promotionsData);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error cargando promociones:', error);
      Alert.alert('Error', 'No se pudieron cargar las promociones');
      setLoading(false);
    }
  };

  const handleAddPromotion = async () => {
    if (!newPromotion.titulo.trim()) {
      Alert.alert('Error', 'El título de la promoción es requerido');
      return;
    }

    if (!newPromotion.descripcion.trim()) {
      Alert.alert('Error', 'La descripción es requerida');
      return;
    }

    if (newPromotion.tipo !== 'special' && !newPromotion.descuento) {
      Alert.alert('Error', 'El descuento es requerido');
      return;
    }

    if (!newPromotion.productoId) {
      Alert.alert('Error', 'Debe seleccionar un producto');
      return;
    }

    setSaving(true);
    try {
      const promotionData = {
        ...newPromotion,
        centroId: authUser?.uid,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        usos: 0,
        activa: newPromotion.activa
      };

      await addDoc(collection(db, 'promociones'), promotionData);
      
      Alert.alert('Éxito', 'Promoción creada correctamente');
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Error agregando promoción:', error);
      Alert.alert('Error', 'No se pudo crear la promoción');
    } finally {
      setSaving(false);
    }
  };

  const handleEditPromotion = (promotion) => {
    // Guardar los datos originales para comparar cambios
    const originalData = {
      ...promotion,
      originalTitulo: promotion.titulo,
      originalDescripcion: promotion.descripcion,
      originalDescuento: promotion.descuento,
      originalFechaInicio: promotion.fechaInicio,
      originalFechaFin: promotion.fechaFin,
      originalProductoId: promotion.productoId,
      originalImagen: promotion.imagen,
      originalLimiteUsos: promotion.limiteUsos
    };
    setEditingPromotion(originalData);
    setShowEditModal(true);
  };

  const handleUpdatePromotion = async () => {
    if (!editingPromotion.titulo.trim()) {
      Alert.alert('Error', 'El título de la promoción es requerido');
      return;
    }

    if (!editingPromotion.productoId) {
      Alert.alert('Error', 'Debe seleccionar un producto');
      return;
    }

    setSaving(true);
    try {
      const promotionRef = doc(db, 'promociones', editingPromotion.id);
      await updateDoc(promotionRef, {
        ...editingPromotion,
        fechaActualizacion: new Date().toISOString(),
      });
      
      Alert.alert('Éxito', 'Promoción actualizada correctamente');
      setShowEditModal(false);
      setEditingPromotion(null);
    } catch (error) {
      console.error('Error actualizando promoción:', error);
      Alert.alert('Error', 'No se pudo actualizar la promoción');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePromotion = async (promotionId) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar esta promoción?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'promociones', promotionId));
              Alert.alert('Éxito', 'Promoción eliminada correctamente');
            } catch (error) {
              console.error('Error eliminando promoción:', error);
              Alert.alert('Error', 'No se pudo eliminar la promoción');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setNewPromotion({
      titulo: '',
      descripcion: '',
      tipo: 'percentage',
      descuento: '',
      fechaInicio: '',
      fechaFin: '',
      limiteUsos: '',
      activa: true,
      productoId: '',
      imagen: ''
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Seleccionar fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: '2-digit'
    });
  };

  // Funciones para manejar imágenes
  const pickImage = async (type) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (type === 'create') {
        setNewPromotion(prev => ({ ...prev, imagen: result.assets[0].uri }));
      } else {
        setEditingPromotion(prev => ({ ...prev, imagen: result.assets[0].uri }));
      }
    }
  };

  const takePhoto = async (type) => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (type === 'create') {
        setNewPromotion(prev => ({ ...prev, imagen: result.assets[0].uri }));
      } else {
        setEditingPromotion(prev => ({ ...prev, imagen: result.assets[0].uri }));
      }
    }
  };

  const showImageOptions = (type) => {
    Alert.alert(
      'Seleccionar imagen',
      '¿Cómo quieres agregar la imagen?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cámara', onPress: () => takePhoto(type) },
        { text: 'Galería', onPress: () => pickImage(type) },
      ]
    );
  };

  // Función para compartir promoción
  const handleSharePromotion = async (promotion) => {
    try {
      const tipoInfo = tiposPromocion.find(t => t.id === promotion.tipo);
      const descuentoText = promotion.tipo === 'percentage' 
        ? `${promotion.descuento}% de descuento`
        : promotion.tipo === 'fixed' 
        ? `C$${promotion.descuento} de descuento`
        : promotion.descuento;

      const fechaInicio = formatDate(promotion.fechaInicio);
      const fechaFin = formatDate(promotion.fechaFin);
      
      // Obtener información del producto
      const selectedProduct = products.find(p => p.id === promotion.productoId);
      const productService = services.find(s => s.id === selectedProduct?.servicioId);
      
      const shareText = `🎉 ${promotion.titulo}\n\n${promotion.descripcion}\n\n💰 ${descuentoText}\n📅 Válido del ${fechaInicio} al ${fechaFin}\n\n${selectedProduct ? `🛍️ Producto: ${selectedProduct.nombre}` : ''}\n${productService ? `🏷️ Servicio: ${productService.nombre}` : ''}\n\n¡No te lo pierdas! 🚀`;

      // Mostrar opciones de compartir
      Alert.alert(
        'Compartir Promoción',
        '¿Cómo quieres compartir?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Como Texto', 
            onPress: () => {
              Alert.alert(
                'Compartir Promoción',
                shareText,
                [
                  { text: 'Cerrar', style: 'cancel' },
                  { 
                    text: 'Copiar', 
                    onPress: () => {
                      Alert.alert('¡Listo!', 'El texto está listo para copiar y compartir en WhatsApp');
                    }
                  }
                ]
              );
            }
          },
          { 
            text: 'Como Imagen', 
            onPress: () => {
              // Por ahora, mostrar el texto formateado para que el usuario pueda hacer screenshot
              Alert.alert(
                '📸 Crear Imagen',
                'Para crear una imagen bonita:\n\n1. Toma un screenshot de esta pantalla\n2. Usa una app de edición para mejorar la imagen\n3. Comparte la imagen en WhatsApp\n\n¿Quieres ver el texto formateado?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { 
                    text: 'Ver Texto', 
                    onPress: () => {
                      Alert.alert(
                        '📱 Texto para Imagen',
                        `🎉 ${promotion.titulo}\n\n${promotion.descripcion}\n\n💰 ${descuentoText}\n📅 ${fechaInicio} - ${fechaFin}\n\n${selectedProduct ? `🛍️ ${selectedProduct.nombre}` : ''}\n${productService ? `🏷️ ${productService.nombre}` : ''}\n\n¡No te lo pierdas! 🚀`,
                        [{ text: 'Listo', style: 'default' }]
                      );
                    }
                  }
                ]
              );
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error al compartir:', error);
      Alert.alert('Error', 'No se pudo compartir la promoción');
    }
  };

  // Función para detectar si hay cambios sin guardar
  const checkForUnsavedChanges = () => {
    // Solo verificar si hay datos en el formulario de crear
    const hasNewPromotionData = newPromotion.titulo.trim() !== '' || 
                               newPromotion.descripcion.trim() !== '' || 
                               newPromotion.descuento.trim() !== '' || 
                               newPromotion.fechaInicio !== '' || 
                               newPromotion.fechaFin !== '' || 
                               newPromotion.productoId !== '' ||
                               newPromotion.imagen !== '' ||
                               (newPromotion.limiteUsos !== null && newPromotion.limiteUsos.trim() !== '');
    
    // Para edición, comparar con los datos originales
    const hasEditPromotionData = editingPromotion && (
      editingPromotion.titulo !== editingPromotion.originalTitulo ||
      editingPromotion.descripcion !== editingPromotion.originalDescripcion ||
      editingPromotion.descuento !== editingPromotion.originalDescuento ||
      editingPromotion.fechaInicio !== editingPromotion.originalFechaInicio ||
      editingPromotion.fechaFin !== editingPromotion.originalFechaFin ||
      editingPromotion.productoId !== editingPromotion.originalProductoId ||
      editingPromotion.imagen !== editingPromotion.originalImagen ||
      editingPromotion.limiteUsos !== editingPromotion.originalLimiteUsos
    );
    
    return hasNewPromotionData || hasEditPromotionData;
  };

  // Función para manejar el botón atrás
  const handleBackPress = () => {
    if (checkForUnsavedChanges()) {
      Alert.alert(
        'Cambios sin guardar',
        'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Salir sin guardar', 
            style: 'destructive',
            onPress: () => {
              // Limpiar los formularios
              setNewPromotion({
                titulo: '',
                descripcion: '',
                tipo: 'percentage',
                descuento: '',
                fechaInicio: '',
                fechaFin: '',
                limiteUsos: null,
                imagen: ''
              });
              setEditingPromotion(null);
              setShowCreateModal(false);
              setShowEditModal(false);
              navigation.goBack();
            }
          }
        ]
      );
    } else {
      navigation.goBack();
    }
  };


  const handleDateSelect = (event, selectedDate, type) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
      setShowEndDatePicker(false);
    }
    
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      if (type === 'start') {
        setNewPromotion({...newPromotion, fechaInicio: formattedDate});
        if (Platform.OS === 'ios') {
          setShowStartDatePicker(false);
        }
      } else if (type === 'end') {
        setNewPromotion({...newPromotion, fechaFin: formattedDate});
        if (Platform.OS === 'ios') {
          setShowEndDatePicker(false);
        }
      }
    }
  };


  const handleEditDateSelect = (event, selectedDate, type) => {
    if (Platform.OS === 'android') {
      setShowEditStartDatePicker(false);
      setShowEditEndDatePicker(false);
    }
    
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      if (type === 'start') {
        setEditingPromotion({...editingPromotion, fechaInicio: formattedDate});
        if (Platform.OS === 'ios') {
          setShowEditStartDatePicker(false);
        }
      } else if (type === 'end') {
        setEditingPromotion({...editingPromotion, fechaFin: formattedDate});
        if (Platform.OS === 'ios') {
          setShowEditEndDatePicker(false);
        }
      }
    }
  };

  const getFilteredPromotions = () => {
    const now = new Date();
    return promotions.filter(promotion => {
      const fechaFin = new Date(promotion.fechaFin);
      const isExpired = fechaFin < now;
      
      switch (selectedTab) {
        case 'active':
          // Activas: deben estar activas Y no expiradas
          return promotion.activa && !isExpired;
        case 'draft':
          // Borradores: deben estar inactivas (sin importar fecha)
          return !promotion.activa;
        case 'expired':
          // Expiradas: deben estar activas PERO expiradas
          return promotion.activa && isExpired;
        default:
          return true;
      }
    });
  };

  // Función para contar promociones por categoría
  const getPromotionCount = (tab) => {
    const now = new Date();
    return promotions.filter(promotion => {
      const fechaFin = new Date(promotion.fechaFin);
      const isExpired = fechaFin < now;
      
      switch (tab) {
        case 'active':
          return promotion.activa && !isExpired;
        case 'draft':
          return !promotion.activa;
        case 'expired':
          return promotion.activa && isExpired;
        default:
          return false;
      }
    }).length;
  };

  const renderPromotion = ({ item }) => {
    const tipoInfo = tiposPromocion.find(t => t.id === item.tipo);
    const fechaFin = new Date(item.fechaFin);
    const isExpired = fechaFin < new Date();
    const usagePercentage = item.limiteUsos ? (item.usos / item.limiteUsos) * 100 : 0;

    return (
    <View style={styles.promotionCard}>
        {/* Imagen de la promoción */}
        {item.imagen && (
          <View style={styles.promotionImageContainer}>
            <Image source={{ uri: item.imagen }} style={styles.promotionImage} />
          </View>
        )}
        
        <View style={styles.promotionHeader}>
          <View style={styles.promotionInfo}>
            <View style={[styles.promotionIcon, { backgroundColor: `${tipoInfo?.color}20` }]}>
              <Ionicons name={tipoInfo?.icon || 'gift'} size={20} color={tipoInfo?.color} />
            </View>
            <View style={styles.promotionDetails}>
              <Text style={styles.promotionTitle}>{item.titulo}</Text>
              <Text style={styles.promotionType}>{tipoInfo?.nombre}</Text>
            </View>
          </View>
        <View style={styles.promotionActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSharePromotion(item)}
          >
            <Ionicons name="share" size={20} color="#4ADE80" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeletePromotion(item.id)}
          >
            <Ionicons name="trash" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
        </View>

        <Text style={styles.promotionDescription}>{item.descripcion}</Text>

        <View style={styles.promotionStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {item.tipo === 'percentage' ? `${item.descuento}%` : 
               item.tipo === 'fixed' ? `$${item.descuento}` : 'Especial'}
            </Text>
            <Text style={styles.statLabel}>Descuento</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.usos || 0}/{item.limiteUsos || '∞'}</Text>
            <Text style={styles.statLabel}>Usados</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {isExpired ? 'Expirada' : fechaFin.toLocaleDateString()}
            </Text>
            <Text style={styles.statLabel}>Vence</Text>
          </View>
        </View>

        {item.limiteUsos && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progress, 
                  { width: `${Math.min(usagePercentage, 100)}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
              {Math.round(usagePercentage)}% utilizado
          </Text>
        </View>
        )}

        <View style={styles.promotionActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleEditPromotion(item)}
          >
            <Ionicons name="create" size={16} color="#F59E0B" />
            <Text style={[styles.actionText, { color: '#F59E0B' }]}>Editar</Text>
          </TouchableOpacity>
      </View>
    </View>
  );
  };

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {
                if (checkForUnsavedChanges()) {
                  Alert.alert(
                    'Cambios sin guardar',
                    'Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { 
                        text: 'Cerrar sin guardar', 
                        style: 'destructive',
                        onPress: () => {
                          setNewPromotion({
                            titulo: '',
                            descripcion: '',
                            tipo: 'percentage',
                            descuento: '',
                            fechaInicio: '',
                            fechaFin: '',
                            limiteUsos: null,
                            productoId: '',
                            imagen: ''
                          });
                          setShowCreateModal(false);
                        }
                      }
                    ]
                  );
                } else {
                  setShowCreateModal(false);
                }
              }}
            >
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          <Text style={styles.modalTitle}>Crear Promoción</Text>
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
            onPress={handleAddPromotion}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar</Text>
            )}
          </TouchableOpacity>
      </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Título *</Text>
            <TextInput
              style={styles.input}
              value={newPromotion.titulo}
              onChangeText={(text) => setNewPromotion({...newPromotion, titulo: text})}
              placeholder="Ej: Descuento de Verano"
            />
            </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Descripción *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newPromotion.descripcion}
              onChangeText={(text) => setNewPromotion({...newPromotion, descripcion: text})}
              placeholder="Describe tu promoción..."
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Sección de selección de producto */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Producto en Promoción *</Text>
            <Text style={styles.labelSubtext}>Selecciona el producto que estará en descuento</Text>
            
            {newPromotion.productoId ? (
              <View style={styles.selectedProductContainer}>
                {(() => {
                  const selectedProduct = products.find(p => p.id === newPromotion.productoId);
                  const productService = services.find(s => s.id === selectedProduct?.servicioId);
                  return (
                    <View style={styles.selectedProductCard}>
                      <View style={styles.selectedProductImage}>
                        {selectedProduct?.imagen ? (
                          <Image source={{ uri: selectedProduct.imagen }} style={styles.selectedProductImagePreview} />
                        ) : (
                          <Ionicons name="cube" size={24} color="#6B7280" />
                        )}
                      </View>
                      <View style={styles.selectedProductInfo}>
                        <Text style={styles.selectedProductName}>{selectedProduct?.nombre}</Text>
                        <Text style={styles.selectedProductService}>{productService?.nombre || 'Sin servicio'}</Text>
                        {selectedProduct?.precio && (
                          <Text style={styles.selectedProductPrice}>
                            C$ {parseFloat(selectedProduct.precio).toLocaleString('es-NI')}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity 
                        style={styles.changeProductButton}
                        onPress={() => setShowProductSelector(true)}
                      >
                        <Ionicons name="swap-horizontal" size={20} color="#4ADE80" />
                        <Text style={styles.changeProductText}>Cambiar</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })()}
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.selectProductButton}
                onPress={() => setShowProductSelector(true)}
              >
                <Ionicons name="cube" size={32} color="#6B7280" />
                <Text style={styles.selectProductText}>Seleccionar Producto</Text>
                <Text style={styles.selectProductSubtext}>Toca para elegir de tus productos</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Tipo de Promoción *</Text>
            <View style={styles.tipoContainer}>
              {tiposPromocion.map((tipo) => (
                <TouchableOpacity
                  key={tipo.id}
                  style={[
                    styles.tipoOption,
                    newPromotion.tipo === tipo.id && styles.tipoOptionSelected
                  ]}
                  onPress={() => setNewPromotion({...newPromotion, tipo: tipo.id})}
                >
                  <Ionicons 
                    name={tipo.icon} 
                    size={20} 
                    color={newPromotion.tipo === tipo.id ? '#FFFFFF' : tipo.color} 
                  />
                  <Text style={[
                    styles.tipoText,
                    newPromotion.tipo === tipo.id && styles.tipoTextSelected
                  ]}>
                    {tipo.nombre}
                  </Text>
            </TouchableOpacity>
              ))}
            </View>
          </View>

          {newPromotion.tipo !== 'special' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Descuento {newPromotion.tipo === 'percentage' ? '(%)' : '($)'} *
              </Text>
              <TextInput
                style={styles.input}
                value={newPromotion.descuento}
                onChangeText={(text) => setNewPromotion({...newPromotion, descuento: text})}
                placeholder={newPromotion.tipo === 'percentage' ? '30' : '50'}
                keyboardType="numeric"
              />
            </View>
          )}

          {/* Sistema de Fechas */}
          <View style={styles.formGroup}>
            <View style={styles.dateSectionContainer}>
              <View style={styles.dateSectionHeader}>
                <Ionicons name="calendar-outline" size={20} color="#4ADE80" />
                <Text style={styles.dateSectionTitle}>Establecer fechas</Text>
              </View>
              
              <View style={styles.dateContainer}>
                <View style={styles.dateSelector}>
                  <Text style={styles.dateLabel}>Fecha inicio</Text>
                  <TouchableOpacity 
                    style={styles.dateButton}
                    onPress={() => {
                      setShowEndDatePicker(false);
                      setShowStartDatePicker(true);
                    }}
                  >
                    <Ionicons name="calendar" size={18} color="#4ADE80" />
                    <Text style={styles.dateText}>
                      {formatDate(newPromotion.fechaInicio)}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.dateSelector}>
                  <Text style={styles.dateLabel}>Fecha fin</Text>
                  <TouchableOpacity 
                    style={styles.dateButton}
                    onPress={() => {
                      setShowStartDatePicker(false);
                      setShowEndDatePicker(true);
                    }}
                  >
                    <Ionicons name="calendar" size={18} color="#4ADE80" />
                    <Text style={styles.dateText}>
                      {formatDate(newPromotion.fechaFin)}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Sistema de Usos Límites */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Límite de Usos</Text>
            <Text style={styles.labelSubtext}>
              ¿Cuántas veces se puede usar esta promoción? (Opcional)
            </Text>
            
            <View style={styles.usageContainer}>
              <View style={styles.usageOption}>
                <TouchableOpacity 
                  style={[
                    styles.usageButton,
                    newPromotion.limiteUsos === null && styles.usageButtonSelected
                  ]}
                  onPress={() => setNewPromotion({...newPromotion, limiteUsos: null})}
                >
                  <Ionicons 
                    name="infinite" 
                    size={20} 
                    color={newPromotion.limiteUsos === null ? '#FFFFFF' : '#6B7280'} 
                  />
                  <Text style={[
                    styles.usageText,
                    newPromotion.limiteUsos === null && styles.usageTextSelected
                  ]}>
                    Sin límite
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.usageOption}>
                <TouchableOpacity 
                  style={[
                    styles.usageButton,
                    newPromotion.limiteUsos !== null && styles.usageButtonSelected
                  ]}
                  onPress={() => setNewPromotion({...newPromotion, limiteUsos: '100'})}
                >
                  <Ionicons 
                    name="people" 
                    size={20} 
                    color={newPromotion.limiteUsos !== null ? '#FFFFFF' : '#6B7280'} 
                  />
                  <Text style={[
                    styles.usageText,
                    newPromotion.limiteUsos !== null && styles.usageTextSelected
                  ]}>
                    Con límite
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {newPromotion.limiteUsos !== null && (
              <View style={styles.limitInputContainer}>
                <Text style={styles.limitLabel}>Cantidad máxima de usos</Text>
                <TextInput
                  style={styles.limitInput}
                  value={newPromotion.limiteUsos}
                  onChangeText={(text) => setNewPromotion({...newPromotion, limiteUsos: text})}
                  placeholder="100"
                  keyboardType="numeric"
                />
                <Text style={styles.limitHelpText}>
                  Ejemplo: 100 usos = 100 personas pueden usar esta promoción
                </Text>
              </View>
            )}
          </View>
          </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderEditModal = () => (
    <Modal
      visible={showEditModal}
      animationType="slide"
      onRequestClose={() => setShowEditModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => {
              if (checkForUnsavedChanges()) {
                Alert.alert(
                  'Cambios sin guardar',
                  'Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { 
                      text: 'Cerrar sin guardar', 
                      style: 'destructive',
                      onPress: () => {
                        setEditingPromotion(null);
                        setShowEditModal(false);
                      }
                    }
                  ]
                );
              } else {
                setShowEditModal(false);
              }
            }}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          <Text style={styles.modalTitle}>Editar Promoción</Text>
          <TouchableOpacity 
            style={[styles.modalSaveButton, saving && styles.saveButtonDisabled]} 
            onPress={handleUpdatePromotion}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar</Text>
            )}
          </TouchableOpacity>
          </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Título *</Text>
            <TextInput
              style={styles.input}
              value={editingPromotion?.titulo || ''}
              onChangeText={(text) => setEditingPromotion({...editingPromotion, titulo: text})}
              placeholder="Ej: Descuento de Verano"
            />
            </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Descripción *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editingPromotion?.descripcion || ''}
              onChangeText={(text) => setEditingPromotion({...editingPromotion, descripcion: text})}
              placeholder="Describe tu promoción..."
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Sección de selección de producto */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Producto en Promoción *</Text>
            <Text style={styles.labelSubtext}>Selecciona el producto que estará en descuento</Text>
            
            {editingPromotion?.productoId ? (
              <View style={styles.selectedProductContainer}>
                {(() => {
                  const selectedProduct = products.find(p => p.id === editingPromotion.productoId);
                  const productService = services.find(s => s.id === selectedProduct?.servicioId);
                  return (
                    <View style={styles.selectedProductCard}>
                      <View style={styles.selectedProductImage}>
                        {selectedProduct?.imagen ? (
                          <Image source={{ uri: selectedProduct.imagen }} style={styles.selectedProductImagePreview} />
                        ) : (
                          <Ionicons name="cube" size={24} color="#6B7280" />
                        )}
                      </View>
                      <View style={styles.selectedProductInfo}>
                        <Text style={styles.selectedProductName}>{selectedProduct?.nombre}</Text>
                        <Text style={styles.selectedProductService}>{productService?.nombre || 'Sin servicio'}</Text>
                        {selectedProduct?.precio && (
                          <Text style={styles.selectedProductPrice}>
                            C$ {parseFloat(selectedProduct.precio).toLocaleString('es-NI')}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity 
                        style={styles.changeProductButton}
                        onPress={() => setShowProductSelector(true)}
                      >
                        <Ionicons name="swap-horizontal" size={20} color="#4ADE80" />
                        <Text style={styles.changeProductText}>Cambiar</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })()}
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.selectProductButton}
                onPress={() => setShowProductSelector(true)}
              >
                <Ionicons name="cube" size={32} color="#6B7280" />
                <Text style={styles.selectProductText}>Seleccionar Producto</Text>
                <Text style={styles.selectProductSubtext}>Toca para elegir de tus productos</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Tipo de Promoción *</Text>
            <View style={styles.tipoContainer}>
              {tiposPromocion.map((tipo) => (
                <TouchableOpacity
                  key={tipo.id}
                  style={[
                    styles.tipoOption,
                    editingPromotion?.tipo === tipo.id && styles.tipoOptionSelected
                  ]}
                  onPress={() => setEditingPromotion({...editingPromotion, tipo: tipo.id})}
                >
                  <Ionicons 
                    name={tipo.icon} 
                    size={20} 
                    color={editingPromotion?.tipo === tipo.id ? '#FFFFFF' : tipo.color} 
                  />
                  <Text style={[
                    styles.tipoText,
                    editingPromotion?.tipo === tipo.id && styles.tipoTextSelected
                  ]}>
                    {tipo.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {editingPromotion?.tipo !== 'special' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Descuento {editingPromotion?.tipo === 'percentage' ? '(%)' : '($)'} *
              </Text>
              <TextInput
                style={styles.input}
                value={editingPromotion?.descuento || ''}
                onChangeText={(text) => setEditingPromotion({...editingPromotion, descuento: text})}
                placeholder={editingPromotion?.tipo === 'percentage' ? '30' : '50'}
                keyboardType="numeric"
              />
            </View>
          )}

          {/* Sistema de Fechas */}
          <View style={styles.formGroup}>
            <View style={styles.dateSectionContainer}>
              <View style={styles.dateSectionHeader}>
                <Ionicons name="calendar-outline" size={20} color="#4ADE80" />
                <Text style={styles.dateSectionTitle}>Establecer fechas</Text>
              </View>
              
              <View style={styles.dateContainer}>
                <View style={styles.dateSelector}>
                  <Text style={styles.dateLabel}>Fecha inicio</Text>
                  <TouchableOpacity 
                    style={styles.dateButton}
                    onPress={() => {
                      setShowEditEndDatePicker(false);
                      setShowEditStartDatePicker(true);
                    }}
                  >
                    <Ionicons name="calendar" size={18} color="#4ADE80" />
                    <Text style={styles.dateText}>
                      {formatDate(editingPromotion?.fechaInicio)}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.dateSelector}>
                  <Text style={styles.dateLabel}>Fecha fin</Text>
                  <TouchableOpacity 
                    style={styles.dateButton}
                    onPress={() => {
                      setShowEditStartDatePicker(false);
                      setShowEditEndDatePicker(true);
                    }}
                  >
                    <Ionicons name="calendar" size={18} color="#4ADE80" />
                    <Text style={styles.dateText}>
                      {formatDate(editingPromotion?.fechaFin)}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Sistema de Usos Límites */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Límite de Usos</Text>
            <Text style={styles.labelSubtext}>
              ¿Cuántas veces se puede usar esta promoción? (Opcional)
            </Text>
            
            <View style={styles.usageContainer}>
              <View style={styles.usageOption}>
                <TouchableOpacity 
                  style={[
                    styles.usageButton,
                    editingPromotion?.limiteUsos === null && styles.usageButtonSelected
                  ]}
                  onPress={() => setEditingPromotion({...editingPromotion, limiteUsos: null})}
                >
                  <Ionicons 
                    name="infinite" 
                    size={20} 
                    color={editingPromotion?.limiteUsos === null ? '#FFFFFF' : '#6B7280'} 
                  />
                  <Text style={[
                    styles.usageText,
                    editingPromotion?.limiteUsos === null && styles.usageTextSelected
                  ]}>
                    Sin límite
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.usageOption}>
                <TouchableOpacity 
                  style={[
                    styles.usageButton,
                    editingPromotion?.limiteUsos !== null && styles.usageButtonSelected
                  ]}
                  onPress={() => setEditingPromotion({...editingPromotion, limiteUsos: '100'})}
                >
                  <Ionicons 
                    name="people" 
                    size={20} 
                    color={editingPromotion?.limiteUsos !== null ? '#FFFFFF' : '#6B7280'} 
                  />
                  <Text style={[
                    styles.usageText,
                    editingPromotion?.limiteUsos !== null && styles.usageTextSelected
                  ]}>
                    Con límite
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {editingPromotion?.limiteUsos !== null && (
              <View style={styles.limitInputContainer}>
                <Text style={styles.limitLabel}>Cantidad máxima de usos</Text>
                <TextInput
                  style={styles.limitInput}
                  value={editingPromotion?.limiteUsos || ''}
                  onChangeText={(text) => setEditingPromotion({...editingPromotion, limiteUsos: text})}
                  placeholder="100"
                  keyboardType="numeric"
                />
                <Text style={styles.limitHelpText}>
                  Ejemplo: 100 usos = 100 personas pueden usar esta promoción
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
        
        {/* Loading Overlay */}
        {saving && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4ADE80" />
              <Text style={styles.loadingText}>Actualizando promociones...</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderProductSelectorModal = () => (
    <Modal
      visible={showProductSelector}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Seleccionar Producto</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowProductSelector(false)}
          >
            <Ionicons name="close" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Barra de búsqueda */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar productos..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#9CA3AF"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Ionicons name="close-circle" size={20} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Filtros */}
          <View style={styles.filtersContainer}>
            {/* Categorías */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesScrollView}
              contentContainerStyle={styles.categoriesContent}
            >
              {getProductCategories().map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryFilter,
                    selectedCategory === category.id && styles.activeCategoryFilter
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Ionicons 
                    name={category.icon} 
                    size={16} 
                    color={selectedCategory === category.id ? '#FFFFFF' : '#6B7280'} 
                  />
                  <Text style={[
                    styles.categoryFilterText,
                    selectedCategory === category.id && styles.activeCategoryFilterText
                  ]}>
                    {category.nombre}
                  </Text>
                  <View style={[
                    styles.categoryFilterBadge,
                    selectedCategory === category.id && styles.activeCategoryFilterBadge
                  ]}>
                    <Text style={[
                      styles.categoryFilterBadgeText,
                      selectedCategory === category.id && styles.activeCategoryFilterBadgeText
                    ]}>
                      {category.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Rango de precios */}
            <View style={styles.priceFilterContainer}>
              <Text style={styles.priceFilterLabel}>Precio:</Text>
              <View style={styles.priceInputsContainer}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min"
                  value={priceRange.min}
                  onChangeText={(text) => setPriceRange({...priceRange, min: text})}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={styles.priceSeparator}>-</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max"
                  value={priceRange.max}
                  onChangeText={(text) => setPriceRange({...priceRange, max: text})}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Limpiar filtros */}
            {(searchQuery || selectedCategory !== 'todos' || priceRange.min || priceRange.max) && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearFilters}
              >
                <Ionicons name="refresh" size={16} color="#6B7280" />
                <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Lista de productos filtrados */}
          {getFilteredProducts().length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>
                {products.length === 0 ? 'No hay productos' : 'No se encontraron productos'}
              </Text>
              <Text style={styles.emptyStateText}>
                {products.length === 0 
                  ? 'Primero agrega productos en "Mis Servicios" para crear promociones'
                  : 'Intenta ajustar los filtros de búsqueda'
                }
              </Text>
            </View>
          ) : (
            <View style={styles.productsList}>
              {getFilteredProducts().map(product => {
                const service = services.find(s => s.id === product.servicioId);
                return (
                  <TouchableOpacity
                    key={product.id}
                    style={[
                      styles.productOption,
                      newPromotion.productoId === product.id && styles.selectedProductOption
                    ]}
                    onPress={() => {
                      setNewPromotion({...newPromotion, productoId: product.id});
                      setShowProductSelector(false);
                    }}
                  >
                    <View style={styles.productOptionImage}>
                      {product.imagen ? (
                        <Image source={{ uri: product.imagen }} style={styles.productOptionImagePreview} />
                      ) : (
                        <Ionicons name="cube" size={24} color="#6B7280" />
                      )}
                    </View>
                    <View style={styles.productOptionInfo}>
                      <Text style={styles.productOptionName}>{product.nombre}</Text>
                      <Text style={styles.productOptionService}>{service?.nombre || 'Sin servicio'}</Text>
                      {product.precio && (
                        <Text style={styles.productOptionPrice}>
                          C$ {parseFloat(product.precio).toLocaleString('es-NI')}
                        </Text>
                      )}
                    </View>
                    {newPromotion.productoId === product.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#4ADE80" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
  return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ADE80" />
          <Text style={styles.loadingText}>Cargando promociones...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredPromotions = getFilteredPromotions();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promociones</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {promotions.filter(p => p.activa && new Date(p.fechaFin) > new Date()).length}
          </Text>
          <Text style={styles.statLabel}>Activas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {promotions.reduce((sum, p) => sum + (p.usos || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Usos Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {promotions.filter(p => new Date(p.fechaFin) < new Date()).length}
          </Text>
          <Text style={styles.statLabel}>Expiradas</Text>
        </View>
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
            <Text style={[
              styles.tabText,
              selectedTab === tab.key && styles.selectedTabText
            ]}>
              {tab.title}
            </Text>
            {getPromotionCount(tab.key) > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{getPromotionCount(tab.key)}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Promotions List */}
      {filteredPromotions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="gift" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No hay promociones</Text>
          <Text style={styles.emptySubtitle}>
            {selectedTab === 'active' ? 'Crea tu primera promoción activa' :
             selectedTab === 'draft' ? 'No tienes borradores' :
             'No hay promociones expiradas'}
          </Text>
        </View>
      ) : (
      <FlatList
          data={filteredPromotions}
        renderItem={renderPromotion}
          keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {renderCreateModal()}
      {renderEditModal()}
      {renderProductSelectorModal()}
      
      {/* Date Pickers */}
      {showStartDatePicker && (
        <Modal
          visible={showStartDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowStartDatePicker(false)}
        >
          <View style={styles.modernDatePickerOverlay}>
            <View style={styles.modernDatePickerContainer}>
              <DateTimePicker
                value={newPromotion.fechaInicio ? new Date(newPromotion.fechaInicio) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'compact' : 'default'}
                onChange={(event, selectedDate) => handleDateSelect(event, selectedDate, 'start')}
                minimumDate={new Date()}
                themeVariant="light"
                textColor="#1F2937"
                accentColor="#4ADE80"
                style={styles.modernDateTimePicker}
              />
    </View>
          </View>
        </Modal>
      )}

      {showEndDatePicker && (
        <Modal
          visible={showEndDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowEndDatePicker(false)}
        >
          <View style={styles.modernDatePickerOverlay}>
            <View style={styles.modernDatePickerContainer}>
              <DateTimePicker
                value={newPromotion.fechaFin ? new Date(newPromotion.fechaFin) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'compact' : 'default'}
                onChange={(event, selectedDate) => handleDateSelect(event, selectedDate, 'end')}
                minimumDate={newPromotion.fechaInicio ? new Date(newPromotion.fechaInicio) : new Date()}
                themeVariant="light"
                textColor="#1F2937"
                accentColor="#4ADE80"
                style={styles.modernDateTimePicker}
              />
            </View>
          </View>
        </Modal>
      )}

      {showEditStartDatePicker && (
        <Modal
          visible={showEditStartDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowEditStartDatePicker(false)}
        >
          <View style={styles.modernDatePickerOverlay}>
            <View style={styles.modernDatePickerContainer}>
              <DateTimePicker
                value={editingPromotion?.fechaInicio ? new Date(editingPromotion.fechaInicio) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'compact' : 'default'}
                onChange={(event, selectedDate) => handleEditDateSelect(event, selectedDate, 'start')}
                minimumDate={new Date()}
                themeVariant="light"
                textColor="#1F2937"
                accentColor="#4ADE80"
                style={styles.modernDateTimePicker}
              />
            </View>
          </View>
        </Modal>
      )}

      {showEditEndDatePicker && (
        <Modal
          visible={showEditEndDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowEditEndDatePicker(false)}
        >
          <View style={styles.modernDatePickerOverlay}>
            <View style={styles.modernDatePickerContainer}>
              <DateTimePicker
                value={editingPromotion?.fechaFin ? new Date(editingPromotion.fechaFin) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'compact' : 'default'}
                onChange={(event, selectedDate) => handleEditDateSelect(event, selectedDate, 'end')}
                minimumDate={editingPromotion?.fechaInicio ? new Date(editingPromotion.fechaInicio) : new Date()}
                themeVariant="light"
                textColor="#1F2937"
                accentColor="#4ADE80"
                style={styles.modernDateTimePicker}
              />
            </View>
          </View>
        </Modal>
      )}

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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  // Product selector styles
  selectedProductContainer: {
    marginTop: 8,
  },
  selectedProductCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedProductImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedProductImagePreview: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  selectedProductInfo: {
    flex: 1,
  },
  selectedProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  selectedProductService: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  selectedProductPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  changeProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  changeProductText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#059669',
    marginLeft: 4,
  },
  selectProductButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  selectProductText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  selectProductSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  // Product selector modal styles
  productsList: {
    padding: 16,
  },
  productOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedProductOption: {
    borderColor: '#4ADE80',
    backgroundColor: '#F0FDF4',
  },
  productOptionImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  productOptionImagePreview: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  productOptionInfo: {
    flex: 1,
  },
  productOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  productOptionService: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  productOptionPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  // Search and filter styles
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  clearSearchButton: {
    padding: 4,
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoriesScrollView: {
    marginBottom: 12,
  },
  categoriesContent: {
    paddingRight: 16,
  },
  categoryFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  activeCategoryFilter: {
    backgroundColor: '#4ADE80',
    borderColor: '#4ADE80',
  },
  categoryFilterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 4,
    marginRight: 6,
  },
  activeCategoryFilterText: {
    color: '#FFFFFF',
  },
  categoryFilterBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 16,
    alignItems: 'center',
  },
  activeCategoryFilterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryFilterBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeCategoryFilterBadgeText: {
    color: '#FFFFFF',
  },
  priceFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceFilterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginRight: 12,
  },
  priceInputsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlign: 'center',
  },
  priceSeparator: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginHorizontal: 8,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 4,
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
    marginLeft: 12,
    flex: 1,
  },
  headerRight: {
    width: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 85,
    height: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
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
  },
  selectedTabText: {
    color: '#4ADE80',
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#4ADE80',
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  promotionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  promotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  promotionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  promotionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  promotionDetails: {
    flex: 1,
  },
  promotionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  promotionType: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  moreButton: {
    padding: 8,
  },
  promotionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  promotionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    marginBottom: 4,
  },
  progress: {
    height: 6,
    backgroundColor: '#4ADE80',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
  promotionActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    backgroundColor: '#4ADE80',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
  },
  modalSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#4ADE80',
    marginLeft: 'auto',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#4ADE80',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  tipoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tipoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    minWidth: '45%',
  },
  tipoOptionSelected: {
    backgroundColor: '#4ADE80',
    borderColor: '#4ADE80',
  },
  tipoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  },
  tipoTextSelected: {
    color: '#FFFFFF',
  },
  // Estilos para el sistema de fechas
  labelSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
    marginTop: -4,
  },
  dateSectionContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 12,
  },
  dateContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  dateSelector: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  // Estilos para el sistema de usos límites
  usageContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  usageOption: {
    flex: 1,
  },
  usageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  usageButtonSelected: {
    backgroundColor: '#4ADE80',
    borderColor: '#4ADE80',
  },
  usageText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  },
  usageTextSelected: {
    color: '#FFFFFF',
  },
  limitInputContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  limitLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  limitInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  limitHelpText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  // Estilos para los date pickers
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  datePickerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  datePickerButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  datePickerButtonPrimary: {
    backgroundColor: '#4ADE80',
    borderColor: '#4ADE80',
  },
  datePickerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  datePickerButtonTextPrimary: {
    color: '#FFFFFF',
  },
  // Estilos para el date picker moderno
  modernDatePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  modernDatePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 0,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 2,
  },
  modernDatePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modernDatePickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modernDatePickerClose: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  modernDateTimePicker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    zIndex: 3,
  },
  // Estilos para imágenes
  imageContainer: {
    position: 'relative',
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  changeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  changeImageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4ADE80',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 20,
  },
  addImageButton: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    marginTop: 8,
  },
  addImageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
  },
  addImageSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  promotionImageContainer: {
    width: '100%',
    height: 160,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  promotionImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  promotionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PromotionsScreen;