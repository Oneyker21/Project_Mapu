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

const PrivacyPolicyScreen = ({ navigation }) => {
  const sections = [
    {
      title: '1. Información que Recopilamos',
      content: `Recopilamos información necesaria para brindarte la mejor experiencia:

• Datos personales (nombre, email, foto de perfil)
• Ubicación (con tu consentimiento)
• Reseñas y calificaciones que publiques
• Centros turísticos que visites y marques como favoritos`,
    },
    {
      title: '2. Cómo Utilizamos tu Información',
      content: `Utilizamos tu información para:

• Mostrarte centros turísticos relevantes cerca de ti
• Personalizar recomendaciones
• Facilitar contactos con centros turísticos
• Mejorar la aplicación`,
    },
    {
      title: '3. Compartir Información',
      content: `No vendemos tu información personal. Solo compartimos:

• Reseñas públicas que publiques
• Información de contacto cuando realices reservas
• Datos con proveedores de servicios (Google Maps, Firebase)`,
    },
    {
      title: '4. Seguridad',
      content: `Protegemos tu información con:

• Cifrado de datos
• Acceso limitado al personal autorizado
• Monitoreo continuo de seguridad
• Copias de seguridad regulares`,
    },
    {
      title: '5. Tus Derechos',
      content: `Tienes derecho a:

• Acceder a tus datos personales
• Actualizar o corregir tu información
• Solicitar la eliminación de tu cuenta
• Retirar el consentimiento en cualquier momento

Contacto: privacidad@mapu.com`,
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
    borderLeftColor: colors.success,
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

export default PrivacyPolicyScreen;
