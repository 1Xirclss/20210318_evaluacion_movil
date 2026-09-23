import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

import { database, session } from "@/services/cloudClient";
import { palette, radius, shadow } from "@/styles/design";

export default function DashboardScreen() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [totalTitulos, setTotalTitulos] = useState(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(session, (currentUser) => {
      if (!currentUser) {
        router.replace("/");
        return;
      }

      setUsuario(currentUser);
    });

    return unsubscribe;
  }, []);

  const cargarResumen = async () => {
    try {
      setCargando(true);
      const snapshot = await getDocs(collection(database, "peliculas"));
      setTotalTitulos(snapshot.size);
    } catch (error) {
      console.log("ERROR AL CARGAR RESUMEN", error);
      setTotalTitulos(0);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarResumen();
  }, []);

  const inicial = useMemo(() => {
    const base = usuario?.email?.trim()?.[0] || "U";
    return base.toUpperCase();
  }, [usuario]);

  const salir = async () => {
    try {
      await signOut(session);
      router.replace("/");
    } catch (error) {
      console.log("ERROR AL CERRAR SESION", error);
      Alert.alert("No se pudo salir", "Intenta nuevamente en unos segundos.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.topbar}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}><Text style={styles.brandMarkText}>C</Text></View>
            <View>
              <Text style={styles.brandName}>CINEFLOW</Text>
              <Text style={styles.brandSub}>DASHBOARD</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.profileButton} onPress={salir} activeOpacity={0.8}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{inicial}</Text></View>
            <View style={styles.profileCopy}>
              <Text style={styles.profileLabel}>Sesión activa</Text>
              <Text numberOfLines={1} style={styles.profileEmail}>{usuario?.email || "Usuario"}</Text>
            </View>
            <Text style={styles.exitIcon}>↗</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>COLECCIÓN PERSONAL</Text></View>
          <Text style={styles.heroTitle}>Tu próxima película empieza aquí.</Text>
          <Text style={styles.heroText}>
            Administra tu catálogo en la nube: agrega, consulta, edita y elimina películas desde la app.
          </Text>
          <TouchableOpacity style={styles.heroButton} onPress={() => router.push("/catalogo")} activeOpacity={0.85}>
            <Text style={styles.heroButtonText}>Administrar catálogo</Text>
            <Text style={styles.heroButtonArrow}>→</Text>
          </TouchableOpacity>
          <View style={styles.heroShapeOne} />
          <View style={styles.heroShapeTwo} />
        </View>

        <Text style={styles.sectionKicker}>RESUMEN</Text>
        <Text style={styles.sectionTitle}>Tu actividad</Text>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardWide]}>
            <Text style={styles.statLabel}>TÍTULOS EN NUBE</Text>
            {cargando ? (
              <ActivityIndicator color={palette.mint} style={styles.loader} />
            ) : (
              <Text style={styles.statNumber}>{String(totalTitulos).padStart(2, "0")}</Text>
            )}
            <Text style={styles.statFoot}>Películas disponibles ahora</Text>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineLabel}>ONLINE</Text>
            </View>
            <Text style={styles.cloudIcon}>☁</Text>
            <Text style={styles.cloudTitle}>Cloud Sync</Text>
            <Text style={styles.cloudText}>Datos conectados</Text>
          </View>
        </View>

        <Text style={[styles.sectionKicker, styles.actionsKicker]}>ACCESOS RÁPIDOS</Text>

        <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/perfil")} activeOpacity={0.82}>
          <View style={styles.actionIconBox}><Text style={styles.actionIcon}>●</Text></View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Mi perfil</Text>
            <Text style={styles.actionText}>Vista preparada para leer y actualizar los datos del usuario.</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/catalogo")} activeOpacity={0.82}>
          <View style={styles.actionIconBox}><Text style={styles.actionIcon}>▶</Text></View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>CRUD de películas</Text>
            <Text style={styles.actionText}>Crea, consulta, edita y elimina registros en Cloud Firestore.</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => Alert.alert("Próximamente", "La sección de reseñas aún no está habilitada.")}
          activeOpacity={0.82}
        >
          <View style={[styles.actionIconBox, styles.actionIconBoxAlt]}><Text style={styles.actionIconAlt}>★</Text></View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Mis reseñas</Text>
            <Text style={styles.actionText}>Espacio reservado para tus reseñas.</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutLink} onPress={salir}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.ink },
  page: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 36 },
  topbar: { gap: 18 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: { width: 40, height: 40, borderRadius: 12, backgroundColor: palette.mint, alignItems: "center", justifyContent: "center" },
  brandMarkText: { color: palette.ink, fontSize: 21, fontWeight: "900" },
  brandName: { color: palette.white, fontSize: 16, fontWeight: "900", letterSpacing: 1.5 },
  brandSub: { color: palette.muted, fontSize: 9, fontWeight: "700", letterSpacing: 1.6, marginTop: 1 },
  profileButton: { minHeight: 62, borderRadius: radius.md, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.inkSoft, paddingHorizontal: 10, flexDirection: "row", alignItems: "center" },
  avatar: { width: 42, height: 42, borderRadius: 13, backgroundColor: palette.panelAlt, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#2C465F" },
  avatarText: { color: palette.mint, fontSize: 17, fontWeight: "900" },
  profileCopy: { flex: 1, marginLeft: 10 },
  profileLabel: { color: palette.success, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  profileEmail: { color: palette.text, fontSize: 12, marginTop: 3, maxWidth: 210 },
  exitIcon: { color: palette.muted, fontSize: 18, paddingHorizontal: 8 },
  hero: { marginTop: 24, minHeight: 285, borderRadius: radius.xl, backgroundColor: palette.mint, padding: 24, overflow: "hidden", ...shadow },
  heroBadge: { alignSelf: "flex-start", backgroundColor: "rgba(7,17,31,0.12)", borderRadius: 100, paddingHorizontal: 11, paddingVertical: 7 },
  heroBadgeText: { color: palette.ink, fontSize: 9, fontWeight: "900", letterSpacing: 1.4 },
  heroTitle: { color: palette.ink, fontSize: 35, lineHeight: 40, fontWeight: "900", maxWidth: 320, marginTop: 18 },
  heroText: { color: "#183C38", fontSize: 14, lineHeight: 21, maxWidth: 310, marginTop: 10 },
  heroButton: { marginTop: 20, height: 50, borderRadius: 15, backgroundColor: palette.ink, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, alignSelf: "flex-start", paddingHorizontal: 18, zIndex: 2 },
  heroButtonText: { color: palette.white, fontSize: 13, fontWeight: "800" },
  heroButtonArrow: { color: palette.mint, fontSize: 19, fontWeight: "700" },
  heroShapeOne: { position: "absolute", width: 150, height: 150, borderRadius: 75, borderWidth: 24, borderColor: "rgba(7,17,31,0.08)", right: -45, bottom: -45 },
  heroShapeTwo: { position: "absolute", width: 72, height: 72, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.18)", right: 26, top: 28, transform: [{ rotate: "18deg" }] },
  sectionKicker: { color: palette.mint, fontSize: 10, fontWeight: "900", letterSpacing: 1.8, marginTop: 30 },
  sectionTitle: { color: palette.text, fontSize: 25, fontWeight: "800", marginTop: 6, marginBottom: 14 },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: { borderRadius: radius.lg, backgroundColor: palette.inkSoft, borderWidth: 1, borderColor: palette.line, padding: 18, minHeight: 160 },
  statCardWide: { flex: 1.15 },
  statLabel: { color: palette.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  statNumber: { color: palette.white, fontSize: 52, lineHeight: 58, fontWeight: "900", marginTop: 10 },
  statFoot: { color: palette.muted, fontSize: 11, lineHeight: 16, marginTop: 8 },
  loader: { alignSelf: "flex-start", marginVertical: 27 },
  statusCard: { flex: 0.85, borderRadius: radius.lg, backgroundColor: palette.panelAlt, borderWidth: 1, borderColor: "#28425A", padding: 16, minHeight: 160 },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.success },
  onlineLabel: { color: palette.success, fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  cloudIcon: { fontSize: 28, marginTop: 18 },
  cloudTitle: { color: palette.white, fontSize: 14, fontWeight: "800", marginTop: 6 },
  cloudText: { color: palette.muted, fontSize: 10, marginTop: 4 },
  actionsKicker: { marginBottom: 12 },
  actionCard: { minHeight: 92, borderRadius: radius.lg, backgroundColor: palette.inkSoft, borderWidth: 1, borderColor: palette.line, padding: 13, flexDirection: "row", alignItems: "center", marginBottom: 12 },
  actionIconBox: { width: 56, height: 56, borderRadius: 17, backgroundColor: "#143C3C", alignItems: "center", justifyContent: "center" },
  actionIconBoxAlt: { backgroundColor: "#3D3022" },
  actionIcon: { color: palette.mint, fontSize: 20, marginLeft: 2 },
  actionIconAlt: { color: palette.amber, fontSize: 22 },
  actionCopy: { flex: 1, marginLeft: 14, paddingRight: 6 },
  actionTitle: { color: palette.text, fontSize: 15, fontWeight: "800" },
  actionText: { color: palette.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  actionArrow: { color: palette.muted, fontSize: 28, fontWeight: "300", paddingHorizontal: 5 },
  logoutLink: { alignSelf: "center", padding: 16, marginTop: 6 },
  logoutText: { color: palette.danger, fontSize: 12, fontWeight: "700" },
});
