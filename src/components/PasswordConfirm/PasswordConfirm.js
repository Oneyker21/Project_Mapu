import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../Input/Input';

const PasswordConfirm = ({ 
  label, 
  placeholder, 
  value, 
  onChangeText, 
  password, 
  error,
  ...props 
}) => {
  const isMatch = password && value && password === value;
  const hasError = error || (password && value && password !== value);

  return (
    <View style={styles.container}>
      <Input
        label={label}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={true}
        showPasswordToggle={true}
        error={hasError ? (error || 'Las contraseñas no coinciden') : ''}
        {...props}
      />
      
      {/* Indicador de confirmación */}
      {value && (
        <View style={styles.confirmationIndicator}>
          {isMatch ? (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.successText}>Las contraseñas coinciden</Text>
            </View>
          ) : hasError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="close-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>Las contraseñas no coinciden</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16, // Espacio arriba para separar de las etiquetas
    marginBottom: 16,
  },
  confirmationIndicator: {
    marginTop: 8,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default PasswordConfirm;
