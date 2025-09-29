// Validaciones para el formulario de registro

export const validateName = (name) => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, message: 'El nombre es requerido' };
  }
  if (name.trim().length < 2) {
    return { isValid: false, message: 'El nombre debe tener al menos 2 caracteres' };
  }
  if (name.trim().length > 50) {
    return { isValid: false, message: 'El nombre no puede exceder 50 caracteres' };
  }
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name.trim())) {
    return { isValid: false, message: 'El nombre solo puede contener letras y espacios' };
  }
  return { isValid: true, message: '' };
};

export const validateLastName = (lastName) => {
  if (!lastName || lastName.trim().length === 0) {
    return { isValid: false, message: 'El apellido es requerido' };
  }
  if (lastName.trim().length < 2) {
    return { isValid: false, message: 'El apellido debe tener al menos 2 caracteres' };
  }
  if (lastName.trim().length > 50) {
    return { isValid: false, message: 'El apellido no puede exceder 50 caracteres' };
  }
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(lastName.trim())) {
    return { isValid: false, message: 'El apellido solo puede contener letras y espacios' };
  }
  return { isValid: true, message: '' };
};

export const validateEmail = (email) => {
  if (!email || email.trim().length === 0) {
    return { isValid: false, message: 'El email es requerido' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, message: 'El email no es válido' };
  }
  return { isValid: true, message: '' };
};

// Sistema de validación de seguridad de contraseña
export const getPasswordSecurity = (password) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  
  let strength = 'muy débil';
  let color = '#EF4444';
  let percentage = (passedChecks / totalChecks) * 100;

  if (passedChecks >= 4) {
    strength = 'fuerte';
    color = '#10B981';
  } else if (passedChecks >= 3) {
    strength = 'media';
    color = '#F59E0B';
  } else if (passedChecks >= 2) {
    strength = 'débil';
    color = '#EF4444';
  }

  return {
    checks,
    strength,
    color,
    percentage,
    passedChecks,
    totalChecks,
  };
};

export const validatePassword = (password) => {
  if (!password || password.length === 0) {
    return { isValid: false, message: 'La contraseña es requerida' };
  }
  if (password.length < 6) {
    return { isValid: false, message: 'La contraseña debe tener al menos 6 caracteres' };
  }
  return { isValid: true, message: '' };
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword || confirmPassword.length === 0) {
    return { isValid: false, message: 'Confirma tu contraseña' };
  }
  if (password !== confirmPassword) {
    return { isValid: false, message: 'Las contraseñas no coinciden' };
  }
  return { isValid: true, message: '' };
};

export const validatePhone = (phone) => {
  if (!phone || phone.trim().length === 0) {
    return { isValid: false, message: 'El número de teléfono es requerido' };
  }
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,15}$/;
  if (!phoneRegex.test(phone.trim())) {
    return { isValid: false, message: 'El número de teléfono no es válido' };
  }
  return { isValid: true, message: '' };
};

export const validateNationality = (nationality) => {
  if (!nationality || nationality.trim().length === 0) {
    return { isValid: false, message: 'La nacionalidad es requerida' };
  }
  if (nationality.trim().length < 2) {
    return { isValid: false, message: 'La nacionalidad debe tener al menos 2 caracteres' };
  }
  return { isValid: true, message: '' };
};

export const validateResidence = (residence) => {
  if (!residence || residence.trim().length === 0) {
    return { isValid: false, message: 'La residencia es requerida' };
  }
  if (residence.trim().length < 2) {
    return { isValid: false, message: 'La residencia debe tener al menos 2 caracteres' };
  }
  return { isValid: true, message: '' };
};

export const validateDocumentType = (documentType) => {
  if (!documentType || documentType.trim().length === 0) {
    return { isValid: false, message: 'El tipo de documento es requerido' };
  }
  const validTypes = ['cedula', 'pasaporte'];
  if (!validTypes.includes(documentType)) {
    return { isValid: false, message: 'Tipo de documento no válido' };
  }
  return { isValid: true, message: '' };
};

export const validateDocumentNumber = (documentNumber, documentType) => {
  if (!documentNumber || documentNumber.trim().length === 0) {
    return { isValid: false, message: 'El número de documento es requerido' };
  }

  if (documentType === 'cedula') {
    // Validar formato de cédula: ###-######-####A-Z (4 dígitos + 1 letra al final)
    const cedulaRegex = /^\d{3}-\d{6}-\d{4}[A-Z]$/;
    if (!cedulaRegex.test(documentNumber.trim())) {
      return { isValid: false, message: 'Formato de cédula inválido. Use: ###-######-####A-Z' };
    }
  } else if (documentType === 'pasaporte') {
    // Validar formato de pasaporte (más flexible)
    const pasaporteRegex = /^[A-Z0-9]{6,12}$/;
    if (!pasaporteRegex.test(documentNumber.trim())) {
      return { isValid: false, message: 'Formato de pasaporte inválido. Use solo letras y números' };
    }
  }

  return { isValid: true, message: '' };
};

// Función para formatear automáticamente la cédula
export const formatCedula = (value) => {
  // Remover todos los caracteres no numéricos excepto la última letra
  let cleanValue = value.replace(/[^0-9A-Z]/g, '');
  
  // Si tiene más de 14 caracteres, truncar (13 números + 1 letra)
  if (cleanValue.length > 14) {
    cleanValue = cleanValue.substring(0, 14);
  }
  
  // Separar números de la letra
  const numbers = cleanValue.replace(/[^0-9]/g, '');
  const letter = cleanValue.replace(/[^A-Z]/g, '');
  
  let formatted = '';
  
  // Formatear números con guiones: ###-######-####
  if (numbers.length > 0) {
    if (numbers.length <= 3) {
      formatted = numbers;
    } else if (numbers.length <= 9) {
      formatted = numbers.substring(0, 3) + '-' + numbers.substring(3);
    } else {
      // Formato completo: ###-######-####
      formatted = numbers.substring(0, 3) + '-' + numbers.substring(3, 9) + '-' + numbers.substring(9, 13);
    }
  }
  
  // Agregar la letra al final si existe
  if (letter) {
    formatted += letter;
  }
  
  return formatted;
};