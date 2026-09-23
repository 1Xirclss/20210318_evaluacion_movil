import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { palette } from "@/styles/design";

export default function AppLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor={palette.ink} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.ink },
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="panel" />
        <Stack.Screen name="registro" />
        <Stack.Screen name="perfil" />
        <Stack.Screen name="catalogo" />
      </Stack>
    </>
  );
}
