import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";

import { palette, radius } from "@/styles/design";

type Props = {
  titulo: string;
  onPress: () => void;
  cargando?: boolean;
  disabled?: boolean;
  variante?: "principal" | "secundario";
};

export function BotonPrincipal({
  titulo,
  onPress,
  cargando = false,
  disabled = false,
  variante = "principal",
}: Props) {
  const bloqueado = disabled || cargando;

  return (
    <TouchableOpacity
      activeOpacity={0.84}
      disabled={bloqueado}
      onPress={onPress}
      style={[
        styles.base,
        variante === "principal" ? styles.primary : styles.secondary,
        bloqueado && styles.disabled,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={variante === "principal" ? palette.ink : palette.mint} />
      ) : (
        <Text
          style={
            variante === "principal" ? styles.primaryText : styles.secondaryText
          }
        >
          {titulo}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  primary: { backgroundColor: palette.mint },
  secondary: {
    backgroundColor: palette.inkSoft,
    borderWidth: 1,
    borderColor: palette.line,
  },
  disabled: { opacity: 0.55 },
  primaryText: { color: palette.ink, fontWeight: "900", fontSize: 14 },
  secondaryText: { color: palette.mint, fontWeight: "800", fontSize: 14 },
});
