import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Input = ({ 
  label, 
  placeholder, 
  value, 
  onChangeText, 
  secureTextEntry = false, 
  error,
  showPasswordToggle = false,
  ...props 
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(!!value);
  const [labelAnimation] = useState(new Animated.Value(value ? 1 : 0));

  // Actualizar el estado cuando el valor cambie
  useEffect(() => {
    setIsFocused(!!value);
    animateLabel(value ? 1 : 0);
  }, [value]);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const handleFocus = () => {
    setIsFocused(true);
    animateLabel(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value) {
      animateLabel(0);
    }
  };

  const handleTextChange = (text) => {
    onChangeText(text);
    if (text && !isFocused) {
      animateLabel(1);
    } else if (!text && !isFocused) {
      animateLabel(0);
    }
  };

  const animateLabel = (toValue) => {
    Animated.timing(labelAnimation, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const labelStyle = {
    position: 'absolute',
    left: 16,
    top: labelAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [20, -6],
    }),
    fontSize: labelAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: isFocused ? '#4ADE80' : error ? '#F87171' : '#9CA3AF',
    backgroundColor: isFocused ? '#0F0F0F' : 'transparent',
    paddingHorizontal: isFocused ? 8 : 0,
    paddingVertical: isFocused ? 2 : 0,
    borderRadius: isFocused ? 12 : 0,
    zIndex: 1,
  };

  const inputStyle = [
    styles.input,
    error && styles.inputError,
    isFocused && styles.inputFocused,
    showPasswordToggle && styles.inputWithIcon,
  ];

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        {label && (
          <Animated.Text style={[styles.label, labelStyle]}>
            {label}
          </Animated.Text>
        )}
        <TextInput
          style={inputStyle}
          placeholder={isFocused ? placeholder : ''}
          placeholderTextColor="#6B7280"
          value={value}
          onChangeText={handleTextChange}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={togglePasswordVisibility}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color="#A3A3A3"
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
    height: 56,
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#1A1A1A',
    color: '#FFFFFF',
    height: 56,
  },
  inputWithIcon: {
    paddingRight: 50,
  },
  inputFocused: {
    borderColor: '#4ADE80',
    borderWidth: 2,
  },
  inputError: {
    borderColor: '#F87171',
    borderWidth: 2,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    marginTop: 8,
  },
});

export default Input;
