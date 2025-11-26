import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  orderBy 
} from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig';
import { colors } from '../../config/colors';


const MisServiciosScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('servicios'); // 'servicios' o 'productos'
  const [activeProductCategory, setActiveProductCategory] = useState('todos'); // 'todos', 'restaurante', 'hotel', 'tour', etc.
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showAddServiceTypeModal, setShowAddServiceTypeModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newServiceType, setNewServiceType] = useState({
    nombre: '',
    icon: 'business',
  });
  const [newService, setNewService] = useState({
    tipo: 'restaurante',
    descripcion: '',
    activo: true,
  });
  const [newProduct, setNewProduct] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    servicioId: '',
    imagen: null,
    disponible: true,
  });

  const tiposServicio = [
    { id: 'restaurante', nombre: 'Restaurante', icon: 'restaurant' },
    { id: 'hotel', nombre: 'Hotel', icon: 'bed' },
    { id: 'actividad', nombre: 'Actividad', icon: 'bicycle' },
    { id: 'tour', nombre: 'Tour', icon: 'map' },
    { id: 'spa', nombre: 'Spa', icon: 'leaf' },
    { id: 'evento', nombre: 'Evento', icon: 'calendar' },
  ];

  useEffect(() => {
    loadServices();
    loadProducts();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const servicesRef = collection(db, 'servicios');
      // Consulta simplificada sin orderBy para evitar el índice
      const q = query(
        servicesRef, 
        where('centroId', '==', authUser?.uid)
      );
      const querySnapshot = await getDocs(q);
      
      const servicesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Ordenar localmente por fecha de creación
      servicesData.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
      
      setServices(servicesData);
    } catch (error) {
      console.error('Error cargando servicios:', error);
      Alert.alert('Error', 'No se pudieron cargar los servicios');
    } finally {
      setLoading(false);
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
      
      // Ordenar localmente por fecha de creación
      productsData.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
      
      setProducts(productsData);
    } catch (error) {
      console.error('Error cargando productos:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos');
    }
  };

  const getFilteredProducts = () => {
    if (activeProductCategory === 'todos') {
      return products;
    }
    
    return products.filter(product => {
      const service = services.find(s => s.id === product.servicioId);
      return service && service.tipo === activeProductCategory;
    });
  };

  const getProductCategories = () => {
    const categories = [{ id: 'todos', nombre: 'Todos', icon: 'grid', count: products.length }];
    
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

  const handleAddService = async () => {
    if (!newService.tipo) {
      Alert.alert('Error', 'Debe seleccionar un tipo de servicio');
      return;
    }

    setSaving(true);
    try {
      const tipoInfo = tiposServicio.find(t => t.id === newService.tipo);
      const serviceData = {
        ...newService,
        nombre: tipoInfo?.nombre || newService.tipo, // Usar el nombre del tipo
        centroId: authUser?.uid,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
      };

      await addDoc(collection(db, 'servicios'), serviceData);
      
      Alert.alert('Éxito', 'Servicio agregado correctamente');
      setShowAddModal(false);
      setNewService({
        tipo: 'restaurante',
        descripcion: '',
        activo: true,
      });
      loadServices();
    } catch (error) {
      console.error('Error agregando servicio:', error);
      Alert.alert('Error', 'No se pudo agregar el servicio');
    } finally {
      setSaving(false);
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setShowEditModal(true);
  };

  const handleUpdateService = async () => {
    if (!editingService.tipo) {
      Alert.alert('Error', 'Debe seleccionar un tipo de servicio');
      return;
    }

    setSaving(true);
    try {
      const tipoInfo = tiposServicio.find(t => t.id === editingService.tipo);
      const serviceRef = doc(db, 'servicios', editingService.id);
      await updateDoc(serviceRef, {
        nombre: tipoInfo?.nombre || editingService.tipo, // Usar el nombre del tipo
        tipo: editingService.tipo,
        descripcion: editingService.descripcion,
        activo: editingService.activo,
        fechaActualizacion: new Date().toISOString(),
      });
      
      Alert.alert('Éxito', 'Servicio actualizado correctamente');
      setShowEditModal(false);
      setEditingService(null);
      loadServices();
    } catch (error) {
      console.error('Error actualizando servicio:', error);
      Alert.alert('Error', 'No se pudo actualizar el servicio');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar este servicio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'servicios', serviceId));
              Alert.alert('Éxito', 'Servicio eliminado correctamente');
              loadServices();
            } catch (error) {
              console.error('Error eliminando servicio:', error);
              Alert.alert('Error', 'No se pudo eliminar el servicio');
            }
          }
        }
      ]
    );
  };

  const toggleServiceStatus = async (service) => {
    try {
      const serviceRef = doc(db, 'servicios', service.id);
      await updateDoc(serviceRef, {
        activo: !service.activo,
        fechaActualizacion: new Date().toISOString(),
      });
      loadServices();
    } catch (error) {
      console.error('Error cambiando estado del servicio:', error);
      Alert.alert('Error', 'No se pudo cambiar el estado del servicio');
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.nombre.trim()) {
      Alert.alert('Error', 'El nombre del producto es requerido');
      return;
    }
    if (!newProduct.servicioId) {
      Alert.alert('Error', 'Debe seleccionar un servicio');
      return;
    }

    setSaving(true);
    try {
      const productData = {
        ...newProduct,
        centroId: authUser?.uid,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
      };

      await addDoc(collection(db, 'productos'), productData);
      
      Alert.alert('Éxito', 'Producto agregado correctamente');
      setShowAddProductModal(false);
      setNewProduct({
        nombre: '',
        descripcion: '',
        precio: '',
        servicioId: '',
        imagen: null,
        disponible: true,
      });
      loadProducts();
    } catch (error) {
      console.error('Error agregando producto:', error);
      Alert.alert('Error', 'No se pudo agregar el producto');
    } finally {
      setSaving(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowEditProductModal(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct.nombre.trim()) {
      Alert.alert('Error', 'El nombre del producto es requerido');
      return;
    }

    setSaving(true);
    try {
      const productRef = doc(db, 'productos', editingProduct.id);
      await updateDoc(productRef, {
        nombre: editingProduct.nombre,
        descripcion: editingProduct.descripcion,
        precio: editingProduct.precio,
        servicioId: editingProduct.servicioId,
        imagen: editingProduct.imagen,
        disponible: editingProduct.disponible,
        fechaActualizacion: new Date().toISOString(),
      });
      
      Alert.alert('Éxito', 'Producto actualizado correctamente');
      setShowEditProductModal(false);
      setEditingProduct(null);
      loadProducts();
    } catch (error) {
      console.error('Error actualizando producto:', error);
      Alert.alert('Error', 'No se pudo actualizar el producto');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar este producto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'productos', productId));
              Alert.alert('Éxito', 'Producto eliminado correctamente');
              loadProducts();
            } catch (error) {
              console.error('Error eliminando producto:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          }
        }
      ]
    );
  };

  const toggleProductStatus = async (product) => {
    try {
      const productRef = doc(db, 'productos', product.id);
      await updateDoc(productRef, {
        disponible: !product.disponible,
        fechaActualizacion: new Date().toISOString(),
      });
      loadProducts();
    } catch (error) {
      console.error('Error cambiando disponibilidad del producto:', error);
      Alert.alert('Error', 'No se pudo cambiar la disponibilidad del producto');
    }
  };

  const handleAddServiceType = async () => {
    if (!newServiceType.nombre.trim()) {
      Alert.alert('Error', 'El nombre del tipo de servicio es requerido');
      return;
    }

    setSaving(true);
    try {
      // Agregar el nuevo tipo a la lista local
      const newType = {
        id: `custom_${Date.now()}`,
        nombre: newServiceType.nombre.trim(),
        icon: newServiceType.icon,
      };
      
      // Aquí podrías guardar en Firebase si quieres persistir los tipos personalizados
      // Por ahora solo lo agregamos localmente
      tiposServicio.push(newType);
      
      Alert.alert('Éxito', 'Tipo de servicio agregado correctamente');
      setShowAddServiceTypeModal(false);
      setNewServiceType({
        nombre: '',
        icon: 'business',
      });
    } catch (error) {
      console.error('Error agregando tipo de servicio:', error);
      Alert.alert('Error', 'No se pudo agregar el tipo de servicio');
    } finally {
      setSaving(false);
    }
  };

  const renderServiceCard = (service) => {
    const tipoInfo = tiposServicio.find(t => t.id === service.tipo);
    const productCount = products.filter(p => p.servicioId === service.id).length;
    
    return (
      <View key={service.id} style={styles.serviceCard}>
        {/* Header con icono y estado */}
        <View style={styles.serviceCardHeader}>
          <View style={styles.serviceIconContainer}>
            <Ionicons 
              name={tipoInfo?.icon || 'business'} 
              size={24} 
              color={colors.text.primary} 
            />
          </View>
          <View style={styles.serviceStatusContainer}>
            <TouchableOpacity
              style={styles.statusIndicator}
              onPress={() => toggleServiceStatus(service)}
            >
              <Ionicons 
                name={service.activo ? "toggle" : "toggle-outline"} 
                size={20} 
                color={service.activo ? colors.success : colors.error} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contenido principal */}
        <View style={styles.serviceCardContent}>
          <Text style={styles.serviceName}>{service.nombre}</Text>
          <Text style={styles.serviceType}>{tipoInfo?.nombre || service.tipo}</Text>
          
          {service.descripcion && (
            <Text style={styles.serviceDescription} numberOfLines={2}>
              {service.descripcion}
            </Text>
          )}

          {/* Stats del servicio */}
          <View style={styles.serviceStats}>
            <View style={styles.serviceStatItem}>
              <Ionicons name="cube" size={14} color={colors.text.muted} />
              <Text style={styles.serviceStatText}>{productCount} productos</Text>
            </View>
            <View style={styles.serviceStatItem}>
              <Ionicons name="time" size={14} color={colors.text.muted} />
              <Text style={styles.serviceStatText}>
                {new Date(service.fechaCreacion).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.serviceCardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditService(service)}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.actionButtonText}>Editar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteService(service.id)}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderProductCard = (product) => {
    const service = services.find(s => s.id === product.servicioId);
    const tipoInfo = tiposServicio.find(t => t.id === service?.tipo);
    
    return (
      <View key={product.id} style={styles.serviceCard}>
        {/* Header con icono y estado */}
        <View style={styles.serviceCardHeader}>
          <View style={styles.serviceIconContainer}>
            {product.imagen ? (
              <Image 
                source={{ uri: product.imagen }} 
                style={styles.productImage}
              />
            ) : (
              <Ionicons
                name="cube"
                size={24}
                color={colors.text.primary}
              />
            )}
          </View>
          <View style={styles.serviceStatusContainer}>
            <TouchableOpacity
              style={styles.statusIndicator}
              onPress={() => toggleProductStatus(product)}
            >
              <Ionicons 
                name={product.disponible ? "toggle" : "toggle-outline"} 
                size={20} 
                color={product.disponible ? colors.success : colors.error} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contenido principal */}
        <View style={styles.serviceCardContent}>
          <Text style={styles.serviceName}>{product.nombre}</Text>
          <Text style={styles.serviceType}>
            {tipoInfo?.nombre || service?.nombre || 'Sin servicio'}
          </Text>
          
          {product.descripcion && (
            <Text style={styles.serviceDescription} numberOfLines={2}>
              {product.descripcion}
            </Text>
          )}

          {/* Precio destacado */}
          {product.precio && (
            <View style={styles.productPriceContainer}>
              <Text style={styles.productPriceLabel}>Precio:</Text>
              <Text style={styles.productPrice}>
                C$ {parseFloat(product.precio).toLocaleString('es-NI')}
              </Text>
            </View>
          )}

          {/* Stats del producto */}
          <View style={styles.serviceStats}>
            <View style={styles.serviceStatItem}>
              <Ionicons name="calendar" size={14} color={colors.text.muted} />
              <Text style={styles.serviceStatText}>
                {new Date(product.fechaCreacion).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.serviceStatItem}>
              <Ionicons 
                name={product.disponible ? "checkmark-circle" : "close-circle"} 
                size={14} 
                color={product.disponible ? colors.success : colors.error} 
              />
              <Text style={[
                styles.serviceStatText,
                { color: product.disponible ? colors.success : colors.error }
              ]}>
                {product.disponible ? 'Disponible' : 'No disponible'}
              </Text>
            </View>
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.serviceCardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditProduct(product)}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.actionButtonText}>Editar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteProduct(product.id)}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Agregar Servicio</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowAddModal(false)}
          >
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tipo de Servicio *</Text>
            <View style={styles.tipoContainer}>
              {tiposServicio.map((tipo) => (
                <TouchableOpacity
                  key={tipo.id}
                  style={[
                    styles.tipoButton,
                    newService.tipo === tipo.id && styles.tipoButtonSelected
                  ]}
                  onPress={() => setNewService({...newService, tipo: tipo.id})}
                >
                  <Ionicons 
                    name={tipo.icon} 
                    size={20} 
                    color={newService.tipo === tipo.id ? colors.text.primary : colors.primary} 
                  />
                  <Text style={[
                    styles.tipoButtonText,
                    newService.tipo === tipo.id && styles.tipoButtonTextSelected
                  ]}>
                    {tipo.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.addNewServiceButton}
              onPress={() => setShowAddServiceTypeModal(true)}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={styles.addNewServiceText}>Agregar nuevo servicio</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newService.descripcion}
              onChangeText={(text) => setNewService({...newService, descripcion: text})}
              placeholder="Describe tu servicio..."
              placeholderTextColor={colors.text.muted}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>
        
        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowAddModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleAddService}
          >
            <Text style={styles.saveButtonText}>Agregar Servicio</Text>
          </TouchableOpacity>
        </View>
        
        {/* Loading Overlay */}
        {saving && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.success} />
              <Text style={styles.loadingText}>Actualizando servicios...</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderEditModal = () => (
    <Modal
      visible={showEditModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Editar Servicio</Text>
          <TouchableOpacity onPress={() => setShowEditModal(false)}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tipo de Servicio *</Text>
            <View style={styles.tipoContainer}>
              {tiposServicio.map((tipo) => (
                <TouchableOpacity
                  key={tipo.id}
                  style={[
                    styles.tipoButton,
                    editingService?.tipo === tipo.id && styles.tipoButtonSelected
                  ]}
                  onPress={() => setEditingService({...editingService, tipo: tipo.id})}
                >
                  <Ionicons 
                    name={tipo.icon} 
                    size={20} 
                    color={editingService?.tipo === tipo.id ? colors.text.primary : colors.primary} 
                  />
                  <Text style={[
                    styles.tipoButtonText,
                    editingService?.tipo === tipo.id && styles.tipoButtonTextSelected
                  ]}>
                    {tipo.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.addNewServiceButton}
              onPress={() => setShowAddServiceTypeModal(true)}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={styles.addNewServiceText}>Agregar nuevo servicio</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editingService?.descripcion || ''}
              onChangeText={(text) => setEditingService({...editingService, descripcion: text})}
              placeholder="Describe tu servicio..."
              placeholderTextColor={colors.text.muted}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>
        
        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowEditModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleUpdateService}
          >
            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
          </TouchableOpacity>
        </View>
        
        {/* Loading Overlay */}
        {saving && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.success} />
              <Text style={styles.loadingText}>Actualizando servicios...</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderAddProductModal = () => (
    <Modal
      visible={showAddProductModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowAddProductModal(false)}
          >
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Agregar Producto</Text>
          <TouchableOpacity
            style={styles.modalSaveButton}
            onPress={handleAddProduct}
          >
            <Text style={styles.saveButtonText}>Guardar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Imagen del producto (Opcional)</Text>
            <TouchableOpacity
              style={styles.imagePicker}
              onPress={() => {
                if (newProduct.imagen || editingProduct?.imagen) {
                  // Si ya tiene imagen, mostrar opciones
                  Alert.alert(
                    'Imagen del Producto',
                    '¿Qué deseas hacer?',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Cambiar Imagen', onPress: () => {
                        // TODO: Implementar selección de imagen
                        Alert.alert('Próximamente', 'La selección de imagen estará disponible pronto');
                      }},
                      { text: 'Mejorar con IA', onPress: () => {
                        Alert.alert(
                          '✨ Funcionalidad Premium',
                          'Mejora tu imagen con IA:\n\n• 🎨 Mejora automática de fondo\n• 🖼️ Fondo contextual inteligente\n• ✂️ Eliminación de fondo\n• 🎭 Filtros profesionales',
                          [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Mejorar con IA', style: 'default' }
                          ]
                        );
                      }}
                    ]
                  );
                } else {
                  // TODO: Implementar selección de imagen
                  Alert.alert('Próximamente', 'La selección de imagen estará disponible pronto');
                }
              }}
            >
              {newProduct.imagen ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: newProduct.imagen }} style={styles.previewImage} />
                  <View style={styles.imageOverlay}>
                    <TouchableOpacity
                      style={styles.premiumButton}
                      onPress={() => {
                        Alert.alert(
                          '✨ Funcionalidad Premium',
                          'Mejora tu imagen con IA:\n\n• 🎨 Mejora automática de fondo\n• 🖼️ Fondo contextual inteligente\n• ✂️ Eliminación de fondo\n• 🎭 Filtros profesionales',
                          [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Mejorar con IA', style: 'default' }
                          ]
                        );
                      }}
                    >
                      <Ionicons name="sparkles" size={16} color={colors.text.primary} />
                      <Text style={styles.premiumButtonText}>Mejorar con IA</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera" size={32} color={colors.text.muted} />
                  <Text style={styles.imagePlaceholderText}>Toca para agregar imagen</Text>
                  <Text style={styles.imagePlaceholderSubtext}>✨ Mejora con IA disponible</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre del producto *</Text>
            <TextInput
              style={styles.input}
              value={newProduct.nombre}
              onChangeText={(text) => setNewProduct({...newProduct, nombre: text})}
              placeholder="Nombre del producto"
              placeholderTextColor={colors.text.muted}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Tipo de servicio *</Text>
            <View style={styles.serviceSelector}>
              {services.map(service => {
                const tipoInfo = tiposServicio.find(t => t.id === service.tipo);
                return (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.serviceOption,
                      newProduct.servicioId === service.id && styles.selectedServiceOption
                    ]}
                    onPress={() => setNewProduct({...newProduct, servicioId: service.id})}
                  >
                    <Text style={[
                      styles.serviceOptionText,
                      newProduct.servicioId === service.id && styles.selectedServiceOptionText
                    ]}>
                      {tipoInfo?.nombre || service.nombre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newProduct.descripcion}
              onChangeText={(text) => setNewProduct({...newProduct, descripcion: text})}
              placeholder="Describe el producto..."
              placeholderTextColor={colors.text.muted}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Precio Unitario (Córdobas)</Text>
            <Text style={styles.priceSubtext}>Precio por unidad, plato, persona, etc.</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencySymbol}>C$</Text>
              <TextInput
                style={styles.priceInput}
                value={newProduct.precio}
                onChangeText={(text) => setNewProduct({...newProduct, precio: text})}
                placeholder="250"
                placeholderTextColor={colors.text.muted}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Disponibilidad</Text>
            <View style={styles.availabilitySelector}>
              <TouchableOpacity
                style={[
                  styles.availabilityOption,
                  newProduct.disponible && styles.selectedAvailabilityOption
                ]}
                onPress={() => setNewProduct({...newProduct, disponible: true})}
              >
                <Ionicons 
                  name="checkmark-circle" 
                  size={20} 
                  color={newProduct.disponible ? colors.text.primary : colors.success} 
                />
                <Text style={[
                  styles.availabilityText,
                  newProduct.disponible && styles.selectedAvailabilityText
                ]}>
                  Disponible
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.availabilityOption,
                  !newProduct.disponible && styles.selectedAvailabilityOption
                ]}
                onPress={() => setNewProduct({...newProduct, disponible: false})}
              >
                <Ionicons 
                  name="close-circle" 
                  size={20} 
                  color={!newProduct.disponible ? colors.text.primary : colors.error} 
                />
                <Text style={[
                  styles.availabilityText,
                  !newProduct.disponible && styles.selectedAvailabilityText
                ]}>
                  No Disponible
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Loading Overlay */}
        {saving && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.success} />
              <Text style={styles.loadingText}>Actualizando productos...</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderEditProductModal = () => (
    <Modal
      visible={showEditProductModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowEditProductModal(false)}
          >
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Editar Producto</Text>
          <TouchableOpacity
            style={styles.modalSaveButton}
            onPress={handleUpdateProduct}
          >
            <Text style={styles.saveButtonText}>Guardar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Imagen del producto (Opcional)</Text>
            <TouchableOpacity
              style={styles.imagePicker}
              onPress={() => {
                if (newProduct.imagen || editingProduct?.imagen) {
                  // Si ya tiene imagen, mostrar opciones
                  Alert.alert(
                    'Imagen del Producto',
                    '¿Qué deseas hacer?',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Cambiar Imagen', onPress: () => {
                        // TODO: Implementar selección de imagen
                        Alert.alert('Próximamente', 'La selección de imagen estará disponible pronto');
                      }},
                      { text: 'Mejorar con IA', onPress: () => {
                        Alert.alert(
                          '✨ Funcionalidad Premium',
                          'Mejora tu imagen con IA:\n\n• 🎨 Mejora automática de fondo\n• 🖼️ Fondo contextual inteligente\n• ✂️ Eliminación de fondo\n• 🎭 Filtros profesionales',
                          [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Mejorar con IA', style: 'default' }
                          ]
                        );
                      }}
                    ]
                  );
                } else {
                  // TODO: Implementar selección de imagen
                  Alert.alert('Próximamente', 'La selección de imagen estará disponible pronto');
                }
              }}
            >
              {editingProduct?.imagen ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: editingProduct.imagen }} style={styles.previewImage} />
                  <View style={styles.imageOverlay}>
                    <TouchableOpacity
                      style={styles.premiumButton}
                      onPress={() => {
                        Alert.alert(
                          '✨ Funcionalidad Premium',
                          'Mejora tu imagen con IA:\n\n• 🎨 Mejora automática de fondo\n• 🖼️ Fondo contextual inteligente\n• ✂️ Eliminación de fondo\n• 🎭 Filtros profesionales',
                          [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Mejorar con IA', style: 'default' }
                          ]
                        );
                      }}
                    >
                      <Ionicons name="sparkles" size={16} color={colors.text.primary} />
                      <Text style={styles.premiumButtonText}>Mejorar con IA</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera" size={32} color={colors.text.muted} />
                  <Text style={styles.imagePlaceholderText}>Toca para agregar imagen</Text>
                  <Text style={styles.imagePlaceholderSubtext}>✨ Mejora con IA disponible</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre del producto *</Text>
            <TextInput
              style={styles.input}
              value={editingProduct?.nombre || ''}
              onChangeText={(text) => setEditingProduct({...editingProduct, nombre: text})}
              placeholder="Nombre del producto"
              placeholderTextColor={colors.text.muted}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Tipo de servicio *</Text>
            <View style={styles.serviceSelector}>
              {services.map(service => {
                const tipoInfo = tiposServicio.find(t => t.id === service.tipo);
                return (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.serviceOption,
                      editingProduct?.servicioId === service.id && styles.selectedServiceOption
                    ]}
                    onPress={() => setEditingProduct({...editingProduct, servicioId: service.id})}
                  >
                    <Text style={[
                      styles.serviceOptionText,
                      editingProduct?.servicioId === service.id && styles.selectedServiceOptionText
                    ]}>
                      {tipoInfo?.nombre || service.nombre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editingProduct?.descripcion || ''}
              onChangeText={(text) => setEditingProduct({...editingProduct, descripcion: text})}
              placeholder="Describe el producto..."
              placeholderTextColor={colors.text.muted}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Precio Unitario (Córdobas)</Text>
            <Text style={styles.priceSubtext}>Precio por unidad, plato, persona, etc.</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencySymbol}>C$</Text>
              <TextInput
                style={styles.priceInput}
                value={editingProduct?.precio || ''}
                onChangeText={(text) => setEditingProduct({...editingProduct, precio: text})}
                placeholder="250"
                placeholderTextColor={colors.text.muted}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Disponibilidad</Text>
            <View style={styles.availabilitySelector}>
              <TouchableOpacity
                style={[
                  styles.availabilityOption,
                  editingProduct?.disponible && styles.selectedAvailabilityOption
                ]}
                onPress={() => setEditingProduct({...editingProduct, disponible: true})}
              >
                <Ionicons 
                  name="checkmark-circle" 
                  size={20} 
                  color={editingProduct?.disponible ? '#FFFFFF' : '#10B981'} 
                />
                <Text style={[
                  styles.availabilityText,
                  editingProduct?.disponible && styles.selectedAvailabilityText
                ]}>
                  Disponible
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.availabilityOption,
                  !editingProduct?.disponible && styles.selectedAvailabilityOption
                ]}
                onPress={() => setEditingProduct({...editingProduct, disponible: false})}
              >
                <Ionicons 
                  name="close-circle" 
                  size={20} 
                  color={!editingProduct?.disponible ? '#FFFFFF' : '#EF4444'} 
                />
                <Text style={[
                  styles.availabilityText,
                  !editingProduct?.disponible && styles.selectedAvailabilityText
                ]}>
                  No Disponible
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Loading Overlay */}
        {saving && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.success} />
              <Text style={styles.loadingText}>Actualizando productos...</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderAddServiceTypeModal = () => (
    <Modal
      visible={showAddServiceTypeModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Agregar Tipo de Servicio</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowAddServiceTypeModal(false)}
          >
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre del tipo *</Text>
            <TextInput
              style={styles.input}
              value={newServiceType.nombre}
              onChangeText={(text) => setNewServiceType({...newServiceType, nombre: text})}
              placeholder="Ej: Bar, Spa, Tour"
              placeholderTextColor={colors.text.muted}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Icono</Text>
            <View style={styles.iconSelector}>
              {['business', 'restaurant', 'bed', 'bicycle', 'leaf', 'calendar', 'wine', 'car', 'airplane', 'cafe'].map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    newServiceType.icon === icon && styles.selectedIconOption
                  ]}
                  onPress={() => setNewServiceType({...newServiceType, icon: icon})}
                >
                  <Ionicons 
                    name={icon} 
                    size={24} 
                    color={newServiceType.icon === icon ? colors.text.primary : colors.text.muted} 
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowAddServiceTypeModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleAddServiceType}
          >
            <Text style={styles.saveButtonText}>Agregar</Text>
          </TouchableOpacity>
        </View>

        {/* Loading Overlay */}
        {saving && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.success} />
              <Text style={styles.loadingText}>Agregando tipo de servicio...</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando servicios...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header con gradiente */}
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Mis Servicios</Text>
            <Text style={styles.headerSubtitle}>Gestiona tus servicios y productos</Text>
          </View>
        </View>
        
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="business" size={16} color={colors.text.primary} />
            <Text style={styles.statNumber}>{services.length}</Text>
            <Text style={styles.statLabel}>Servicios</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cube" size={16} color={colors.text.primary} />
            <Text style={styles.statNumber}>{products.length}</Text>
            <Text style={styles.statLabel}>Productos</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={16} color={colors.text.primary} />
            <Text style={styles.statNumber}>
              {services.filter(s => s.activo).length + products.filter(p => p.disponible).length}
            </Text>
            <Text style={styles.statLabel}>Activos</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'servicios' && styles.activeTab]}
          onPress={() => setActiveTab('servicios')}
        >
          <Ionicons 
            name="business" 
            size={20} 
            color={activeTab === 'servicios' ? colors.text.primary : colors.text.muted} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === 'servicios' && styles.activeTabText
          ]}>
            Servicios
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'productos' && styles.activeTab]}
          onPress={() => setActiveTab('productos')}
        >
          <Ionicons 
            name="cube" 
            size={20} 
            color={activeTab === 'productos' ? colors.text.primary : colors.text.muted} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === 'productos' && styles.activeTabText
          ]}>
            Productos
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'servicios' ? (
          services.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="business" size={64} color={colors.text.muted} />
              <Text style={styles.emptyTitle}>No tienes servicios</Text>
              <Text style={styles.emptySubtitle}>
                Agrega tu primer servicio para comenzar a gestionar tu centro
              </Text>
              <TouchableOpacity
                style={styles.addFirstButton}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={styles.addFirstButtonText}>Agregar Primer Servicio</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.servicesList}>
                {services.map(renderServiceCard)}
              </View>
              <TouchableOpacity
                style={styles.addServiceButton}
                onPress={() => setShowAddModal(true)}
              >
                <View style={styles.addServiceButtonContent}>
                  <View style={styles.addServiceIconContainer}>
                    <Ionicons name="add" size={24} color={colors.text.primary} />
                  </View>
                  <View style={styles.addServiceTextContainer}>
                    <Text style={styles.addServiceButtonText}>Agregar Servicio</Text>
                    <Text style={styles.addServiceButtonSubtext}>Crear nuevo servicio</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={20} color={colors.text.primary} />
                </View>
              </TouchableOpacity>
            </>
          )
        ) : (
          <>
            {/* Categorías de Productos */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
              contentContainerStyle={styles.categoriesContent}
            >
              {getProductCategories().map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryTab,
                    activeProductCategory === category.id && styles.activeCategoryTab
                  ]}
                  onPress={() => setActiveProductCategory(category.id)}
                >
                  <Ionicons 
                    name={category.icon} 
                    size={20} 
                    color={activeProductCategory === category.id ? colors.text.primary : colors.text.muted} 
                  />
                  <Text style={[
                    styles.categoryTabText,
                    activeProductCategory === category.id && styles.activeCategoryTabText
                  ]}>
                    {category.nombre}
                  </Text>
                  <View style={[
                    styles.categoryBadge,
                    activeProductCategory === category.id && styles.activeCategoryBadge
                  ]}>
                    <Text style={[
                      styles.categoryBadgeText,
                      activeProductCategory === category.id && styles.activeCategoryBadgeText
                    ]}>
                      {category.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Lista de Productos Filtrados */}
            {getFilteredProducts().length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cube" size={64} color={colors.text.muted} />
                <Text style={styles.emptyTitle}>
                  {activeProductCategory === 'todos' ? 'No tienes productos' : `No hay productos de ${getProductCategories().find(c => c.id === activeProductCategory)?.nombre}`}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {activeProductCategory === 'todos' 
                    ? 'Agrega productos a tus servicios para crear promociones'
                    : `Agrega productos para ${getProductCategories().find(c => c.id === activeProductCategory)?.nombre}`
                  }
                </Text>
                <TouchableOpacity
                  style={styles.addFirstButton}
                  onPress={() => setShowAddProductModal(true)}
                >
                  <Text style={styles.addFirstButtonText}>
                    {activeProductCategory === 'todos' ? 'Agregar Primer Producto' : 'Agregar Producto'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.productsList}>
                  {getFilteredProducts().map(renderProductCard)}
                </View>
                <TouchableOpacity
                  style={styles.addProductButton}
                  onPress={() => setShowAddProductModal(true)}
                >
                  <View style={styles.addProductButtonContent}>
                    <View style={styles.addProductIconContainer}>
                      <Ionicons name="add" size={20} color={colors.text.primary} />
                    </View>
                    <View style={styles.addProductTextContainer}>
                      <Text style={styles.addProductButtonText}>Agregar Producto</Text>
                      <Text style={styles.addProductButtonSubtext}>Crear nuevo producto</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={18} color={colors.text.primary} />
                  </View>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </ScrollView>

      {renderAddModal()}
      {renderEditModal()}
      {renderAddProductModal()}
      {renderEditProductModal()}
      {renderAddServiceTypeModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Header con gradiente
  headerGradient: {
    backgroundColor: colors.background,
    paddingTop: 4,
    paddingBottom: 12,
    paddingHorizontal: 0,
  },
  headerContent: {
    flex: 1,
    alignItems: 'flex-start',
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.text.primary,
    opacity: 0.8,
    marginTop: 2,
  },
  // Stats Cards
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 4,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    color: colors.text.primary,
    opacity: 0.8,
    marginTop: 0,
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
    color: colors.text.muted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 12,
    flex: 1,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
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
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  addFirstButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  addServiceButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  addServiceButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  addServiceIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addServiceTextContainer: {
    flex: 1,
  },
  addServiceButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 1,
  },
  addServiceButtonSubtext: {
    color: colors.text.primary,
    fontSize: 11,
    opacity: 0.8,
  },
  // Add Product Button
  addProductButton: {
    backgroundColor: colors.success,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  addProductButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  addProductIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addProductTextContainer: {
    flex: 1,
  },
  addProductButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  addProductButtonSubtext: {
    color: colors.text.primary,
    fontSize: 12,
    opacity: 0.8,
  },
  servicesList: {
    gap: 8,
  },
  serviceCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceCardContent: {
    marginBottom: 8,
  },
  serviceCardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  serviceIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  serviceStatusContainer: {
    alignItems: 'flex-end',
  },
  statusIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  serviceStats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  serviceStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serviceStatText: {
    fontSize: 12,
    color: colors.text.muted,
    fontWeight: '500',
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.error,
  },
  serviceMainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceDetails: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  serviceType: {
    fontSize: 12,
    color: colors.text.muted,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  serviceDescription: {
    fontSize: 13,
    color: colors.text.muted,
    lineHeight: 18,
  },
  serviceActions: {
    alignItems: 'flex-end',
  },
  statusButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusButtonText: {
    color: colors.text.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  serviceActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
    color: colors.text.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  tipoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tipoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tipoButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tipoButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: colors.text.primary,
  },
  tipoButtonTextSelected: {
    color: colors.text.primary,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.text.muted,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
  },
  // Tabs styles
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.muted,
    marginLeft: 8,
  },
  activeTabText: {
    color: colors.text.primary,
  },
  // Product styles
  productsList: {
    gap: 12,
  },
  productCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productCardContent: {
    marginBottom: 12,
  },
  productCardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  productImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  productStatusContainer: {
    alignItems: 'flex-end',
  },
  productPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  productPriceLabel: {
    fontSize: 12,
    color: colors.text.muted,
    marginRight: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  productStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  productStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productStatText: {
    fontSize: 12,
    color: colors.text.muted,
    fontWeight: '500',
  },
  productMainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  productService: {
    fontSize: 14,
    color: colors.text.muted,
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: colors.text.muted,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  productActions: {
    marginLeft: 12,
  },
  productActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  // Service selector styles
  serviceSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectedServiceOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  serviceOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.muted,
  },
  selectedServiceOptionText: {
    color: colors.text.primary,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
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
    backgroundColor: colors.background,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
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
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.surface,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  // Image picker styles
  imagePicker: {
    height: 140,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.text.muted,
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  // Add new service button
  addNewServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: colors.background,
  },
  addNewServiceText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    marginLeft: 8,
  },
  // Price input with currency symbol
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  priceInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
  },
  // Icon selector styles
  iconSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIconOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  // Modal footer
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: colors.surface,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.muted,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Price subtext
  priceSubtext: {
    fontSize: 12,
    color: colors.text.muted,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  // Availability selector
  availabilitySelector: {
    flexDirection: 'row',
    gap: 12,
  },
  availabilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectedAvailabilityOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.muted,
    marginLeft: 8,
  },
  selectedAvailabilityText: {
    color: colors.text.primary,
  },
  // Modal content container with bottom margin
  modalContentContainer: {
    paddingBottom: 20,
  },
  // Enhanced image styles
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  premiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  premiumButtonText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  imagePlaceholderSubtext: {
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  // Product categories styles
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 100,
  },
  activeCategoryTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.muted,
    marginLeft: 6,
    marginRight: 8,
  },
  activeCategoryTabText: {
    color: '#FFFFFF',
  },
  categoryBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  activeCategoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.muted,
  },
  activeCategoryBadgeText: {
    color: '#FFFFFF',
  },
});

export default MisServiciosScreen;