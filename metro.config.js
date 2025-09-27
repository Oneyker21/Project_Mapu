const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configurar alias para react-native-maps en web
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native-maps': require.resolve('./src/utils/MapWebFallback.js'),
};

module.exports = config;
