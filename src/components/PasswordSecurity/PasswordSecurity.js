import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPasswordSecurity } from '../../utils/validations';

const PasswordSecurity = ({ password }) => {
  const security = getPasswordSecurity(password);

  const securityChecks = [
    { key: 'length', label: 'Al menos 8 caracteres', icon: 'text' },
    { key: 'number', label: 'Un número', icon: 'calculator' },
    { key: 'uppercase', label: 'Una letra mayúscula', icon: 'arrow-up' },
    { key: 'special', label: 'Un carácter especial', icon: 'key' },
    { key: 'lowercase', label: 'Una letra minúscula', icon: 'arrow-down' },
  ];

  return (
    <View>
      {/* Barra de progreso integrada al input */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${security.percentage}%`,
                backgroundColor: security.color 
              }
            ]} 
          />
        </View>
      </View>

      {/* Título de fortaleza */}
      <View style={styles.strengthTitleContainer}>
        <Ionicons
          name="shield"
          size={16}
          color={security.color}
          style={styles.shieldIcon}
        />
        <Text style={[styles.strengthTitle, { color: security.color }]}>
          Contraseña {security.strength}
        </Text>
      </View>

      {/* Lista de verificaciones como botones horizontales */}
      <View style={styles.checksContainer}>
        <View style={styles.checksList}>
          {securityChecks.map((check) => (
            <View key={check.key} style={[
              styles.checkButton,
              security.checks[check.key] && styles.checkButtonPassed
            ]}>
              <Ionicons
                name={security.checks[check.key] ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={security.checks[check.key] ? '#FFFFFF' : '#6B7280'}
                style={styles.checkIcon}
              />
              <Text style={[
                styles.checkText,
                security.checks[check.key] && styles.checkTextPassed
              ]}>
                {check.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Barra de progreso normal abajo del input
  progressContainer: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  
  // Título de fortaleza
  strengthTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  strengthTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  
  // Verificaciones como botones horizontales
  checksContainer: {
    paddingHorizontal: 16,
  },
  checksList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: '45%',
    flex: 1,
    marginBottom: 4,
  },
  checkButtonPassed: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkIcon: {
    marginRight: 8,
  },
  checkText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  checkTextPassed: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  shieldIcon: {
    marginRight: 4,
  },
});

export default PasswordSecurity;
