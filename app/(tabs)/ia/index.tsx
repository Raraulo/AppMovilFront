// app/(tabs)/ia/index.tsx
// Redirige automáticamente al chat de Giulia
import { Redirect } from "expo-router";

export default function IaIndex() {
  return <Redirect href="/(tabs)/ia/giulia" />;
}
