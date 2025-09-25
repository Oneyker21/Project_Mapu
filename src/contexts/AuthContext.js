import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkAuthState, autoLogin, logoutUser } from '../services/auth.js';
import { getSavedUserData, hasStoredSession } from '../services/storage.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      // Verificar si hay una sesión guardada
      const hasSession = await hasStoredSession();
      
      if (hasSession) {
        // Intentar auto-login
        const autoLoginResult = await autoLogin();
        if (autoLoginResult.success) {
          setUser(autoLoginResult.user);
          setIsAuthenticated(true);
        } else {
          // Si el auto-login falla, verificar el estado de Firebase
          const firebaseUser = await checkAuthState();
          if (firebaseUser) {
            setUser(firebaseUser);
            setIsAuthenticated(true);
          } else {
            // No hay usuario autenticado
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } else {
        // Verificar estado de Firebase Auth
        const firebaseUser = await checkAuthState();
        if (firebaseUser) {
          setUser(firebaseUser);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('Error al inicializar autenticación:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    initializeAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
