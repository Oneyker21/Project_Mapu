import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Share,
  Image,
  Modal,
  TextInput,
  Clipboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { doc, getDoc, updateDoc, arrayUnion, collection, getDocs } from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig.js';
import { useAuth } from '../../contexts/AuthContext';
import { colors, withOpacity } from '../../config/colors';
import { getRouteById } from '../../services/routes';

const GroupDetailScreen = ({ navigation, route }) => {
  const { group } = route.params;
  const { user } = useAuth();
  const [groupData, setGroupData] = useState(group);
  const [groupRoutes, setGroupRoutes] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [activeTab, setActiveTab] = useState('routes'); // 'routes' o 'members'
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Recargar datos cuando la pantalla esté en foco
  useFocusEffect(
    useCallback(() => {
      loadGroupDetails();
      checkIfCreator();
    }, [])
  );

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length >= 3) {
        searchUsers(searchQuery);
      }
    }, 500); // Esperar 500ms después de que el usuario deje de escribir

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const loadGroupDetails = async () => {
    try {
      setLoading(true);
      const groupDoc = await getDoc(doc(db, 'groups', group.id));
      
      if (groupDoc.exists()) {
        const data = groupDoc.data();
        setGroupData({ ...group, ...data });
        
        // Cargar rutas del grupo
        if (data.routes && data.routes.length > 0) {
          const routesPromises = data.routes.map(async (routeId) => {
            try {
              const route = await getRouteById(routeId);
              return route;
            } catch (error) {
              console.error(`Error cargando ruta ${routeId}:`, error);
              return null;
            }
          });
          
          const loadedRoutes = (await Promise.all(routesPromises)).filter(Boolean);
          setGroupRoutes(loadedRoutes);
        } else {
          // Si no hay rutas, limpiar el estado
          setGroupRoutes([]);
        }
        
        // Cargar datos de los miembros
        if (data.members && data.members.length > 0) {
          const membersPromises = data.members.map(async (memberId) => {
            try {
              // Buscar en turistas
              let memberDoc = await getDoc(doc(db, 'turistas', memberId));
              if (memberDoc.exists()) {
                return {
                  id: memberId,
                  ...memberDoc.data(),
                  isCreator: data.createdBy && data.createdBy.uid === memberId
                };
              }
              
              // Si no está en turistas, retornar datos básicos
              return {
                id: memberId,
                nombres: 'Usuario',
                apellidos: '',
                isCreator: data.createdBy && data.createdBy.uid === memberId
              };
            } catch (error) {
              console.error(`Error cargando miembro ${memberId}:`, error);
              return null;
            }
          });
          
          const loadedMembers = (await Promise.all(membersPromises)).filter(Boolean);
          setGroupMembers(loadedMembers);
        } else {
          // Si no hay miembros, limpiar el estado
          setGroupMembers([]);
        }
      }
    } catch (error) {
      console.error('Error cargando detalles del grupo:', error);
      Alert.alert('Error', 'No se pudieron cargar los detalles del grupo');
    } finally {
      setLoading(false);
    }
  };

  const checkIfCreator = () => {
    setIsCreator(group.createdBy && group.createdBy.uid === user.uid);
  };

  const shareGroupCode = async () => {
    try {
      await Share.share({
        message: `¡Únete a mi grupo de turistas "${groupData.name}"!\n\nCódigo: ${groupData.code}\n\nDescripción: ${groupData.description || 'Exploramos Nicaragua juntos'}`,
        title: `Grupo: ${groupData.name}`,
      });
    } catch (error) {
      console.error('Error compartiendo:', error);
    }
  };

  const copyGroupCode = async () => {
    try {
      await Clipboard.setString(groupData.code);
      Alert.alert('¡Copiado!', `Código "${groupData.code}" copiado al portapapeles`);
    } catch (error) {
      console.error('Error copiando código:', error);
      Alert.alert('Error', 'No se pudo copiar el código');
    }
  };

  const inviteToGroup = () => {
    Alert.alert(
      'Invitar al Grupo',
      'Elige cómo quieres invitar a tus amigos:',
      [
        { 
          text: 'Compartir Código', 
          onPress: () => {
            Alert.alert(
              'Código del Grupo',
              `Código: ${groupData.code}\n\nComparte este código con otros turistas para que se unan.`,
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Compartir', onPress: shareGroupCode }
              ]
            );
          }
        },
        { 
          text: 'Buscar Usuario', 
          onPress: () => setShowInviteModal(true)
        },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const searchUsers = async (query) => {
    if (!query || query.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const queryLower = query.toLowerCase().trim();
      console.log('🔍 Buscando turistas con query:', queryLower);
      
      // Solo buscar en turistas (los grupos son solo para turistas)
      const turistasSnapshot = await getDocs(collection(db, 'turistas'));
      console.log('📊 Total turistas en la base de datos:', turistasSnapshot.size);
      
      const results = [];
      
      turistasSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const nombres = (data.nombres || '').toLowerCase();
        const apellidos = (data.apellidos || '').toLowerCase();
        const email = (data.email || '').toLowerCase();
        
        // Crear nombre completo para búsqueda
        const fullName = `${nombres} ${apellidos}`.trim();
        
        console.log('👤 Turista:', { 
          id: docSnap.id, 
          nombres: data.nombres, 
          apellidos: data.apellidos,
          email: data.email,
          fullName: fullName
        });
        
        // Búsqueda mejorada: nombre, apellidos, nombre completo o email
        const matchesQuery = 
          nombres.includes(queryLower) ||           // Buscar en nombres
          apellidos.includes(queryLower) ||         // Buscar en apellidos
          fullName.includes(queryLower) ||          // Buscar en nombre completo
          email.includes(queryLower);               // Buscar en email
        
        // Filtrar: que coincida con la query Y que no sea el usuario actual Y que no esté ya en el grupo
        if (
          matchesQuery &&
          docSnap.id !== user.uid &&
          (!groupData.members || !groupData.members.includes(docSnap.id))
        ) {
          console.log('✅ Turista coincide con la búsqueda:', docSnap.id);
          results.push({
            id: docSnap.id,
            nombres: data.nombres || '',
            apellidos: data.apellidos || '',
            email: data.email || '',
            imagenPerfil: data.imagenPerfil || ''
          });
        }
      });

      console.log('🎯 Resultados finales encontrados:', results.length);
      setSearchResults(results);
    } catch (error) {
      console.error('❌ Error buscando turistas:', error);
      Alert.alert('Error', 'No se pudieron buscar usuarios');
    } finally {
      setSearching(false);
    }
  };

  const handleInviteUser = async (userId, userName) => {
    try {
      const groupRef = doc(db, 'groups', group.id);
      await updateDoc(groupRef, {
        members: arrayUnion(userId)
      });

      Alert.alert('¡Invitado!', `${userName} ha sido agregado al grupo`);
      setShowInviteModal(false);
      setSearchQuery('');
      setSearchResults([]);
      loadGroupDetails(); // Recargar para mostrar el nuevo miembro
    } catch (error) {
      console.error('Error invitando usuario:', error);
      Alert.alert('Error', 'No se pudo invitar al usuario');
    }
  };

  const addRouteToGroup = () => {
    navigation.navigate('ExploreRoutes', { 
      fromGroup: true, 
      groupId: group.id,
      groupName: groupData.name 
    });
  };

  const handleLeaveGroup = () => {
    if (isCreator) {
      Alert.alert(
        'No puedes salir',
        'Como creador del grupo, no puedes salir. Si deseas eliminar el grupo, contacta al soporte.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Salir del Grupo',
      `¿Estás seguro de que quieres salir del grupo "${groupData.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            try {
              const groupRef = doc(db, 'groups', group.id);
              const currentMembers = groupData.members || [];
              const updatedMembers = currentMembers.filter(id => id !== user.uid);
              
              await updateDoc(groupRef, {
                members: updatedMembers
              });
              
              Alert.alert(
                'Has salido del grupo',
                `Ya no eres miembro de "${groupData.name}"`,
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack()
                  }
                ]
              );
            } catch (error) {
              console.error('Error saliendo del grupo:', error);
              Alert.alert('Error', 'No se pudo salir del grupo');
            }
          }
        }
      ]
    );
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

  const renderRouteItem = ({ item: route }) => (
    <View style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <View style={styles.routeTitleContainer}>
          <Text style={styles.routeTitle} numberOfLines={2}>
            {route.title}
          </Text>
        </View>
        <View style={styles.routeHeaderRight}>
          <View style={styles.routeStats}>
            <View style={styles.statItem}>
              <Ionicons name="location" size={14} color={colors.text.secondary} />
              <Text style={styles.statText}>{route.centers.length}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="heart" size={14} color="#EF4444" />
              <Text style={styles.statText}>{route.likes?.length || 0}</Text>
            </View>
          </View>
          {isCreator && (
            <TouchableOpacity 
              style={styles.deleteRouteButton}
              onPress={() => handleRemoveRoute(route.id, route.title)}
            >
              <Ionicons name="trash" size={18} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <Text style={styles.routeDescription} numberOfLines={2}>
        {route.description || 'Sin descripción'}
      </Text>
      
      <View style={styles.routeFooter}>
        <Text style={styles.routeAuthor}>
          Por {route.author.name}
        </Text>
        <Text style={styles.routeDate}>
          {formatDate(route.createdAt)}
        </Text>
      </View>

      {/* Botones de acción */}
      <View style={styles.routeActions}>
        <TouchableOpacity 
          style={styles.routeActionButton}
          onPress={() => navigation.navigate('RouteNavigation', { route: route.centers || route })}
        >
          <Ionicons name="navigate" size={18} color="#FFFFFF" />
          <Text style={styles.routeActionText}>Navegar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.routeActionButton, styles.routeDetailsButton]}
          onPress={() => navigation.navigate('RouteSummary', { route: route })}
        >
          <Ionicons name="information-circle" size={18} color={colors.primary} />
          <Text style={[styles.routeActionText, styles.routeDetailsText]}>Detalles</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleRemoveRoute = async (routeId, routeTitle) => {
    if (!isCreator) {
      Alert.alert('Error', 'Solo el creador puede eliminar rutas del grupo');
      return;
    }

    Alert.alert(
      'Eliminar Ruta',
      `¿Estás seguro de que quieres eliminar "${routeTitle}" del grupo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const groupRef = doc(db, 'groups', group.id);
              const currentRoutes = groupData.routes || [];
              const updatedRoutes = currentRoutes.filter(id => id !== routeId);
              
              await updateDoc(groupRef, {
                routes: updatedRoutes
              });
              
              Alert.alert('Éxito', 'Ruta eliminada del grupo');
              loadGroupDetails();
            } catch (error) {
              console.error('Error eliminando ruta:', error);
              Alert.alert('Error', 'No se pudo eliminar la ruta');
            }
          }
        }
      ]
    );
  };

  const handleRemoveMember = async (memberId) => {
    if (!isCreator) {
      Alert.alert('Error', 'Solo el creador puede eliminar miembros');
      return;
    }
    
    if (memberId === user.uid) {
      Alert.alert('Error', 'No puedes eliminarte a ti mismo del grupo');
      return;
    }
    
    Alert.alert(
      'Eliminar Miembro',
      '¿Estás seguro de que quieres eliminar a este miembro del grupo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const groupRef = doc(db, 'groups', group.id);
              const currentMembers = groupData.members || [];
              const updatedMembers = currentMembers.filter(id => id !== memberId);
              
              await updateDoc(groupRef, {
                members: updatedMembers
              });
              
              Alert.alert('Éxito', 'Miembro eliminado del grupo');
              loadGroupDetails();
            } catch (error) {
              console.error('Error eliminando miembro:', error);
              Alert.alert('Error', 'No se pudo eliminar el miembro');
            }
          }
        }
      ]
    );
  };

  const renderMemberItem = ({ item: member }) => {
    const isMe = member.id === user.uid;
    const fullName = `${member.nombres || ''} ${member.apellidos || ''}`.trim() || 'Usuario';
    
    return (
      <View style={styles.memberItem}>
        <View style={styles.memberAvatar}>
          {member.imagenPerfil ? (
            <Image 
              source={{ uri: member.imagenPerfil }} 
              style={styles.memberAvatarImage}
            />
          ) : (
            <Ionicons name="person" size={24} color={colors.text.muted} />
          )}
        </View>
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName}>
              {isMe ? `${fullName} (Tú)` : fullName}
            </Text>
            {member.isCreator && (
              <View style={styles.creatorBadge}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.creatorBadgeText}>Creador</Text>
              </View>
            )}
          </View>
          <Text style={styles.memberEmail}>
            {member.email || ''}
          </Text>
        </View>
        {isCreator && !isMe && !member.isCreator && (
          <TouchableOpacity 
            style={styles.removeMemberButton}
            onPress={() => handleRemoveMember(member.id)}
          >
            <Ionicons name="close-circle" size={24} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
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
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{groupData.name}</Text>
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={shareGroupCode}
        >
          <Ionicons name="share" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando grupo...</Text>
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
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {groupData.name}
        </Text>
        <View style={styles.headerActions}>
          {!isCreator && (
            <TouchableOpacity 
              style={styles.leaveButton}
              onPress={handleLeaveGroup}
            >
              <Ionicons name="exit-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={shareGroupCode}
          >
            <Ionicons name="share" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Información del grupo */}
      <View style={styles.groupInfo}>
        <View style={styles.groupHeader}>
          <View style={styles.groupTitleContainer}>
            <Text style={styles.groupName}>{groupData.name}</Text>
            <View style={styles.creatorInfo}>
              <Ionicons name="person" size={14} color={colors.text.muted} />
              <Text style={styles.creatorName}>
                Creado por {groupData.createdBy?.name || 'Usuario'}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.inviteButton}
            onPress={inviteToGroup}
          >
            <Ionicons name="person-add" size={16} color="#FFFFFF" />
            <Text style={styles.inviteButtonText}>Invitar</Text>
          </TouchableOpacity>
        </View>

        {groupData.description && (
          <Text style={styles.groupDescription}>
            {groupData.description}
          </Text>
        )}

        <View style={styles.groupStats}>
          <View style={styles.statContainer}>
            <Ionicons name="people" size={16} color={colors.text.secondary} />
            <Text style={styles.statLabel}>Miembros</Text>
            <Text style={styles.statValue}>{groupData.memberCount || 0}</Text>
          </View>
          <View style={styles.statContainer}>
            <Ionicons name="map" size={16} color={colors.text.secondary} />
            <Text style={styles.statLabel}>Rutas</Text>
            <Text style={styles.statValue}>{groupRoutes.length}</Text>
          </View>
          <TouchableOpacity 
            style={styles.statContainer}
            onPress={copyGroupCode}
            activeOpacity={0.7}
          >
            <Ionicons name="key" size={16} color={colors.text.secondary} />
            <Text style={styles.statLabel}>Código</Text>
            <Text style={styles.statValue}>{groupData.code}</Text>
            <Ionicons name="copy-outline" size={14} color={colors.text.secondary} style={styles.copyIcon} />
          </TouchableOpacity>
        </View>

        <Text style={styles.groupDate}>
          Creado {formatDate(groupData.createdAt)}
        </Text>
      </View>

      {/* Botones para agregar/crear rutas - solo mostrar si ya hay rutas */}
      {groupRoutes.length > 0 && (
        <View style={styles.routeButtonsContainer}>
          <TouchableOpacity 
            style={[styles.addRouteButton, styles.halfButton]}
            onPress={addRouteToGroup}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.addRouteButtonText}>Agregar Ruta al Grupo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.createRouteButton, styles.halfButton]}
            onPress={() => navigation.navigate('RouteCreation')}
          >
            <Ionicons name="map" size={20} color="#FFFFFF" />
            <Text style={styles.createRouteButtonText}>Crear Nueva Ruta +</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tabs para rutas y miembros */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'routes' && styles.activeTab]}
          onPress={() => setActiveTab('routes')}
        >
          <Ionicons 
            name="map" 
            size={20} 
            color={activeTab === 'routes' ? colors.primary : colors.text.secondary} 
          />
          <Text style={[styles.tabText, activeTab === 'routes' && styles.activeTabText]}>
            Rutas ({groupRoutes.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'members' && styles.activeTab]}
          onPress={() => setActiveTab('members')}
        >
          <Ionicons 
            name="people" 
            size={20} 
            color={activeTab === 'members' ? colors.primary : colors.text.secondary} 
          />
          <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>
            Miembros ({groupMembers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido según tab activo */}
      {activeTab === 'routes' ? (
        <FlatList
          data={groupRoutes}
          renderItem={renderRouteItem}
          keyExtractor={(item) => item.id}
          style={styles.routesList}
          contentContainerStyle={styles.routesListContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="map-outline" size={64} color={colors.text.muted} />
              <Text style={styles.emptyTitle}>No hay rutas en el grupo</Text>
              <Text style={styles.emptySubtitle}>
                Agrega rutas creativas para compartir con el grupo
              </Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={addRouteToGroup}
              >
                <Text style={styles.emptyButtonText}>Agregar Primera Ruta</Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <FlatList
          data={groupMembers}
          renderItem={renderMemberItem}
          keyExtractor={(item) => item.id}
          style={styles.routesList}
          contentContainerStyle={styles.routesListContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={colors.text.muted} />
              <Text style={styles.emptyTitle}>No hay miembros en el grupo</Text>
              <Text style={styles.emptySubtitle}>
                Invita a tus amigos para compartir esta aventura
              </Text>
          </View>
        }
        />
      )}

      {/* Modal para invitar usuarios por búsqueda */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Invitar Usuarios</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => {
                setShowInviteModal(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
            >
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={colors.text.secondary} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Buscar por nombre o email..."
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searching && (
                <ActivityIndicator size="small" color={colors.primary} />
              )}
            </View>
            <Text style={styles.searchHint}>
              Escribe al menos 3 caracteres para buscar
            </Text>
          </View>

          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            style={styles.searchResultsList}
            contentContainerStyle={styles.searchResultsContent}
            renderItem={({ item }) => {
              const fullName = `${item.nombres || ''} ${item.apellidos || ''}`.trim();
              const displayName = fullName || 'Usuario';
              
              return (
                <TouchableOpacity 
                  style={styles.searchResultItem}
                  onPress={() => handleInviteUser(item.id, displayName)}
                >
                  <View style={styles.resultAvatar}>
                    {item.imagenPerfil ? (
                      <Image 
                        source={{ uri: item.imagenPerfil }} 
                        style={styles.resultAvatarImage}
                      />
                    ) : (
                      <Ionicons 
                        name="person" 
                        size={24} 
                        color={colors.text.secondary} 
                      />
                    )}
                  </View>
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{displayName}</Text>
                    <Text style={styles.resultEmail}>{item.email}</Text>
                  </View>
                  <Ionicons name="person-add" size={24} color={colors.primary} />
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              searchQuery.trim().length >= 3 && !searching ? (
                <View style={styles.emptySearchContainer}>
                  <Ionicons name="search-outline" size={48} color={colors.text.muted} />
                  <Text style={styles.emptySearchText}>
                    No se encontraron usuarios
                  </Text>
                  <Text style={styles.emptySearchSubtext}>
                    Intenta con otro nombre o email
                  </Text>
                </View>
              ) : null
            }
          />
        </SafeAreaView>
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leaveButton: {
    padding: 4,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  shareButton: {
    padding: 4,
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
  groupInfo: {
    backgroundColor: colors.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  groupTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 6,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creatorName: {
    fontSize: 14,
    color: colors.text.muted,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    alignSelf: 'flex-start',
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  groupDescription: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
    marginBottom: 16,
  },
  groupStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statContainer: {
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  copyIcon: {
    marginLeft: 4,
  },
  groupDate: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  routeButtonsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    gap: 12,
  },
  halfButton: {
    flex: 1,
  },
  addRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addRouteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  createRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createRouteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  activeTab: {
    backgroundColor: withOpacity(colors.primary, 0.1),
    borderColor: colors.primary,
  },
  tabText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.primary,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  memberEmail: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  creatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  creatorBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  removeMemberButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  modalCloseButton: {
    padding: 4,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: colors.surface,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  searchHint: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 8,
  },
  searchResultsList: {
    flex: 1,
  },
  searchResultsContent: {
    padding: 16,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  resultEmail: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  emptySearchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptySearchText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
  },
  emptySearchSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
  },
  routesList: {
    flex: 1,
  },
  routesListContent: {
    padding: 16,
    paddingBottom: 20,
  },
  routeCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  routeTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  routeHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteRouteButton: {
    padding: 4,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  routeStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  routeDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  routeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeAuthor: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  routeDate: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  routeActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  routeActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  routeDetailsButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  routeActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  routeDetailsText: {
    color: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    minHeight: 300,
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
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GroupDetailScreen;
