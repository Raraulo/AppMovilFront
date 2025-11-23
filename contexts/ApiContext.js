// contexts/ApiContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { getApiUrl } from '../config';

const ApiContext = createContext('');

export const ApiProvider = ({ children }) => {
  const [apiUrl, setApiUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initApi = async () => {
      try {
        const url = await getApiUrl();
        setApiUrl(url);
      } catch (error) {
        console.error('Error detectando API URL:', error);
        setApiUrl('http://192.168.1.5:8000'); // Fallback
      } finally {
        setLoading(false);
      }
    };
    initApi();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#121212" />
      </View>
    );
  }

  return <ApiContext.Provider value={apiUrl}>{children}</ApiContext.Provider>;
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi debe usarse dentro de ApiProvider');
  }
  return context;
};
