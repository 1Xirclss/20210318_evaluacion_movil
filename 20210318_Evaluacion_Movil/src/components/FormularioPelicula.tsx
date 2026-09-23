import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { BotonPrincipal } from "@/components/BotonPrincipal";
import { CampoFormulario } from "@/components/CampoFormulario";
import { palette, radius } from "@/styles/design";

export type DatosPelicula = {
  titulo: string;
  genero: string;
  anio: number;
  descripcion: string;
  imagen: string;
};

export type PeliculaEditable = DatosPelicula & {
  id: string;
};

type Props = {
  visible: boolean;
  pelicula?: PeliculaEditable | null;
  guardando?: boolean;
  onCerrar: () => void;
  onGuardar: (datos: DatosPelicula) => Promise<void> | void;
};

export function FormularioPelicula({
  visible,
  pelicula,
  guardando = false,
  onCerrar,
  onGuardar,
}: Props) {
  const [titulo, setTitulo] = useState("");
  const [genero, setGenero] = useState("");
  const [anio, setAnio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagen, setImagen] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;

    setTitulo(pelicula?.titulo ?? "");
    setGenero(pelicula?.genero ?? "");
    setAnio(pelicula?.anio ? String(pelicula.anio) : "");
    setDescripcion(pelicula?.descripcion ?? "");
    setImagen(pelicula?.imagen ?? "");
    setError("");
  }, [visible, pelicula]);

  const enviar = async () => {
    const tituloLimpio = titulo.trim();
    const generoLimpio = genero.trim();
    const descripcionLimpia = descripcion.trim();
    const imagenLimpia = imagen.trim();
    const anioNumero = Number(anio.trim());

    if (!tituloLimpio || !generoLimpio || !anio.trim() || !descripcionLimpia) {
      setError("Completa título, género, año y descripción.");
      return;
    }

    if (!Number.isInteger(anioNumero) || anioNumero < 1888 || anioNumero > 2100) {
      setError("Escribe un año válido entre 1888 y 2100.");
      return;
    }

    setError("");
    await onGuardar({
      titulo: tituloLimpio,
      genero: generoLimpio,
      anio: anioNumero,
      descripcion: descripcionLimpia,
      imagen: imagenLimpia,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onCerrar}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.kicker}>{pelicula ? "EDITAR REGISTRO" : "NUEVO REGISTRO"}</Text>
              <Text style={styles.title}>{pelicula ? "Editar película" : "Agregar película"}</Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onCerrar}
              disabled={guardando}
              activeOpacity={0.8}
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.form}
          >
            <CampoFormulario
              etiqueta="Título"
              placeholder="Ej. Interstellar"
              value={titulo}
              onChangeText={setTitulo}
              editable={!guardando}
            />

            <CampoFormulario
              etiqueta="Género"
              placeholder="Ej. Ciencia ficción"
              value={genero}
              onChangeText={setGenero}
              editable={!guardando}
            />

            <CampoFormulario
              etiqueta="Año"
              placeholder="2014"
              value={anio}
              onChangeText={setAnio}
              keyboardType="number-pad"
              editable={!guardando}
              maxLength={4}
            />

            <CampoFormulario
              etiqueta="URL de imagen (opcional)"
              placeholder="https://..."
              value={imagen}
              onChangeText={setImagen}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!guardando}
            />

            <CampoFormulario
              etiqueta="Descripción"
              placeholder="Escribe una descripción breve de la película"
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              textAlignVertical="top"
              editable={!guardando}
              style={styles.descriptionInput}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <BotonPrincipal
              titulo={pelicula ? "Guardar cambios" : "Agregar al catálogo"}
              onPress={enviar}
              cargando={guardando}
            />

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCerrar}
              disabled={guardando}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(2, 8, 16, 0.78)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "92%",
    backgroundColor: palette.inkSoft,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: palette.line,
    paddingTop: 10,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#3A5067",
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerCopy: { flex: 1 },
  kicker: {
    color: palette.mint,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  title: {
    color: palette.white,
    fontSize: 25,
    fontWeight: "900",
    marginTop: 4,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.panelAlt,
    borderWidth: 1,
    borderColor: palette.line,
  },
  closeText: {
    color: palette.white,
    fontSize: 28,
    lineHeight: 30,
    marginTop: -2,
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  descriptionInput: {
    minHeight: 110,
    paddingTop: 15,
  },
  error: {
    color: palette.danger,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
    marginTop: -2,
  },
  cancelButton: {
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  cancelText: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: "700",
  },
});
