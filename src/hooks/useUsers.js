import { useState, useEffect, useCallback } from 'react';
import { 
  getUsersByRole, 
  getAllUsers, 
  getUserStats, 
  searchUsers,
  updateUserStatus,
  deleteUser
} from '../services/users';

export const useUsers = (role = null, limitCount = 50) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const loadUsers = useCallback(async (reset = false) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = role 
        ? await getUsersByRole(role, limitCount, reset ? null : lastDoc)
        : await getAllUsers(limitCount, reset ? null : lastDoc);

      if (result.success) {
        if (reset) {
          setUsers(result.users);
        } else {
          setUsers(prev => [...prev, ...result.users]);
        }
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [role, limitCount, lastDoc, loading]);

  const refreshUsers = useCallback(() => {
    setUsers([]);
    setLastDoc(null);
    setHasMore(true);
    loadUsers(true);
  }, [loadUsers]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadUsers(false);
    }
  }, [hasMore, loading, loadUsers]);

  useEffect(() => {
    loadUsers(true);
  }, [role]);

  return {
    users,
    loading,
    error,
    hasMore,
    refreshUsers,
    loadMore
  };
};

export const useUserStats = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    tourists: 0,
    centers: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getUserStats();
      if (result.success) {
        setStats(result.stats);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refreshStats: loadStats
  };
};

export const useUserSearch = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const search = useCallback(async (searchText, role = null) => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      const result = await searchUsers(searchText, role);
      if (result.success) {
        setSearchResults(result.users);
      } else {
        setSearchError(result.error);
      }
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
  }, []);

  return {
    searchResults,
    searchLoading,
    searchError,
    search,
    clearSearch
  };
};

export const useUserActions = () => {
  const [actionLoading, setActionLoading] = useState(false);

  const updateUser = useCallback(async (userId, updates) => {
    setActionLoading(true);
    try {
      const result = await updateUserStatus(userId, updates);
      return result;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const removeUser = useCallback(async (userId) => {
    setActionLoading(true);
    try {
      const result = await deleteUser(userId);
      return result;
    } finally {
      setActionLoading(false);
    }
  }, []);

  return {
    updateUser,
    removeUser,
    actionLoading
  };
};


