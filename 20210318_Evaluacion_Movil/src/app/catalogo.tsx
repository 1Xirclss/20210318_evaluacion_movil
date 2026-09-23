import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { FormularioPelicula } from "@/components/FormularioPelicula";
import type { DatosPelicula, PeliculaEditable } from "@/components/FormularioPelicula";
import { database, session } from "@/services/cloudClient";
import { palette, radius, shadow } from "@/styles/design";

type MovieRecord = {
  id: string;
  titulo?: string;
  genero?: string;
  descripcion?: string;
  anio?: number;
  imagen?: string;
};

export default function CatalogScreen() {
  const [registros, setRegistros] = useState<MovieRecord[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState<PeliculaEditable | null>(null);
  const [guardando, setGuardando] = useState(false);

  const obtenerCatalogo = async (modoRefresh = false) => {
    try {
      modoRefresh ? setActualizando(true) : setCargando(true);

      const snapshot = await getDocs(collection(database, "peliculas"));
      const data = snapshot.docs
        .map((documento) => ({
          id: documento.id,
          ...(documento.data() as Omit<MovieRecord, "id">),
        }))
        .sort((a, b) => (a.titulo || "").localeCompare(b.titulo || ""));

      setRegistros(data);
      console.log("CATALOGO SINCRONIZADO", data.length);
    } catch (error: any) {
      console.log("ERROR AL CARGAR CATALOGO", error?.code, error?.message);
      Alert.alert(
        "Sin conexión al catálogo",
        error?.code === "permission-denied"
          ? "Firestore bloqueó la lectura. Publica las reglas incluidas en firestore.rules."
          : "No se pudieron leer las películas almacenadas."
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  };

  useEffect(() => {
    obtenerCatalogo();
  }, []);

  const resultados = useMemo(() => {
    const filtro = busqueda.trim().toLowerCase();
    if (!filtro) return registros;

    return registros.filter((item) =>
      [item.titulo, item.genero, item.descripcion, item.anio?.toString()]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(filtro))
    );
  }, [busqueda, registros]);

  const abrirNuevo = () => {
    setEditando(null);
    setModalVisible(true);
  };

  const abrirEdicion = (item: MovieRecord) => {
    setEditando({
      id: item.id,
      titulo: item.titulo || "",
      genero: item.genero || "",
      anio: Number(item.anio || 0),
      descripcion: item.descripcion || "",
      imagen: item.imagen || "",
    });
    setModalVisible(true);
  };

  const cerrarFormulario = () => {
    if (guardando) return;
    setModalVisible(false);
    setEditando(null);
  };

  const guardarPelicula = async (datos: DatosPelicula) => {
    const usuario = session.currentUser;

    if (!usuario) {
      Alert.alert("Sesión requerida", "Inicia sesión nuevamente para modificar el catálogo.");
      router.replace("/");
      return;
    }

    try {
      setGuardando(true);

      if (editando) {
        await updateDoc(doc(database, "peliculas", editando.id), {
          ...datos,
          actualizadoEn: serverTimestamp(),
          actualizadoPor: usuario.uid,
        });

        Alert.alert("Película actualizada", "Los cambios se guardaron en Cloud Firestore.");
      } else {
        await addDoc(collection(database, "peliculas"), {
          ...datos,
          creadoEn: serverTimestamp(),
          actualizadoEn: serverTimestamp(),
          creadoPor: usuario.uid,
          actualizadoPor: usuario.uid,
        });

        Alert.alert("Película agregada", "El nuevo registro quedó guardado en Cloud Firestore.");
      }

      setModalVisible(false);
      setEditando(null);
      await obtenerCatalogo(true);
    } catch (error: any) {
      console.log("ERROR AL GUARDAR PELICULA", error?.code, error?.message);

      Alert.alert(
        "No se pudo guardar",
        error?.code === "permission-denied"
          ? "Firestore bloqueó la escritura. Publica las reglas incluidas en firestore.rules."
          : `No se pudo completar la operación${error?.code ? ` (${error.code})` : ""}.`
      );
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = (item: MovieRecord) => {
    Alert.alert(
      "Eliminar película",
      `¿Quieres eliminar “${item.titulo || "este registro"}”? Esta acción también lo borrará de Firestore.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              if (!session.currentUser) {
                Alert.alert("Sesión requerida", "Inicia sesión nuevamente.");
                router.replace("/");
                return;
              }

              await deleteDoc(doc(database, "peliculas", item.id));
              setRegistros((actual) => actual.filter((pelicula) => pelicula.id !== item.id));
              Alert.alert("Película eliminada", "El registro fue eliminado de Cloud Firestore.");
            } catch (error: any) {
              console.log("ERROR AL ELIMINAR PELICULA", error?.code, error?.message);
              Alert.alert(
                "No se pudo eliminar",
                error?.code === "permission-denied"
                  ? "Firestore bloqueó la eliminación. Publica las reglas incluidas en firestore.rules."
                  : "Intenta nuevamente."
              );
            }
          },
        },
      ]
    );
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.loadingPage}>
        <View style={styles.loaderMark}><Text style={styles.loaderMarkText}>C</Text></View>
        <ActivityIndicator size="large" color={palette.mint} style={{ marginTop: 22 }} />
        <Text style={styles.loadingTitle}>Sincronizando catálogo</Text>
        <Text style={styles.loadingText}>Leyendo tus títulos desde la nube...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>CINEFLOW LIBRARY</Text>
            <Text style={styles.title}>Catálogo</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countNumber}>{registros.length}</Text>
            <Text style={styles.countLabel}>TÍTULOS</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={abrirNuevo} activeOpacity={0.85}>
          <View style={styles.addIconBox}><Text style={styles.addIcon}>＋</Text></View>
          <View style={styles.addCopy}>
            <Text style={styles.addTitle}>Agregar película</Text>
            <Text style={styles.addText}>Crear un nuevo registro en Firestore</Text>
          </View>
          <Text style={styles.addArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar por título, género o año"
            placeholderTextColor="#62768C"
            autoCorrect={false}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda("")} style={styles.clearButton}>
              <Text style={styles.clearText}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.resultRow}>
          <Text style={styles.resultText}>
            {resultados.length === registros.length
              ? "Todos los títulos"
              : `${resultados.length} resultado${resultados.length === 1 ? "" : "s"}`}
          </Text>
          <Text style={styles.pullHint}>Desliza ↓ para actualizar</Text>
        </View>

        <FlatList
          data={resultados}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={actualizando}
              onRefresh={() => obtenerCatalogo(true)}
              tintColor={palette.mint}
              colors={[palette.mint]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBox}><Text style={styles.emptyIcon}>□</Text></View>
              <Text style={styles.emptyTitle}>
                {registros.length === 0 ? "Tu catálogo está vacío" : "No encontramos coincidencias"}
              </Text>
              <Text style={styles.emptyText}>
                {registros.length === 0
                  ? "Usa el botón Agregar película para guardar tu primer registro en Firestore."
                  : "Prueba con otro título, género o año."}
              </Text>
              {registros.length === 0 && (
                <TouchableOpacity style={styles.reloadButton} onPress={abrirNuevo}>
                  <Text style={styles.reloadButtonText}>Agregar primera película</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item, index }) => {
            const titulo = item.titulo || "Título sin nombre";
            const inicial = titulo.charAt(0).toUpperCase();

            return (
              <View style={styles.movieCard}>
                <TouchableOpacity
                  style={styles.cardMain}
                  activeOpacity={0.86}
                  onPress={() =>
                    Alert.alert(
                      titulo,
                      `${item.genero || "Género no definido"} · ${item.anio || "Año no disponible"}\n\n${item.descripcion || "Sin descripción disponible."}`
                    )
                  }
                >
                  <View style={[styles.poster, index % 2 === 1 && styles.posterAlt]}>
                    <Text style={styles.posterIndex}>{String(index + 1).padStart(2, "0")}</Text>
                    <Text style={styles.posterLetter}>{inicial}</Text>
                    <View style={styles.posterLine} />
                  </View>

                  <View style={styles.movieInfo}>
                    <View style={styles.genreRow}>
                      <Text numberOfLines={1} style={styles.genre}>{item.genero || "SIN GÉNERO"}</Text>
                      <View style={styles.yearBadge}><Text style={styles.yearText}>{item.anio || "—"}</Text></View>
                    </View>
                    <Text numberOfLines={2} style={styles.movieTitle}>{titulo}</Text>
                    <Text numberOfLines={2} style={styles.description}>
                      {item.descripcion || "No hay una descripción registrada para este título."}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.crudRow}>
                  <TouchableOpacity style={styles.editButton} onPress={() => abrirEdicion(item)} activeOpacity={0.82}>
                    <Text style={styles.editButtonText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => confirmarEliminar(item)} activeOpacity={0.82}>
                    <Text style={styles.deleteButtonText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      </View>

      <FormularioPelicula
        visible={modalVisible}
        pelicula={editando}
        guardando={guardando}
        onCerrar={cerrarFormulario}
        onGuardar={guardarPelicula}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.ink },
  page: { flex: 1, paddingHorizontal: 18, paddingTop: 10 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  backButton: { width: 46, height: 46, borderRadius: 15, backgroundColor: palette.inkSoft, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
  backIcon: { color: palette.mint, fontSize: 34, lineHeight: 36, marginTop: -4 },
  headerCopy: { flex: 1, marginLeft: 13 },
  kicker: { color: palette.mint, fontSize: 9, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: palette.white, fontSize: 29, fontWeight: "900", marginTop: 2 },
  countBadge: { minWidth: 60, height: 52, borderRadius: 15, backgroundColor: palette.panelAlt, alignItems: "center", justifyContent: "center", paddingHorizontal: 9 },
  countNumber: { color: palette.white, fontSize: 17, fontWeight: "900", lineHeight: 19 },
  countLabel: { color: palette.muted, fontSize: 7, fontWeight: "800", letterSpacing: 1, marginTop: 2 },
  addButton: { minHeight: 72, borderRadius: radius.lg, backgroundColor: palette.mint, padding: 10, flexDirection: "row", alignItems: "center", marginBottom: 13 },
  addIconBox: { width: 50, height: 50, borderRadius: 15, backgroundColor: "rgba(7,17,31,0.12)", alignItems: "center", justifyContent: "center" },
  addIcon: { color: palette.ink, fontSize: 28, lineHeight: 30, fontWeight: "500" },
  addCopy: { flex: 1, marginLeft: 12 },
  addTitle: { color: palette.ink, fontSize: 15, fontWeight: "900" },
  addText: { color: "#234842", fontSize: 10, marginTop: 3 },
  addArrow: { color: palette.ink, fontSize: 22, fontWeight: "800", paddingHorizontal: 8 },
  searchBox: { height: 54, borderRadius: radius.md, backgroundColor: palette.inkSoft, borderWidth: 1, borderColor: palette.line, flexDirection: "row", alignItems: "center", paddingHorizontal: 14 },
  searchIcon: { color: palette.mint, fontSize: 24, marginRight: 10, marginTop: -2 },
  searchInput: { flex: 1, color: palette.white, fontSize: 13, height: "100%" },
  clearButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: palette.panelAlt, alignItems: "center", justifyContent: "center" },
  clearText: { color: palette.muted, fontSize: 21, lineHeight: 23 },
  resultRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 15, marginBottom: 10 },
  resultText: { color: palette.text, fontSize: 13, fontWeight: "800" },
  pullHint: { color: "#50657B", fontSize: 9 },
  listContent: { paddingBottom: 34 },
  movieCard: { borderRadius: radius.lg, backgroundColor: palette.inkSoft, borderWidth: 1, borderColor: palette.line, padding: 12, marginBottom: 14, ...shadow },
  cardMain: { minHeight: 166, flexDirection: "row" },
  poster: { width: 104, minHeight: 158, borderRadius: 18, backgroundColor: "#163E3D", padding: 12, justifyContent: "space-between", overflow: "hidden" },
  posterAlt: { backgroundColor: "#3C3025" },
  posterIndex: { color: "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  posterLetter: { color: palette.white, fontSize: 54, lineHeight: 58, fontWeight: "900", alignSelf: "center" },
  posterLine: { height: 5, borderRadius: 4, backgroundColor: palette.mint, width: "55%" },
  movieInfo: { flex: 1, paddingLeft: 14, paddingVertical: 4 },
  genreRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  genre: { color: palette.mint, fontSize: 9, fontWeight: "900", letterSpacing: 1, flex: 1 },
  yearBadge: { backgroundColor: palette.panelAlt, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  yearText: { color: palette.muted, fontSize: 9, fontWeight: "800" },
  movieTitle: { color: palette.white, fontSize: 19, lineHeight: 23, fontWeight: "900", marginTop: 12 },
  description: { color: palette.muted, fontSize: 11, lineHeight: 17, marginTop: 8 },
  crudRow: { flexDirection: "row", gap: 10, borderTopWidth: 1, borderTopColor: palette.line, marginTop: 12, paddingTop: 12 },
  editButton: { flex: 1, height: 42, borderRadius: 13, backgroundColor: palette.panelAlt, borderWidth: 1, borderColor: "#31516E", alignItems: "center", justifyContent: "center" },
  editButtonText: { color: palette.mint, fontSize: 12, fontWeight: "900" },
  deleteButton: { flex: 1, height: 42, borderRadius: 13, backgroundColor: "#2C1B25", borderWidth: 1, borderColor: "#593243", alignItems: "center", justifyContent: "center" },
  deleteButtonText: { color: palette.danger, fontSize: 12, fontWeight: "900" },
  loadingPage: { flex: 1, backgroundColor: palette.ink, alignItems: "center", justifyContent: "center", padding: 30 },
  loaderMark: { width: 64, height: 64, borderRadius: 20, backgroundColor: palette.mint, alignItems: "center", justifyContent: "center" },
  loaderMarkText: { color: palette.ink, fontSize: 32, fontWeight: "900" },
  loadingTitle: { color: palette.white, fontSize: 19, fontWeight: "800", marginTop: 18 },
  loadingText: { color: palette.muted, fontSize: 12, marginTop: 7 },
  emptyState: { alignItems: "center", paddingHorizontal: 24, paddingTop: 55 },
  emptyIconBox: { width: 70, height: 70, borderRadius: 22, backgroundColor: palette.inkSoft, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
  emptyIcon: { color: palette.mint, fontSize: 30 },
  emptyTitle: { color: palette.white, fontSize: 19, fontWeight: "800", textAlign: "center", marginTop: 18 },
  emptyText: { color: palette.muted, fontSize: 12, lineHeight: 19, textAlign: "center", marginTop: 8, maxWidth: 310 },
  reloadButton: { marginTop: 20, borderRadius: 14, backgroundColor: palette.mint, paddingHorizontal: 20, paddingVertical: 13 },
  reloadButtonText: { color: palette.ink, fontSize: 12, fontWeight: "900" },
});
