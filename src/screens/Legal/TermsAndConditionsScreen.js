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
import colors from '../../config/colors';

const TermsAndConditionsScreen = ({ navigation }) => {
  const sections = [
    {
      title: '1. Aceptación de los Términos',
      content: `Al usar Mapu, aceptas estos términos. Si no estás de acuerdo, no uses la aplicación.

• "Mapu" se refiere a la aplicación y sus desarrolladores
• "Usuario" se refiere a cualquier persona que use la aplicación
• "Servicio" incluye todas las funcionalidades de Mapu`,
    },
    {
      title: '2. Descripción del Servicio',
      content: `Mapu conecta turistas con centros turísticos en Nicaragua.

Funcionalidades:
• Descubrimiento de centros turísticos cercanos
• Información detallada sobre cada centro
• Sistema de reseñas y calificaciones
• Mapas interactivos y navegación`,
    },
    {
      title: '3. Cuenta de Usuario',
      content: `Para usar ciertas funcionalidades, debes crear una cuenta.

Responsabilidades:
• Proporcionar información veraz
• Mantener la confidencialidad de tu cuenta
• Ser responsable de todas las actividades

Prohibido:
• Crear múltiples cuentas
• Compartir credenciales
• Usar información falsa`,
    },
    {
      title: '4. Uso Aceptable',
      content: `Al usar Mapu, te comprometes a:

• Respetar a otros usuarios y centros turísticos
• Proporcionar reseñas honestas
• Usar el servicio solo para fines legítimos

Prohibido:
• Información falsa o engañosa
• Contenido ofensivo o ilegal
• Spam o publicidad no autorizada`,
    },
    {
      title: '5. Reseñas y Calificaciones',
      content: `Directrices para reseñas:

• Basadas en experiencias reales
• Constructivas y respetuosas
• Específicas y detalladas

Prohibido:
• Reseñas falsas o pagadas
• Ataques personales
• Contenido promocional no autorizado`,
    },
    {
      title: '6. Limitación de Responsabilidad',
      content: `Mapu se proporciona "tal como está" sin garantías.

• No garantizamos disponibilidad 100%
• No somos responsables de decisiones de viaje
• No controlamos la calidad de los centros turísticos

Tu responsabilidad:
• Verificar información antes de viajar
• Contactar directamente con los centros`,
    },
    {
      title: '7. Contacto',
      content: `Para preguntas sobre estos términos:

• Email: legal@mapu.com
• Teléfono: +505 1234-5678
• Dirección: Managua, Nicaragua

Horario: Lunes a Viernes, 8:00 AM - 6:00 PM`,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
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
    backgroundColor: colors.surface,
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 14,
    color: colors.text.muted,
    marginBottom: 16,
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.primary,
  },
  section: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.primary,
  },
  footer: {
    backgroundColor: colors.background,
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: 8,
  },
  footerDate: {
    fontSize: 12,
    color: colors.text.muted,
  },
});

export default TermsAndConditionsScreen;
