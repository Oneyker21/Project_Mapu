# 📱 Guía de SafeAreaView para React Native con Expo

## 🚀 Instalación

```bash
npx expo install react-native-safe-area-context
```

## 📖 Uso Básico

### 1. Importar las dependencias necesarias

```javascript
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
```

### 2. Usar useSafeAreaInsets en el componente

```javascript
const MyComponent = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { 
          paddingTop: insets.top, 
          paddingBottom: insets.bottom 
        }
      ]} 
      edges={[]}
    >
      {/* Tu contenido aquí */}
    </SafeAreaView>
  );
};
```

## 🎯 Configuración Recomendada

### Para pantallas con ScrollView:

```javascript
const ScrollScreen = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { 
          paddingTop: insets.top, 
          paddingBottom: insets.bottom 
        }
      ]} 
      edges={[]}
    >
      {/* Header fijo */}
      <View style={styles.header}>
        <Text>Mi Header</Text>
      </View>

      {/* Contenido con scroll */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 } // Espacio extra
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Tu contenido scrolleable */}
      </ScrollView>

      {/* Footer fijo */}
      <View style={[
        styles.footer,
        { paddingBottom: insets.bottom }
      ]}>
        {/* Tu footer */}
      </View>
    </SafeAreaView>
  );
};
```

## 🔧 Estilos Recomendados

```javascript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});
```

## ⚠️ Problemas Comunes y Soluciones

### 1. Contenido se superpone con la barra de estado
**Problema**: El contenido aparece detrás de la barra de estado superior.
**Solución**: Usar `paddingTop: insets.top` en el SafeAreaView.

### 2. Contenido se superpone con la barra de navegación inferior
**Problema**: El contenido aparece detrás de los botones de navegación.
**Solución**: Usar `paddingBottom: insets.bottom` en el SafeAreaView.

### 3. ScrollView no respeta las safe areas
**Problema**: Al hacer scroll, el contenido se superpone con las barras del sistema.
**Solución**: Agregar `paddingBottom: insets.bottom + 20` al `contentContainerStyle` del ScrollView.

### 4. Footer se superpone con la barra de navegación
**Problema**: El footer aparece detrás de los botones de navegación.
**Solución**: Agregar `paddingBottom: insets.bottom` al footer.

## 🎨 Ejemplo Completo

Ver el archivo `src/examples/SafeAreaExample.js` para un ejemplo completo de implementación.

## 📱 Dispositivos Soportados

- ✅ iPhone (con y sin notch)
- ✅ Android (con y sin navegación por gestos)
- ✅ Tablets
- ✅ Dispositivos con diferentes tamaños de pantalla

## 🔍 Debugging

Para verificar que las safe areas se están aplicando correctamente:

```javascript
const MyComponent = () => {
  const insets = useSafeAreaInsets();
  
  console.log('Safe Area Insets:', {
    top: insets.top,
    bottom: insets.bottom,
    left: insets.left,
    right: insets.right,
  });
  
  // ... resto del componente
};
```

## 🚀 Mejores Prácticas

1. **Siempre usar `edges={[]}`** cuando uses insets manuales
2. **Agregar padding extra** al ScrollView para evitar que el contenido se pegue al borde
3. **Probar en diferentes dispositivos** para asegurar compatibilidad
4. **Usar `useSafeAreaInsets`** en lugar de valores fijos
5. **Considerar el teclado** en pantallas con inputs (usar KeyboardAvoidingView)

## 📚 Recursos Adicionales

- [Documentación oficial de react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context)
- [Expo Safe Area Context](https://docs.expo.dev/versions/latest/sdk/safe-area-context/)
- [React Native Safe Area Guide](https://reactnative.dev/docs/safeareaview)
