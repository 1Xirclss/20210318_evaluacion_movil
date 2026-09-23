import React from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { palette, radius } from "@/styles/design";

type Props = TextInputProps & {
  etiqueta: string;
  ayuda?: string;
};

export function CampoFormulario({ etiqueta, ayuda, style, ...props }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{etiqueta}</Text>
      <TextInput
        placeholderTextColor="#60758D"
        style={[styles.input, style]}
        {...props}
      />
      {ayuda ? <Text style={styles.help}>{ayuda}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: {
    color: "#C7D2DE",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.ink,
    color: palette.white,
    paddingHorizontal: 15,
    fontSize: 15,
  },
  help: {
    color: palette.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
  },
});
