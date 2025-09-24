import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Stepper = ({ currentStep, totalSteps, stepTitles = [] }) => {
  const renderStep = (stepNumber) => {
    const isActive = stepNumber <= currentStep;
    const isCurrent = stepNumber === currentStep;
    
    return (
      <View key={stepNumber} style={styles.stepContainer}>
        <View style={[
          styles.stepCircle,
          isActive && styles.stepCircleActive,
          isCurrent && styles.stepCircleCurrent
        ]}>
          <Text style={[
            styles.stepNumber,
            isActive && styles.stepNumberActive
          ]}>
            {stepNumber}
          </Text>
        </View>
        {stepNumber < totalSteps && (
          <View style={[
            styles.stepLine,
            isActive && styles.stepLineActive
          ]} />
        )}
      </View>
    );
  };

  const currentTitle = stepTitles[currentStep - 1] || '';

  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {Array.from({ length: totalSteps }, (_, index) => renderStep(index + 1))}
      </View>
      {currentTitle && (
        <Text style={styles.currentStepTitle}>{currentTitle}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  stepCircleActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  stepCircleCurrent: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#3B82F6',
  },
  currentStepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginTop: 12,
    textAlign: 'left',
    alignSelf: 'flex-start',
    width: '100%',
  },
});

export default Stepper;
