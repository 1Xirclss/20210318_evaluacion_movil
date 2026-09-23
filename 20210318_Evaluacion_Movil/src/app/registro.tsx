import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { createUserWithEmailAndPassword, deleteUser, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { BotonPrincipal } from "@/components/BotonPrincipal";
import { CampoFormulario } from "@/components/CampoFormulario";
import { database, session } from "@/services/cloudClient";
import { palette, radius } from "@/styles/design";

const validarCorreo = (valor: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
const validarURL = (valor: string) => /^https?:\/\/\S+$/i.test(valor.trim());

export default function RegistroScreen() {
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [carnet, setCarnet] = useState("");
  const [urlImagen, setUrlImagen] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [guardando, setGuardando] = useState(false);

  const registrar = async () => {
    const nombre = nombreCompleto.trim();
    const fecha = fechaNacimiento.trim();
    const numeroCarnet = carnet.trim();
    const imagen = urlImagen.trim();
    const email = correo.trim().toLowerCase();

    if (!nombre || !fecha || !numeroCarnet || !imagen || !email || !clave) {
      Alert.alert("Faltan datos", "Completa todos los campos antes de continuar.");
      return;
    }

    if (!validarCorreo(email)) {
      Alert.alert("Correo inválido", "Escribe un correo electrónico válido.");
      return;
    }

    if (clave.length < 6) {
      Alert.alert("Contraseña muy corta", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (!validarURL(imagen)) {
      Alert.alert("URL inválida", "La URL de imagen debe comenzar con http:// o https://");
      return;
    }

    let usuarioCreado: Awaited<ReturnType<typeof createUserWithEmailAndPassword>> | null = null;

    try {
      setGuardando(true);

      usuarioCreado = await createUserWithEmailAndPassword(session, email, clave);

      await updateProfile(usuarioCreado.user, {
        displayName: nombre,
        photoURL: imagen,
      });

      try {
        await setDoc(doc(database, "usuarios", usuarioCreado.user.uid), {
          uid: usuarioCreado.user.uid,
          nombreCompleto: nombre,
          fechaNacimiento: fecha,
          carnet: numeroCarnet,
          urlImagen: imagen,
          correo: email,
          creadoEn: serverTimestamp(),
          actualizadoEn: serverTimestamp(),
        });
      } catch (firestoreError) {
        await deleteUser(usuarioCreado.user).catch(() => undefined);
        throw firestoreError;
      }

      Alert.alert("Cuenta creada", "Tu cuenta se registró correctamente.", [
        { text: "Continuar", onPress: () => router.replace("/panel") },
      ]);
    } catch (error: any) {
      const codigo = String(error?.code || "");
      console.log("ERROR DE REGISTRO", codigo, error?.message);

      let mensaje = codigo
        ? `Firebase respondió con el error: ${codigo}`
        : "No se pudo completar el registro.";

      if (codigo === "auth/email-already-in-use") {
        mensaje = "Ese correo ya tiene una cuenta registrada.";
      } else if (codigo === "auth/invalid-email") {
        mensaje = "El correo electrónico no es válido.";
      } else if (codigo === "auth/weak-password") {
        mensaje = "La contraseña es demasiado débil.";
      } else if (codigo === "auth/operation-not-allowed") {
        mensaje = "El acceso por correo y contraseña está desactivado. Activa Email/Password en Firebase Authentication.";
      } else if (codigo === "auth/configuration-not-found") {
        mensaje = "Firebase Authentication todavía no está configurado en este proyecto. Abre Firebase Console, entra a Authentication y habilita Email/Password.";
      } else if (codigo === "auth/network-request-failed") {
        mensaje = "No se pudo conectar con Firebase. Revisa tu conexión a Internet y vuelve a intentarlo.";
      } else if (codigo.includes("api-key-not-valid") || codigo === "auth/invalid-api-key") {
        mensaje = "La API Key configurada en .env no es válida para Firebase Authentication.";
      } else if (codigo === "permission-denied" || codigo === "firestore/permission-denied") {
        mensaje = "La cuenta pudo conectarse a Authentication, pero Firestore bloqueó el perfil. Publica las reglas incluidas en firestore.rules.";
      } else if (codigo === "failed-precondition" || codigo === "firestore/failed-precondition" || codigo === "not-found" || codigo === "firestore/not-found") {
        mensaje = "Cloud Firestore todavía no está creado o configurado para este proyecto.";
      } else if (codigo === "unavailable" || codigo === "firestore/unavailable") {
        mensaje = "Cloud Firestore no está disponible en este momento. Revisa la conexión y vuelve a intentarlo.";
      }

      Alert.alert("No se pudo registrar", mensaje);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.back} onPress={() => router.back()}>
              <Text style={styles.backText}>‹</Text>
            </TouchableOpacity>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>C</Text>
            </View>
          </View>

          <Text style={styles.eyebrow}>NUEVA CUENTA</Text>
          <Text style={styles.title}>Crea tu perfil personal</Text>
          <Text style={styles.description}>Los datos se guardarán en Firebase Authentication y Cloud Firestore.</Text>

          <View style={styles.card}>
            <CampoFormulario etiqueta="Nombre completo" placeholder="Ej. Marco Hernández" value={nombreCompleto} onChangeText={setNombreCompleto} editable={!guardando} />
            <CampoFormulario etiqueta="Fecha de nacimiento" placeholder="DD/MM/AAAA" value={fechaNacimiento} onChangeText={setFechaNacimiento} editable={!guardando} />
            <CampoFormulario etiqueta="Carnet institucional" placeholder="Tu número de carnet" value={carnet} onChangeText={setCarnet} autoCapitalize="characters" editable={!guardando} />
            <CampoFormulario etiqueta="URL de imagen" placeholder="https://..." value={urlImagen} onChangeText={setUrlImagen} autoCapitalize="none" autoCorrect={false} keyboardType="url" editable={!guardando} />
            <CampoFormulario etiqueta="Correo electrónico" placeholder="nombre@correo.com" value={correo} onChangeText={setCorreo} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!guardando} />
            <CampoFormulario etiqueta="Contraseña" placeholder="Mínimo 6 caracteres" value={clave} onChangeText={setClave} secureTextEntry autoCapitalize="none" autoCorrect={false} editable={!guardando} />

            <BotonPrincipal titulo="Crear cuenta" onPress={registrar} cargando={guardando} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: palette.ink },
  page: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 36 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 36 },
  back: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center", backgroundColor: palette.inkSoft },
  backText: { color: palette.white, fontSize: 30, lineHeight: 32, marginTop: -3 },
  brandMark: { width: 42, height: 42, borderRadius: 13, backgroundColor: palette.mint, alignItems: "center", justifyContent: "center" },
  brandMarkText: { color: palette.ink, fontWeight: "900", fontSize: 21 },
  eyebrow: { color: palette.mint, fontSize: 11, fontWeight: "900", letterSpacing: 1.8 },
  title: { color: palette.white, fontSize: 32, lineHeight: 38, fontWeight: "900", marginTop: 9 },
  description: { color: palette.muted, fontSize: 13, lineHeight: 20, marginTop: 10, marginBottom: 24 },
  card: { backgroundColor: palette.inkSoft, borderWidth: 1, borderColor: palette.line, borderRadius: radius.xl, padding: 18 },
});
