import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REGISTRATION_PROGRESS_KEY = 'registration_progress';

export const useRegistrationProgress = () => {
  const [registrationData, setRegistrationData] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Cargar progreso guardado al inicializar
  useEffect(() => {
    loadSavedProgress();
  }, []);

  const loadSavedProgress = async () => {
    try {
      const savedProgress = await AsyncStorage.getItem(REGISTRATION_PROGRESS_KEY);
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        setRegistrationData(progress.data);
        setCurrentStep(progress.step);
      }
    } catch (error) {
      console.error('Error loading registration progress:', error);
    }
  };

  const saveProgress = async (step, data) => {
    try {
      const progress = {
        step,
        data,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(REGISTRATION_PROGRESS_KEY, JSON.stringify(progress));
      setCurrentStep(step);
      setRegistrationData(data);
    } catch (error) {
      console.error('Error saving registration progress:', error);
    }
  };

  const clearProgress = async () => {
    try {
      await AsyncStorage.removeItem(REGISTRATION_PROGRESS_KEY);
      setRegistrationData(null);
      setCurrentStep(1);
    } catch (error) {
      console.error('Error clearing registration progress:', error);
    }
  };

  const canNavigateToStep = (targetStep) => {
    // Permite navegación hacia atrás y al paso actual/siguiente válido
    return targetStep <= currentStep || targetStep === currentStep + 1;
  };

  return {
    registrationData,
    currentStep,
    saveProgress,
    clearProgress,
    canNavigateToStep,
    loadSavedProgress
  };
};
