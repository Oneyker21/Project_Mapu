// Paleta de colores centralizada para toda la aplicación
// Basada en el tema turístico modo oscuro del LoginScreen

export const colors = {
  // Colores principales
  primary: '#4ADE80',        // Verde brillante principal
  secondary: '#DAA621',      // Dorado/Oro
  background: '#0F0F0F',     // Negro muy oscuro
  surface: '#1A1A1A',        // Fondo secundario
  
  // Texto
  text: {
    primary: '#FFFFFF',      // Blanco principal
    secondary: '#4ADE80',    // Verde para texto secundario
    muted: '#9CA3AF',        // Gris para texto deshabilitado
    error: '#F87171',        // Rojo para errores
  },
  
  // Estados
  error: '#EF4444',          // Rojo para errores
  success: '#4ADE80',        // Verde para éxito
  warning: '#DAA621',        // Dorado para advertencias
  info: '#3B82F6',           // Azul para información
  
  // Bordes y divisores
  border: '#DAA621',         // Dorado para bordes
  divider: '#2D1B1B',        // Gris oscuro para divisores
  
  // Sombras y efectos
  shadow: {
    primary: '#4ADE80',      // Sombra verde
    secondary: '#DAA621',    // Sombra dorada
  },
  
  // Overlay y transparencias
  overlay: 'rgba(15, 15, 15, 0.95)',  // Overlay semi-transparente
  overlayDark: 'rgba(0, 0, 0, 0.5)',  // Overlay más oscuro
  
  // Gradientes (para uso futuro)
  gradient: {
    primary: ['#4ADE80', '#22C55E'],    // Gradiente verde
    secondary: ['#DAA621', '#B8860B'],  // Gradiente dorado
    background: ['#0F0F0F', '#1A1A1A'], // Gradiente de fondo
  },
  
  // Estados de botones
  button: {
    primary: '#4ADE80',      // Botón principal
    primaryPressed: '#22C55E', // Botón principal presionado
    secondary: '#1A1A1A',    // Botón secundario
    secondaryBorder: '#DAA621', // Borde botón secundario
    disabled: '#374151',     // Botón deshabilitado
    text: '#FFFFFF',         // Texto de botones
  },
  
  // Inputs
  input: {
    background: '#1A1A1A',   // Fondo de inputs
    border: '#DAA621',       // Borde de inputs
    borderFocused: '#4ADE80', // Borde cuando está enfocado
    placeholder: '#9CA3AF',  // Texto placeholder
    text: '#FFFFFF',         // Texto de input
  },
  
  // Cards y contenedores
  card: {
    background: '#1A1A1A',   // Fondo de tarjetas
    border: '#2D1B1B',       // Borde de tarjetas
    shadow: '#000000',       // Sombra de tarjetas
  },
};

// Función helper para obtener colores con opacidad
export const withOpacity = (color, opacity) => {
  // Si el color ya incluye rgba, lo mantenemos
  if (color.includes('rgba')) return color;
  
  // Convertir hex a rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default colors;
