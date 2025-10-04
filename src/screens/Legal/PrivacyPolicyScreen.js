import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const PrivacyPolicyScreen = ({ navigation }) => {
  const sections = [
    {
      title: '1. Información que Recopilamos',
      content: `Mapu recopila información necesaria para brindarte la mejor experiencia en el descubrimiento de centros turísticos en Nicaragua.

Información Personal:
• Nombre completo y datos de contacto
• Información de perfil (foto, descripción)
• Preferencias de viaje y intereses turísticos
• Ubicación actual (con tu consentimiento)

Información de Uso:
• Centros turísticos visitados y favoritos
• Reseñas y calificaciones que publiques
• Búsquedas realizadas en la aplicación
• Interacciones con el contenido (likes, comentarios)

Información Técnica:
• Dirección IP y datos del dispositivo
• Sistema operativo y versión de la app
• Logs de uso y errores técnicos`,
    },
    {
      title: '2. Cómo Utilizamos tu Información',
      content: `Utilizamos tu información para:

Servicios Principales:
• Mostrarte centros turísticos relevantes cerca de ti
• Personalizar recomendaciones basadas en tus intereses
• Facilitar reservas y contactos con centros turísticos
• Permitir que publiques reseñas y calificaciones

Mejora del Servicio:
• Analizar patrones de uso para mejorar la app
• Desarrollar nuevas funcionalidades
• Optimizar la experiencia de usuario
• Realizar estudios de mercado (datos anónimos)

Comunicación:
• Enviarte notificaciones sobre ofertas especiales
• Informarte sobre nuevos centros turísticos en tu área
• Recordarte eventos y promociones relevantes`,
    },
    {
      title: '3. Compartir Información',
      content: `No vendemos tu información personal. Compartimos datos únicamente en estos casos:

Con Centros Turísticos:
• Información de contacto cuando realizas una reserva
• Reseñas y calificaciones que publiques (públicamente)
• Preferencias para personalizar tu experiencia

Con Proveedores de Servicios:
• Servicios de mapas (Google Maps) para mostrar ubicaciones
• Servicios de almacenamiento en la nube (Firebase)
• Servicios de análisis para mejorar la app

Con Autoridades:
• Cuando sea requerido por ley
• Para proteger nuestros derechos legales
• En casos de emergencia o seguridad`,
    },
    {
      title: '4. Seguridad de Datos',
      content: `Protegemos tu información con:

Medidas Técnicas:
• Cifrado de datos en tránsito y en reposo
• Autenticación de dos factores disponible
• Monitoreo continuo de seguridad
• Copias de seguridad regulares

Medidas Organizacionales:
• Acceso limitado solo a personal autorizado
• Capacitación regular en privacidad y seguridad
• Políticas estrictas de manejo de datos
• Auditorías de seguridad periódicas

Tu Responsabilidad:
• Mantén tu contraseña segura
• No compartas tu cuenta con otros
• Cierra sesión en dispositivos compartidos
• Reporta cualquier actividad sospechosa`,
    },
    {
      title: '5. Tus Derechos',
      content: `Tienes derecho a:

Acceso y Portabilidad:
• Solicitar una copia de tus datos personales
• Exportar tu información en formato legible
• Verificar qué información tenemos sobre ti

Control y Modificación:
• Actualizar o corregir tu información
• Cambiar tus preferencias de privacidad
• Desactivar notificaciones no deseadas

Eliminación:
• Solicitar la eliminación de tu cuenta
• Borrar reseñas y contenido publicado
• Retirar el consentimiento en cualquier momento

Para ejercer estos derechos, contacta a: privacidad@mapu.com`,
    },
    {
      title: '6. Cookies y Tecnologías Similares',
      content: `Utilizamos tecnologías para mejorar tu experiencia:

Cookies Esenciales:
• Mantener tu sesión activa
• Recordar tus preferencias
• Garantizar la seguridad de la app

Cookies de Análisis:
• Entender cómo usas la app
• Identificar problemas técnicos
• Mejorar el rendimiento

Cookies de Personalización:
• Mostrar contenido relevante
• Recordar tus búsquedas anteriores
• Personalizar recomendaciones

Puedes gestionar estas preferencias en la configuración de tu dispositivo.`,
    },
    {
      title: '7. Menores de Edad',
      content: `Mapu no está dirigida a menores de 13 años.

Si eres menor de 18 años:
• Necesitas el consentimiento de tus padres
• Debes tener supervisión adulta
• No debes compartir información personal

Si descubrimos que recopilamos datos de menores:
• Eliminaremos la información inmediatamente
• Notificaremos a los padres si es posible
• Tomaremos medidas para prevenir futuras recopilaciones

Los padres pueden contactarnos para:
• Solicitar la eliminación de datos de sus hijos
• Revisar qué información tenemos
• Establecer restricciones adicionales`,
    },
    {
      title: '8. Cambios en esta Política',
      content: `Podemos actualizar esta política ocasionalmente.

Notificaciones de Cambios:
• Te informaremos por email sobre cambios importantes
• Mostraremos un aviso en la app
• Actualizaremos la fecha de "última modificación"

Cambios Menores:
• Correcciones de errores tipográficos
• Aclaraciones de lenguaje
• Actualizaciones de información de contacto

Tu Continuidad:
• El uso continuado implica aceptación de cambios
• Puedes revisar la política actualizada en cualquier momento
• Tienes derecho a discontinuar el uso si no estás de acuerdo`,
    },
    {
      title: '9. Contacto',
      content: `Para preguntas sobre privacidad:

Email: privacidad@mapu.com
Teléfono: +505 1234-5678
Dirección: Managua, Nicaragua

Horario de Atención:
Lunes a Viernes: 8:00 AM - 6:00 PM
Sábados: 9:00 AM - 2:00 PM

Tiempo de Respuesta:
• Consultas generales: 24-48 horas
• Solicitudes de datos: 7 días hábiles
• Quejas de privacidad: 72 horas

También puedes contactarnos a través de la app en la sección "Configuraciones > Contactar Soporte".`,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Política de Privacidad</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.introTitle}>Política de Privacidad de Mapu</Text>
          <Text style={styles.introSubtitle}>
            Última actualización: {new Date().toLocaleDateString('es-ES')}
          </Text>
          <Text style={styles.introText}>
            En Mapu, valoramos tu privacidad y nos comprometemos a proteger tu información personal. 
            Esta política explica cómo recopilamos, utilizamos y protegemos tus datos cuando usas nuestra 
            aplicación para descubrir centros turísticos en Nicaragua.
          </Text>
        </View>

        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Al usar Mapu, aceptas los términos de esta Política de Privacidad.
          </Text>
          <Text style={styles.footerDate}>
            Versión 1.0 - {new Date().getFullYear()}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  intro: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
  footer: {
    backgroundColor: '#F3F4F6',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  footerDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default PrivacyPolicyScreen;
