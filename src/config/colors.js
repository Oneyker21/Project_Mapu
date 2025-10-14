// Centralized color palette for the app
// Keep keys stable because many screens import these tokens

export const colors = {
  // Brand
  primary: '#4ADE80', // green accent used across the app
  secondary: '#DAA621', // golden accent seen in dividers/borders
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',

  // Surfaces
  background: '#0F0F0F', // app background (dark theme)
  surface: '#1A1A1A', // cards, headers, containers
  border: '#2A2A2A',

  // Text
  text: {
    primary: '#FFFFFF',
    muted: '#9CA3AF',
  },

  // Inputs and UI elements
  input: {
    background: '#111827', // used in search inputs and fields
  },

  // Shadows and effects
  shadow: {
    // Use brand color glow by default, adjust if needed per platform
    primary: '#4ADE80',
  },
};
