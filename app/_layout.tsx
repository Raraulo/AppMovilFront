/*import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Slot />
    </SafeAreaProvider>
  );
}
*/
// app/_layout.tsx
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiProvider } from '../contexts/ApiContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ApiProvider>
        <Slot />
      </ApiProvider>
    </SafeAreaProvider>
  );
}
