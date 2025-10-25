import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Puerto por defecto del backend en desarrollo
const API_PORT = 8000;

const getDevApiUrl = () => {
  // 1) Allow explicit override via app config / extra (recommended)
  const extra = (Constants.manifest && Constants.manifest.extra) || (Constants.expoConfig && Constants.expoConfig.extra);
  if (extra && extra.apiUrl) return extra.apiUrl.replace(/\/$/, '');

  // 2) If running in Expo client, debuggerHost or hostUri may contain host:port
  const debuggerHost = (Constants.manifest && (Constants.manifest.debuggerHost)) || (Constants.expoConfig && Constants.expoConfig.hostUri);
  if (typeof debuggerHost === 'string') {
    const host = debuggerHost.split(':')[0];
    return `http://${host}:${API_PORT}`;
  }

  // 3) Android emulator mapping
  if (Platform.OS === 'android') return `http://10.0.2.2:${API_PORT}`;

  // 4) Fallback to localhost
  return `http://localhost:${API_PORT}`;
};

export const API_URL = __DEV__ ? getDevApiUrl() : 'https://tu-servidor-en-produccion.com';
