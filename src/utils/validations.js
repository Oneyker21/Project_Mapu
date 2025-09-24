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
