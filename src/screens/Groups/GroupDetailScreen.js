import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../../database/FirebaseConfig.js';
import { useAuth } from '../../contexts/AuthContext';
import { colors, withOpacity } from '../../config/colors';
import { getRouteById } from '../../services/routes';

const GroupDetailScreen = ({ navigation, route }) => {
  const { group } = route.params;
  const { user } = useAuth();
  const [groupData, setGroupData] = useState(group);
  const [groupRoutes, setGroupRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    loadGroupDetails();
    checkIfCreator();
  }, []);

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

  const inviteToGroup = () => {
    Alert.alert(
      'Invitar al Grupo',
      `Código del grupo: ${groupData.code}\n\nComparte este código con otros turistas para que se unan.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Compartir', onPress: shareGroupCode }
      ]
    );
  };

  const addRouteToGroup = () => {
    navigation.navigate('ExploreRoutes', { 
      fromGroup: true, 
      groupId: group.id,
      groupName: groupData.name 
    });
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
    <TouchableOpacity 
      style={styles.routeCard}
      onPress={() => navigation.navigate('RouteDetail', { route })}
    >
      <View style={styles.routeHeader}>
        <Text style={styles.routeTitle} numberOfLines={2}>
          {route.title}
        </Text>
        <View style={styles.routeStats}>
          <View style={styles.statItem}>
            <Ionicons name="location" size={14} color="#6B7280" />
            <Text style={styles.statText}>{route.centers.length}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="heart" size={14} color="#EF4444" />
            <Text style={styles.statText}>{route.likes?.length || 0}</Text>
          </View>
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
    </TouchableOpacity>
  );

  const renderMemberItem = ({ item: memberId }) => {
    // En una implementación real, necesitarías cargar los datos del usuario
    return (
      <View style={styles.memberItem}>
        <View style={styles.memberAvatar}>
          <Ionicons name="person" size={20} color="#6B7280" />
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>
            {memberId === user.uid ? 'Tú' : 'Miembro del Grupo'}
          </Text>
          <Text style={styles.memberStatus}>
            {memberId === user.uid ? 'Tú' : 'Miembro'}
          </Text>
        </View>
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
            <Ionicons name="arrow-back" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{groupData.name}</Text>
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={shareGroupCode}
          >
            <Ionicons name="share" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
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
          <Ionicons name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {groupData.name}
        </Text>
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={shareGroupCode}
        >
          <Ionicons name="share" size={24} color="#3B82F6" />
        </TouchableOpacity>
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
            <Ionicons name="people" size={16} color="#6B7280" />
            <Text style={styles.statLabel}>Miembros</Text>
            <Text style={styles.statValue}>{groupData.memberCount || 0}</Text>
          </View>
          <View style={styles.statContainer}>
            <Ionicons name="map" size={16} color="#6B7280" />
            <Text style={styles.statLabel}>Rutas</Text>
            <Text style={styles.statValue}>{groupRoutes.length}</Text>
          </View>
          <View style={styles.statContainer}>
            <Ionicons name="key" size={16} color="#6B7280" />
            <Text style={styles.statLabel}>Código</Text>
            <Text style={styles.statValue}>{groupData.code}</Text>
          </View>
        </View>

        <Text style={styles.groupDate}>
          Creado {formatDate(groupData.createdAt)}
        </Text>
      </View>

      {/* Botón para agregar ruta */}
      <TouchableOpacity 
        style={styles.addRouteButton}
        onPress={addRouteToGroup}
      >
        <Ionicons name="add-circle" size={20} color="#FFFFFF" />
        <Text style={styles.addRouteButtonText}>Agregar Ruta al Grupo</Text>
      </TouchableOpacity>

      {/* Tabs para rutas y miembros */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={styles.tab}>
          <Ionicons name="map" size={20} color="#3B82F6" />
          <Text style={styles.tabText}>Rutas ({groupRoutes.length})</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de rutas */}
      <FlatList
        data={groupRoutes}
        renderItem={renderRouteItem}
        keyExtractor={(item) => item.id}
        style={styles.routesList}
        contentContainerStyle={styles.routesListContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="map-outline" size={64} color="#9CA3AF" />
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    flex: 1,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
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
  groupDate: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  addRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addRouteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EBF4FF',
    borderRadius: 8,
    gap: 8,
  },
  tabText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  routesList: {
    flex: 1,
  },
  routesListContent: {
    padding: 16,
    paddingBottom: 20,
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
    marginRight: 12,
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
  },
  routeAuthor: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  routeDate: {
    fontSize: 12,
    color: colors.text.secondary,
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
