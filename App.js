import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import Maps from './src/utils/MapViewLeaflet';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <Maps />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
