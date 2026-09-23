import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { session } from "@/services/cloudClient";
import { palette, radius, shadow } from "@/styles/design";

const validarCorreo = (valor: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);

export default function AccessScreen() {
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [revisandoSesion, setRevisandoSesion] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(session, (currentUser) => {
      if (currentUser) {
        router.replace("/panel");
      }
      setRevisandoSesion(false);
    });

    return unsubscribe;
  }, []);

  const entrar = async () => {
    const correoLimpio = correo.trim().toLowerCase();

    if (!correoLimpio || !clave) {
      Alert.alert("Faltan datos", "Completa tu correo y contraseña para continuar.");
      return;
    }

    if (!validarCorreo(correoLimpio)) {
      Alert.alert("Correo inválido", "Escribe un correo completo, por ejemplo: nombre@correo.com");
      return;
    }

    try {
      setProcesando(true);
      await signInWithEmailAndPassword(session, correoLimpio, clave);
      router.replace("/panel");
    } catch (error: any) {
      console.log("ERROR DE ACCESO", error?.code, error?.message);

      const codigo = String(error?.code || "");
      let mensaje = codigo
        ? `Firebase respondió con el error: ${codigo}`
        : "No fue posible iniciar sesión.";

      if (
        codigo === "auth/invalid-credential" ||
        codigo === "auth/wrong-password" ||
        codigo === "auth/user-not-found"
      ) {
        mensaje = "El correo o la contraseña son incorrectos.";
      } else if (codigo === "auth/invalid-email") {
        mensaje = "El formato del correo no es válido.";
      } else if (codigo === "auth/too-many-requests") {
        mensaje = "Hay demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
      } else if (codigo === "auth/network-request-failed") {
        mensaje = "No hay conexión con Firebase. Revisa tu Internet.";
      } else if (codigo === "auth/operation-not-allowed") {
        mensaje = "Activa el proveedor Email/Password en Firebase Authentication.";
      } else if (codigo === "auth/configuration-not-found") {
        mensaje = "Firebase Authentication todavía no está configurado. Habilita Email/Password en Firebase Console.";
      } else if (codigo.includes("api-key-not-valid") || codigo === "auth/invalid-api-key") {
        mensaje = "La API Key configurada en .env no es válida para Firebase Authentication.";
      }

      Alert.alert("No pudimos ingresar", mensaje);
    } finally {
      setProcesando(false);
    }
  };

  const recuperar = async () => {
    const correoLimpio = correo.trim().toLowerCase();

    if (!validarCorreo(correoLimpio)) {
      Alert.alert("Correo requerido", "Escribe primero el correo de tu cuenta.");
      return;
    }

    try {
      await sendPasswordResetEmail(session, correoLimpio);
      Alert.alert("Correo enviado", "Revisa tu bandeja de entrada para restablecer la contraseña.");
    } catch (error: any) {
      console.log("ERROR RECUPERACION", error?.code, error?.message);
      Alert.alert("No se pudo enviar", "Verifica el correo e inténtalo nuevamente.");
    }
  };

  if (revisandoSesion) {
    return (
      <SafeAreaView style={styles.loadingPage}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>C</Text>
        </View>
        <ActivityIndicator color={palette.mint} size="large" style={{ marginTop: 18 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.page}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.decorOne} />
          <View style={styles.decorTwo} />

          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>C</Text>
            </View>
            <View>
              <Text style={styles.brandName}>CINEFLOW</Text>
              <Text style={styles.brandTag}>PERSONAL CINEMA HUB</Text>
            </View>
          </View>

          <View style={styles.intro}>
            <Text style={styles.eyebrow}>TU ESPACIO DE CINE</Text>
            <Text style={styles.title}>Todo lo que quieres ver, en un solo lugar.</Text>
            <Text style={styles.description}>
              Inicia sesión con una cuenta creada en Firebase Authentication.
            </Text>
          </View>

          <View style={styles.accessCard}>
            <View style={styles.cardHeadingRow}>
              <View>
                <Text style={styles.cardTitle}>Bienvenido</Text>
                <Text style={styles.cardCaption}>Ingresa con tu cuenta registrada.</Text>
              </View>
              <View style={styles.statusDot} />
            </View>

            <Text style={styles.label}>Correo electrónico</Text>
            <View style={styles.inputShell}>
              <Text style={styles.inputPrefix}>@</Text>
              <TextInput
                style={styles.input}
                placeholder="nombre@correo.com"
                placeholderTextColor="#60758D"
                value={correo}
                onChangeText={setCorreo}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                editable={!procesando}
              />
            </View>

            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputShell}>
              <Text style={styles.inputPrefix}>•</Text>
              <TextInput
                style={styles.input}
                placeholder="Tu contraseña"
                placeholderTextColor="#60758D"
                value={clave}
                onChangeText={setClave}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                editable={!procesando}
                onSubmitEditing={entrar}
              />
            </View>

            <TouchableOpacity style={styles.forgotButton} onPress={recuperar} activeOpacity={0.7}>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, procesando && styles.primaryButtonDisabled]}
              onPress={entrar}
              disabled={procesando}
              activeOpacity={0.85}
            >
              {procesando ? (
                <ActivityIndicator color={palette.ink} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Entrar a CineFlow</Text>
                  <Text style={styles.primaryButtonArrow}>→</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.registerRow}>
              <Text style={styles.registerHint}>¿Aún no tienes cuenta?</Text>
              <TouchableOpacity onPress={() => router.push("/registro")} activeOpacity={0.7}>
                <Text style={styles.registerLink}>Crear cuenta</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.footer}>CineFlow Mobile · Firebase</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: palette.ink },
  loadingPage: { flex: 1, backgroundColor: palette.ink, alignItems: "center", justifyContent: "center" },
  page: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 28, overflow: "hidden" },
  decorOne: { position: "absolute", width: 250, height: 250, borderRadius: 125, backgroundColor: "#0C584F", opacity: 0.25, right: -120, top: -70 },
  decorTwo: { position: "absolute", width: 170, height: 170, borderRadius: 85, borderWidth: 28, borderColor: "#17314A", opacity: 0.55, left: -105, bottom: 80 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  brandMark: { width: 46, height: 46, borderRadius: 14, backgroundColor: palette.mint, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-5deg" }] },
  brandMarkText: { color: palette.ink, fontSize: 24, fontWeight: "900" },
  brandName: { color: palette.white, fontSize: 18, fontWeight: "900", letterSpacing: 1.8 },
  brandTag: { color: palette.muted, fontSize: 9, fontWeight: "700", letterSpacing: 1.2, marginTop: 2 },
  intro: { marginTop: 54, marginBottom: 30 },
  eyebrow: { color: palette.mint, fontSize: 12, fontWeight: "800", letterSpacing: 1.8, marginBottom: 12 },
  title: { color: palette.text, fontSize: 38, lineHeight: 44, fontWeight: "900", maxWidth: 440 },
  description: { color: palette.muted, fontSize: 15, lineHeight: 23, marginTop: 14, maxWidth: 470 },
  accessCard: { backgroundColor: palette.inkSoft, borderWidth: 1, borderColor: palette.line, borderRadius: radius.xl, padding: 22, ...shadow },
  cardHeadingRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 },
  cardTitle: { color: palette.text, fontSize: 24, fontWeight: "800" },
  cardCaption: { color: palette.muted, fontSize: 13, marginTop: 5 },
  statusDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: palette.success, marginTop: 8 },
  label: { color: "#C7D2DE", fontSize: 12, fontWeight: "700", marginBottom: 8, marginTop: 12 },
  inputShell: { height: 56, borderRadius: radius.md, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.ink, flexDirection: "row", alignItems: "center", paddingHorizontal: 15 },
  inputPrefix: { width: 28, color: palette.mint, fontSize: 17, fontWeight: "900" },
  input: { flex: 1, color: palette.white, fontSize: 15, height: "100%" },
  forgotButton: { alignSelf: "flex-end", paddingVertical: 13 },
  forgotText: { color: palette.mint, fontSize: 12, fontWeight: "700" },
  primaryButton: { marginTop: 4, minHeight: 56, borderRadius: radius.md, backgroundColor: palette.mint, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  primaryButtonDisabled: { opacity: 0.65 },
  primaryButtonText: { color: palette.ink, fontSize: 15, fontWeight: "900" },
  primaryButtonArrow: { color: palette.ink, fontSize: 22, fontWeight: "700", marginTop: -2 },
  registerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 18 },
  registerHint: { color: palette.muted, fontSize: 12 },
  registerLink: { color: palette.mint, fontSize: 12, fontWeight: "800" },
  footer: { color: "#52677E", fontSize: 11, textAlign: "center", marginTop: 24, letterSpacing: 0.5 },
});
