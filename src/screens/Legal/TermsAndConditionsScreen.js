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

const TermsAndConditionsScreen = ({ navigation }) => {
  const sections = [
    {
      title: '1. Aceptación de los Términos',
      content: `Al descargar, instalar o usar la aplicación Mapu, aceptas estar sujeto a estos Términos y Condiciones. Si no estás de acuerdo con alguno de estos términos, no debes usar nuestra aplicación.

Definiciones:
• "Mapu", "nosotros", "nuestra" se refiere a la aplicación y sus desarrolladores
• "Usuario", "tú", "tu" se refiere a cualquier persona que use la aplicación
• "Servicio" se refiere a todas las funcionalidades de la aplicación Mapu
• "Contenido" incluye texto, imágenes, reseñas, calificaciones y cualquier información compartida`,
    },
    {
      title: '2. Descripción del Servicio',
      content: `Mapu es una aplicación móvil que conecta a turistas con centros turísticos en Nicaragua.

Funcionalidades Principales:
• Descubrimiento de centros turísticos cercanos
• Información detallada sobre cada centro
• Sistema de reseñas y calificaciones
• Reservas y contactos directos
• Mapas interactivos y navegación
• Notificaciones de ofertas especiales

Objetivo:
Facilitar el turismo en Nicaragua promoviendo el descubrimiento de nuevos destinos y experiencias auténticas locales.`,
    },
    {
      title: '3. Registro y Cuenta de Usuario',
      content: `Para usar ciertas funcionalidades, debes crear una cuenta.

Información Requerida:
• Nombre completo
• Email válido
• Contraseña segura
• Ubicación (opcional, para recomendaciones)

Responsabilidades del Usuario:
• Proporcionar información veraz y actualizada
• Mantener la confidencialidad de tu cuenta
• Notificar inmediatamente cualquier uso no autorizado
• Ser responsable de todas las actividades en tu cuenta

Prohibiciones:
• Crear múltiples cuentas
• Compartir credenciales de acceso
• Usar información falsa o de terceros
• Crear cuentas para menores sin supervisión`,
    },
    {
      title: '4. Uso Aceptable',
      content: `Al usar Mapu, te comprometes a:

Uso Responsable:
• Respetar a otros usuarios y centros turísticos
• Proporcionar reseñas honestas y constructivas
• Usar el servicio solo para fines legítimos
• Respetar la propiedad intelectual

Contenido Prohibido:
• Información falsa o engañosa
• Contenido ofensivo, discriminatorio o ilegal
• Spam o publicidad no autorizada
• Violación de derechos de terceros
• Contenido que promueva actividades ilegales

Consecuencias:
• Advertencia por primera infracción
• Suspensión temporal de la cuenta
• Eliminación permanente de la cuenta
• Acciones legales si es necesario`,
    },
    {
      title: '5. Reseñas y Calificaciones',
      content: `El sistema de reseñas es fundamental para la comunidad Mapu.

Directrices para Reseñas:
• Basadas en experiencias reales
• Constructivas y respetuosas
• Específicas y detalladas
• Actualizadas y relevantes

Prohibiciones:
• Reseñas falsas o pagadas
• Ataques personales o difamación
• Contenido promocional no autorizado
• Reseñas de competidores con malicia

Moderación:
• Revisamos todas las reseñas
• Eliminamos contenido inapropiado
• Investigamos denuncias de abuso
• Protegemos la integridad del sistema`,
    },
    {
      title: '6. Propiedad Intelectual',
      content: `Todos los derechos de propiedad intelectual pertenecen a Mapu o sus licenciantes.

Contenido de Mapu:
• Diseño y funcionalidades de la app
• Base de datos de centros turísticos
• Algoritmos de recomendación
• Marcas comerciales y logos

Contenido del Usuario:
• Tú conservas los derechos de tu contenido
• Nos otorgas licencia para usarlo en la app
• Puedes eliminar tu contenido en cualquier momento
• Respetamos tus derechos de autor

Uso Permitido:
• Uso personal y no comercial
• Compartir en redes sociales (con atribución)
• Referencias educativas o informativas
• Uso conforme a estos términos`,
    },
    {
      title: '7. Privacidad y Protección de Datos',
      content: `Tu privacidad es importante para nosotros.

Recopilación de Datos:
• Solo recopilamos datos necesarios
• Siempre con tu consentimiento
• Transparente sobre el uso
• Cumplimos con las leyes de privacidad

Uso de Datos:
• Mejorar nuestros servicios
• Personalizar tu experiencia
• Comunicarnos contigo
• Análisis y estadísticas (anónimas)

Protección:
• Cifrado de datos sensibles
• Acceso limitado al personal autorizado
• Monitoreo de seguridad continuo
• No vendemos tu información personal`,
    },
    {
      title: '8. Limitación de Responsabilidad',
      content: `Mapu se proporciona "tal como está" sin garantías.

Limitaciones:
• No garantizamos disponibilidad 100%
• No somos responsables de decisiones de viaje
• No controlamos la calidad de los centros turísticos
• No garantizamos la exactitud de toda la información

Exclusiones:
• Daños indirectos o consecuenciales
• Pérdida de datos o interrupciones
• Problemas con terceros (centros turísticos)
• Decisiones basadas en nuestras recomendaciones

Tu Responsabilidad:
• Verificar información antes de viajar
• Contactar directamente con los centros
• Tomar decisiones informadas
• Respetar las políticas de los centros turísticos`,
    },
    {
      title: '9. Modificaciones del Servicio',
      content: `Nos reservamos el derecho de modificar el servicio.

Cambios Posibles:
• Nuevas funcionalidades
• Mejoras en la interfaz
• Actualizaciones de seguridad
• Cambios en algoritmos de recomendación

Notificación:
• Te informaremos sobre cambios importantes
• Actualizaciones automáticas de la app
• Avisos en la aplicación
• Comunicación por email si es necesario

Continuidad:
• El uso continuado implica aceptación
• Puedes discontinuar el uso en cualquier momento
• Mantenemos versiones anteriores por tiempo limitado
• Migración gradual de funcionalidades`,
    },
    {
      title: '10. Terminación',
      content: `Puedes terminar tu cuenta en cualquier momento.

Terminación por el Usuario:
• Eliminar cuenta desde la configuración
• Contactar soporte para eliminación completa
• Exportar datos antes de eliminar
• Proceso simple y transparente

Terminación por Mapu:
• Violación de estos términos
• Actividad fraudulenta o abusiva
• Uso no autorizado de la aplicación
• Requisitos legales o regulatorios

Efectos de la Terminación:
• Acceso inmediato revocado
• Datos eliminados según política de privacidad
• Reseñas pueden mantenerse (anónimas)
• No hay reembolsos por servicios gratuitos`,
    },
    {
      title: '11. Ley Aplicable y Jurisdicción',
      content: `Estos términos se rigen por las leyes de Nicaragua.

Jurisdicción:
• Tribunales de Managua, Nicaragua
• Ley nicaragüense aplicable
• Resolución de disputas local
• Cumplimiento de regulaciones locales

Resolución de Disputas:
• Primero: Negociación directa
• Segundo: Mediación
• Tercero: Arbitraje si es necesario
• Último recurso: Tribunales

Cumplimiento:
• Respetamos las leyes locales
• Cumplimos regulaciones de turismo
• Protegemos datos según normativas
• Cooperamos con autoridades competentes`,
    },
    {
      title: '12. Contacto y Soporte',
      content: `Para preguntas sobre estos términos:

Información de Contacto:
• Email: legal@mapu.com
• Teléfono: +505 1234-5678
• Dirección: Managua, Nicaragua
• Horario: Lunes a Viernes, 8:00 AM - 6:00 PM

Soporte Técnico:
• Email: soporte@mapu.com
• WhatsApp: +505 1234-5678
• Chat en la aplicación
• Centro de ayuda online

Tiempo de Respuesta:
• Consultas generales: 24-48 horas
• Problemas técnicos: 24 horas
• Emergencias: 4 horas
• Solicitudes legales: 72 horas`,
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
        <Text style={styles.headerTitle}>Términos y Condiciones</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.introTitle}>Términos y Condiciones de Mapu</Text>
          <Text style={styles.introSubtitle}>
            Última actualización: {new Date().toLocaleDateString('es-ES')}
          </Text>
          <Text style={styles.introText}>
            Bienvenido a Mapu, la aplicación que conecta a turistas con los mejores centros turísticos 
            de Nicaragua. Estos términos y condiciones rigen el uso de nuestra aplicación y servicios.
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
            Al usar Mapu, confirmas que has leído, entendido y aceptado estos Términos y Condiciones.
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
    borderLeftColor: '#3B82F6',
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

export default TermsAndConditionsScreen;
