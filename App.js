import React from 'react';
import { LoginScreen } from './src/screens/Auth';
import { Map } from './src/components/map/Map';

export default function App() {
  return <Map />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
