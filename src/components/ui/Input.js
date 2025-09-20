import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
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
  const [isFocused, setIsFocused] = useState(false);
  const [labelAnimation] = useState(new Animated.Value(value ? 1 : 0));

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
      outputRange: [20, -8],
    }),
    fontSize: labelAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: isFocused ? '#3B82F6' : error ? '#EF4444' : '#6B7280',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 4,
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
          placeholderTextColor="#9CA3AF"
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
              color="#6B7280"
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
    marginBottom: 20,
  },
  label: {
    fontWeight: '500',
  },
  inputContainer: {
    position: 'relative',
    height: 56,
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#111827',
    height: 56,
    textAlignVertical: 'center',
  },
  inputWithIcon: {
    paddingRight: 50,
  },
  inputFocused: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: '#EF4444',
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
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default Input;
