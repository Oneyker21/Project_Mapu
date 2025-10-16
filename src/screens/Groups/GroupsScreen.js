import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Image,
  Modal,
  TextInput,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, doc, setDoc, addDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig.js';
import { useAuth } from '../../contexts/AuthContext';
import { colors, withOpacity } from '../../config/colors';
import DateTimePicker from '@react-native-community/datetimepicker';

const GroupsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupStartDate, setNewGroupStartDate] = useState(new Date());
  const [newGroupEndDate, setNewGroupEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [joinGroupCode, setJoinGroupCode] = useState('');
  const [editingGroup, setEditingGroup] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadGroups();
    loadUserGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const groupsSnapshot = await getDocs(collection(db, 'groups'));
      const groupsData = [];
      
      groupsSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        groupsData.push({
          id: docSnap.id,
          ...data,
          memberCount: data.members ? data.members.length : 0
        });
      });

      setGroups(groupsData);
    } catch (error) {
      console.error('Error cargando grupos:', error);
      Alert.alert('Error', 'No se pudieron cargar los grupos');
    } finally {
      setLoading(false);
    }
  };

  const loadUserGroups = async () => {
    try {
      if (!user) return;
      
      const userDoc = await getDocs(collection(db, 'users'));
      const userGroupsData = [];
      
      userDoc.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.groups && data.groups.length > 0) {
          userGroupsData.push(...data.groups);
        }
      });

      setUserGroups(userGroupsData);
    } catch (error) {
      console.error('Error cargando grupos del usuario:', error);
    }
  };

  const generateGroupCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert('Error', 'El nombre del grupo es requerido');
      return;
    }

    try {
      const groupCode = generateGroupCode();
      const groupData = {
        name: newGroupName.trim(),
        description: newGroupDescription.trim(),
        code: groupCode,
        createdBy: {
          uid: user.uid,
          name: user.displayName || user.name,
          email: user.email
        },
        members: [user.uid],
        createdAt: new Date(),
        startDate: newGroupStartDate,
        endDate: newGroupEndDate,
        isActive: true,
        routes: []
      };

      const docRef = await addDoc(collection(db, 'groups'), groupData);
      
      // Agregar grupo a los grupos del usuario
      await setDoc(doc(db, 'users', user.uid), {
        groups: arrayUnion(docRef.id)
      }, { merge: true });

      Alert.alert(
        '¡Grupo Creado!',
        `Tu grupo "${newGroupName}" ha sido creado.\n\nCódigo para unirse: ${groupCode}`,
        [
          { text: 'Compartir Código', onPress: () => {
            // Aquí podrías implementar compartir el código
            Alert.alert('Código del Grupo', `Código: ${groupCode}\n\nComparte este código con otros turistas para que se unan a tu grupo.`);
          }},
          { text: 'OK' }
        ]
      );

      setNewGroupName('');
      setNewGroupDescription('');
      setNewGroupStartDate(new Date());
      setNewGroupEndDate(new Date());
      setShowCreateModal(false);
      loadGroups();
    } catch (error) {
      console.error('Error creando grupo:', error);
      Alert.alert('Error', 'No se pudo crear el grupo');
    }
  };

  const editGroup = (group) => {
    setEditingGroup(group);
    setNewGroupName(group.name);
    setNewGroupDescription(group.description || '');
    setNewGroupStartDate(group.startDate ? group.startDate.toDate() : new Date());
    setNewGroupEndDate(group.endDate ? group.endDate.toDate() : new Date());
    setShowEditModal(true);
  };

  const updateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert('Error', 'El nombre del grupo es requerido');
      return;
    }

    try {
      const groupData = {
        name: newGroupName.trim(),
        description: newGroupDescription.trim(),
        startDate: newGroupStartDate,
        endDate: newGroupEndDate,
        updatedAt: new Date(),
      };

      await updateDoc(doc(db, 'groups', editingGroup.id), groupData);

      Alert.alert('¡Grupo Actualizado!', `El grupo "${newGroupName}" ha sido actualizado exitosamente.`);
      
      // Limpiar campos
      setEditingGroup(null);
      setNewGroupName('');
      setNewGroupDescription('');
      setNewGroupStartDate(new Date());
      setNewGroupEndDate(new Date());
      setShowEditModal(false);
      loadGroups();
    } catch (error) {
      console.error('Error actualizando grupo:', error);
      Alert.alert('Error', 'No se pudo actualizar el grupo');
    }
  };

  const joinGroup = async () => {
    if (!joinGroupCode.trim()) {
      Alert.alert('Error', 'Ingresa el código del grupo');
      return;
    }

    try {
      // Buscar grupo por código
      const groupsSnapshot = await getDocs(collection(db, 'groups'));
      let targetGroup = null;
      let targetGroupId = null;

      groupsSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.code === joinGroupCode.trim().toUpperCase()) {
          targetGroup = data;
          targetGroupId = docSnap.id;
        }
      });

      if (!targetGroup) {
        Alert.alert('Error', 'No se encontró un grupo con ese código');
        return;
      }

      if (targetGroup.members && targetGroup.members.includes(user.uid)) {
        Alert.alert('Información', 'Ya eres miembro de este grupo');
        return;
      }

      // Agregar usuario al grupo
      await updateDoc(doc(db, 'groups', targetGroupId), {
        members: arrayUnion(user.uid)
      });

      // Agregar grupo a los grupos del usuario
      await setDoc(doc(db, 'users', user.uid), {
        groups: arrayUnion(targetGroupId)
      }, { merge: true });

      Alert.alert('¡Unido al Grupo!', `Te has unido al grupo "${targetGroup.name}"`);
      setJoinGroupCode('');
      setShowJoinModal(false);
      loadGroups();
    } catch (error) {
      console.error('Error uniéndose al grupo:', error);
      Alert.alert('Error', 'No se pudo unir al grupo');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Fecha no disponible';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderGroupItem = ({ item }) => {
    const isMember = item.members && item.members.includes(user.uid);
    const isCreator = item.createdBy && item.createdBy.uid === user.uid;

    return (
      <TouchableOpacity 
        style={[styles.groupCard, isMember && styles.memberGroupCard]}
        onPress={() => {
          if (isMember) {
            navigation.navigate('GroupDetail', { group: item });
          } else {
            Alert.alert(
              'Unirse al Grupo',
              `¿Te gustaría unirte al grupo "${item.name}"?`,
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Unirse', onPress: () => {
                  setJoinGroupCode(item.code);
                  setShowJoinModal(true);
                }}
              ]
            );
          }
        }}
      >
        <View style={styles.groupHeader}>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.name}</Text>
            <View style={styles.creatorInfo}>
              <Ionicons name="person" size={12} color={colors.text.muted} />
              <Text style={styles.creatorName}>
                Creado por {item.createdBy?.name || 'Usuario'}
              </Text>
            </View>
          </View>
          <View style={styles.groupStats}>
            <Ionicons name="people" size={16} color={colors.primary} />
            <Text style={styles.memberCount}>{item.memberCount}</Text>
          </View>
        </View>

        <Text style={styles.groupDescription} numberOfLines={2}>
          {item.description || 'Sin descripción'}
        </Text>

        <View style={styles.groupFooter}>
          <View style={styles.footerContent}>
            <Text style={styles.groupCode}>Código: {item.code}</Text>
            <View style={styles.datesContainer}>
              <Text style={styles.groupDate}>
                Inicia: {formatDate(item.startDate || item.createdAt)}
              </Text>
              {item.endDate && (
                <Text style={styles.groupEndDate}>
                  Finaliza: {formatDate(item.endDate)}
                </Text>
              )}
            </View>
          </View>
          {isCreator && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => editGroup(item)}
            >
              <Ionicons name="create-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Grupos de Turistas</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando grupos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Grupos de Turistas</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Crear Grupo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.joinButton]}
          onPress={() => setShowJoinModal(true)}
        >
          <Ionicons name="people" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Unirse a Grupo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={groups}
        renderItem={renderGroupItem}
        keyExtractor={(item) => item.id}
        style={styles.groupsList}
        contentContainerStyle={styles.groupsListContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No hay grupos disponibles</Text>
            <Text style={styles.emptySubtitle}>
              Crea tu primer grupo o únete a uno existente
            </Text>
          </View>
        }
      />

      {/* Modal para crear grupo */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Crear Nuevo Grupo</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Nombre del Grupo</Text>
            <TextInput
              style={styles.textInput}
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholder="Ej: Aventureros de Granada"
              maxLength={50}
            />
            
            <Text style={styles.inputLabel}>Descripción (Opcional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newGroupDescription}
              onChangeText={setNewGroupDescription}
              placeholder="Describe tu grupo y qué tipo de rutas planean hacer..."
              multiline
              numberOfLines={3}
              maxLength={200}
            />
            
            <Text style={styles.inputLabel}>Fecha de Inicio</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Ionicons name="calendar" size={16} color={colors.text.muted} />
              <Text style={styles.dateButtonText}>
                {newGroupStartDate.toLocaleDateString('es-ES')}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.inputLabel}>Fecha de Finalización</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Ionicons name="calendar" size={16} color={colors.text.muted} />
              <Text style={styles.dateButtonText}>
                {newGroupEndDate.toLocaleDateString('es-ES')}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.createGroupButton}
              onPress={createGroup}
            >
              <Text style={styles.createGroupButtonText}>Crear Grupo</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal para unirse a grupo */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Unirse a Grupo</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowJoinModal(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Código del Grupo</Text>
            <TextInput
              style={styles.textInput}
              value={joinGroupCode}
              onChangeText={(text) => setJoinGroupCode(text.toUpperCase())}
              placeholder="Ej: ABC123"
              autoCapitalize="characters"
              maxLength={6}
            />
            <Text style={styles.helpText}>
              Pide el código del grupo a un miembro para unirte
            </Text>
          </View>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowJoinModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.joinGroupButton}
              onPress={joinGroup}
            >
              <Text style={styles.joinGroupButtonText}>Unirse</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal para editar grupo */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Grupo</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowEditModal(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Nombre del Grupo</Text>
            <TextInput
              style={styles.textInput}
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholder="Ej: Aventureros de Granada"
              maxLength={50}
            />
            
            <Text style={styles.inputLabel}>Descripción (Opcional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newGroupDescription}
              onChangeText={setNewGroupDescription}
              placeholder="Describe tu grupo y qué tipo de rutas planean hacer..."
              multiline
              numberOfLines={3}
              maxLength={200}
            />
            
            <Text style={styles.inputLabel}>Fecha de Inicio</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Ionicons name="calendar" size={16} color={colors.text.muted} />
              <Text style={styles.dateButtonText}>
                {newGroupStartDate.toLocaleDateString('es-ES')}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.inputLabel}>Fecha de Finalización</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Ionicons name="calendar" size={16} color={colors.text.muted} />
              <Text style={styles.dateButtonText}>
                {newGroupEndDate.toLocaleDateString('es-ES')}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.createGroupButton}
              onPress={updateGroup}
            >
              <Text style={styles.createGroupButtonText}>Actualizar Grupo</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={newGroupStartDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setNewGroupStartDate(selectedDate);
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={newGroupEndDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setNewGroupEndDate(selectedDate);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
  },
  headerSpacer: {
    width: 32,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.button.primary,
    borderWidth: 1,
    borderColor: colors.button.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    shadowColor: colors.button.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  joinButton: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text.secondary,
  },
  groupsList: {
    flex: 1,
  },
  groupsListContent: {
    padding: 16,
    paddingBottom: 20,
  },
  groupCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.card.border,
    shadowColor: colors.card.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  memberGroupCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    backgroundColor: colors.surface,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  groupInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creatorName: {
    fontSize: 12,
    color: colors.text.muted,
    flex: 1,
  },
  groupStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: withOpacity(colors.primary, 0.1),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  memberCount: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  groupDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  footerContent: {
    flex: 1,
    gap: 8,
  },
  datesContainer: {
    gap: 2,
  },
  editButton: {
    padding: 8,
    backgroundColor: withOpacity(colors.primary, 0.1),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    marginLeft: 12,
    alignSelf: 'flex-start',
  },
  groupCode: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    backgroundColor: withOpacity(colors.primary, 0.1),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  groupDate: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
  groupEndDate: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.input.text,
    backgroundColor: colors.input.background,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.input.background,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.input.text,
    flex: 1,
  },
  helpText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.button.secondaryBorder,
    backgroundColor: colors.button.secondary,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text.muted,
    fontSize: 16,
    fontWeight: '600',
  },
  createGroupButton: {
    flex: 1,
    backgroundColor: colors.button.primary,
    borderWidth: 1,
    borderColor: colors.button.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: colors.button.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  createGroupButtonText: {
    color: colors.button.text,
    fontSize: 16,
    fontWeight: '600',
  },
  joinGroupButton: {
    flex: 1,
    backgroundColor: colors.success,
    borderWidth: 1,
    borderColor: colors.success,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: colors.success,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  joinGroupButtonText: {
    color: colors.button.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GroupsScreen;
