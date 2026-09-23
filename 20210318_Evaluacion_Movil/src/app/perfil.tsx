import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { onAuthStateChanged, signOut, updateProfile, User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { BotonPrincipal } from "@/components/BotonPrincipal";
import { CampoFormulario } from "@/components/CampoFormulario";
import { database, session } from "@/services/cloudClient";
import { palette, radius } from "@/styles/design";

type PerfilUsuario = {
  nombreCompleto?: string;
  fechaNacimiento?: string;
  carnet?: string;
  urlImagen?: string;
  correo?: string;
};

export default function PerfilScreen() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [carnet, setCarnet] = useState("");
  const [urlImagen, setUrlImagen] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(session, async (currentUser) => {
      if (!currentUser) {
        router.replace("/");
        return;
      }

      setUsuario(currentUser);

      try {
        setCargando(true);
        const snapshot = await getDoc(doc(database, "usuarios", currentUser.uid));

        if (snapshot.exists()) {
          const data = snapshot.data() as PerfilUsuario;
          setNombreCompleto(data.nombreCompleto || currentUser.displayName || "");
          setFechaNacimiento(data.fechaNacimiento || "");
          setCarnet(data.carnet || "");
          setUrlImagen(data.urlImagen || currentUser.photoURL || "");
        } else {
          setNombreCompleto(currentUser.displayName || "");
          setUrlImagen(currentUser.photoURL || "");
        }
      } catch (error: any) {
        console.log("ERROR PERFIL", error?.code, error?.message);
        Alert.alert("No se pudo cargar", "No fue posible leer tu perfil desde Firestore.");
      } finally {
        setCargando(false);
      }
    });

    return unsubscribe;
  }, []);

  const iniciales = useMemo(() => {
    const base = nombreCompleto.trim() || usuario?.email || "U";
    return base
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join("");
  }, [nombreCompleto, usuario]);

  const guardar = async () => {
    if (!usuario) return;

    const nombre = nombreCompleto.trim();
    const fecha = fechaNacimiento.trim();
    const numeroCarnet = carnet.trim();
    const imagen = urlImagen.trim();

    if (!nombre || !fecha || !numeroCarnet || !imagen) {
      Alert.alert("Faltan datos", "Completa todos los campos del perfil.");
      return;
    }

    try {
      setGuardando(true);

      await setDoc(
        doc(database, "usuarios", usuario.uid),
        {
          uid: usuario.uid,
          nombreCompleto: nombre,
          fechaNacimiento: fecha,
          carnet: numeroCarnet,
          urlImagen: imagen,
          correo: usuario.email || "",
          actualizadoEn: serverTimestamp(),
        },
        { merge: true }
      );

      await updateProfile(usuario, {
        displayName: nombre,
        photoURL: imagen,
      });

      Alert.alert("Perfil actualizado", "Los cambios se guardaron correctamente.");
    } catch (error: any) {
      console.log("ERROR AL GUARDAR PERFIL", error?.code, error?.message);
      Alert.alert("No se pudo guardar", "Revisa tu conexión y las reglas de Firestore.");
    } finally {
      setGuardando(false);
    }
  };

  const salir = async () => {
    try {
      await signOut(session);
      router.replace("/");
    } catch {
      Alert.alert("Error", "No fue posible cerrar la sesión.");
    }
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.loadingPage}>
        <ActivityIndicator color={palette.mint} size="large" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>PERFIL</Text>
          <View style={styles.topSpacer} />
        </View>

        <View style={styles.heroCard}>
          {urlImagen.trim() ? (
            <Image source={{ uri: urlImagen.trim() }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{iniciales || "U"}</Text>
            </View>
          )}
          <Text style={styles.heroTitle}>{nombreCompleto || "Información personal"}</Text>
          <Text style={styles.heroEmail}>{usuario?.email || "Sesión activa"}</Text>
        </View>

        <View style={styles.card}>
          <CampoFormulario etiqueta="Nombre completo" placeholder="Nombre completo" value={nombreCompleto} onChangeText={setNombreCompleto} editable={!guardando} />
          <CampoFormulario etiqueta="Fecha de nacimiento" placeholder="DD/MM/AAAA" value={fechaNacimiento} onChangeText={setFechaNacimiento} editable={!guardando} />
          <CampoFormulario etiqueta="Carnet institucional" placeholder="Número de carnet" value={carnet} onChangeText={setCarnet} editable={!guardando} />
          <CampoFormulario etiqueta="URL de imagen" placeholder="https://..." value={urlImagen} onChangeText={setUrlImagen} autoCapitalize="none" autoCorrect={false} keyboardType="url" editable={!guardando} />

          <BotonPrincipal titulo="Guardar cambios" onPress={guardar} cargando={guardando} />
          <View style={styles.gap} />
          <BotonPrincipal titulo="Cerrar sesión" onPress={salir} variante="secundario" disabled={guardando} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.ink },
  loadingPage: { flex: 1, backgroundColor: palette.ink, alignItems: "center", justifyContent: "center" },
  loadingText: { color: palette.muted, marginTop: 12, fontSize: 13 },
  page: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 36 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
  back: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center", backgroundColor: palette.inkSoft },
  backText: { color: palette.white, fontSize: 30, lineHeight: 32, marginTop: -3 },
  topTitle: { color: palette.muted, fontSize: 11, fontWeight: "900", letterSpacing: 2 },
  topSpacer: { width: 42 },
  heroCard: { minHeight: 205, borderRadius: radius.xl, backgroundColor: palette.mint, padding: 22, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  avatar: { width: 74, height: 74, borderRadius: 24, backgroundColor: palette.ink, alignItems: "center", justifyContent: "center" },
  avatarText: { color: palette.mint, fontSize: 26, fontWeight: "900" },
  avatarImage: { width: 78, height: 78, borderRadius: 24, backgroundColor: palette.ink },
  heroTitle: { color: palette.ink, fontSize: 23, fontWeight: "900", marginTop: 15, textAlign: "center" },
  heroEmail: { color: "#234843", fontSize: 12, marginTop: 5 },
  card: { backgroundColor: palette.inkSoft, borderWidth: 1, borderColor: palette.line, borderRadius: radius.xl, padding: 18 },
  gap: { height: 10 },
});
