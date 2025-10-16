import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../config/colors';

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
      <View style={styles.horizontalLayout}>
        {currentTitle && (
          <Text style={styles.currentStepTitle}>{currentTitle}</Text>
        )}
        <View style={styles.stepsRow}>
          {Array.from({ length: totalSteps }, (_, index) => renderStep(index + 1))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 8,
  },
  horizontalLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepCircleCurrent: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.muted,
  },
  stepNumberActive: {
    color: colors.text.primary,
  },
  stepLine: {
    width: 28,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 6,
    borderRadius: 1,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  currentStepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'left',
    marginRight: 16,
  },
});

export default Stepper;
