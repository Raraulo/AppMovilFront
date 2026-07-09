// config.js
import { Platform } from 'react-native';

const DEVELOPMENT_IP = '192.168.1.5';
const API_PORT = 8000;
const PRODUCTION_URL = 'https://appmovilback-1.onrender.com';

export const getApiUrl = () => {
  // ✅ FORZAR RENDER SIEMPRE (temporal para testing)
  console.log('🚀 Usando Render:', PRODUCTION_URL);
  return PRODUCTION_URL;
  
  /* COMENTAR ESTO TEMPORALMENTE
  if (!__DEV__) {
    console.log('🚀 Modo Producción:', PRODUCTION_URL);
    return PRODUCTION_URL;
  }

  const configUrl = Constants.expoConfig?.extra?.apiUrl;
  if (configUrl) {
    console.log('📱 Usando app.json:', configUrl);
    return configUrl;
  }

  const url = `http://${DEVELOPMENT_IP}:${API_PORT}`;
  const platformEmoji = Platform.OS === 'ios' ? '🍎' :
                        Platform.OS === 'android' ? '🤖' : '💻';
  console.log(`${platformEmoji} ${Platform.OS} - API URL:`, url);
  return url;
  */
};

export const API_URL = getApiUrl();

console.log('✅ API Config cargado:', API_URL);
console.log('📍 Plataforma:', Platform.OS);
console.log('🔧 Dev Mode:', __DEV__);
