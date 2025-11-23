// app/(auth)/login.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { useApi } from "../../contexts/ApiContext";

const { width, height } = Dimensions.get("window");

// ✨ COMPONENTE TOAST FLOTANTE
interface ToastProps {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onHide: () => void;
}

const Toast = ({ visible, message, type, onHide }: ToastProps) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 60,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => onHide());
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const config = {
    success: { icon: 'checkmark-circle', bg: '#10B981' },
    error: { icon: 'close-circle', bg: '#EF4444' },
    warning: { icon: 'alert-circle', bg: '#F59E0B' },
    info: { icon: 'information-circle', bg: '#3B82F6' },
  };

  const { icon, bg } = config[type];

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { backgroundColor: bg, transform: [{ translateY }], opacity }
      ]}
    >
      <Ionicons name={icon as any} size={24} color="#fff" />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

export default function LoginScreen() {
  const router = useRouter();
  const apiUrl = useApi();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado Toast
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });
  
  // Animaciones del formulario
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  
  // Animaciones del logo
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;
  const logoGlow = useRef(new Animated.Value(0)).current;
  const logoExpand = useRef(new Animated.Value(1)).current;
  const finalFadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 30,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(logoGlow, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(logoGlow, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.delay(1000),
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.15,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(logoExpand, {
        toValue: 15,
        duration: 800,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(finalFadeOut, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]);

    sequence.start();

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showSplash) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showSplash]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(type === 'error' ? 100 : 50);
    }
    setToast({ visible: true, message, type });
  };

  const handleLogin = async () => {
    // Validaciones
    if (!email.trim() || !password.trim()) {
      showToast('Por favor completa todos los campos', 'warning');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('Formato de correo inválido', 'error');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Intentando login...');
      
      const res = await fetch(`${apiUrl}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });

      const data = await res.json();
      console.log('📡 Respuesta del servidor:', res.status);

      if (res.ok && data.access) {
        // Login exitoso
        await AsyncStorage.setItem("token", data.access);
        await AsyncStorage.setItem("user", JSON.stringify(data));
        await AsyncStorage.setItem("showWelcome", "true");
        await AsyncStorage.setItem("username", data.username || "usuario");

        
        setTimeout(() => {
          router.replace("/(tabs)");
        }, 1000);
      } else {
        // Errores específicos
        if (res.status === 401) {
          showToast('Contraseña incorrecta', 'error');
        } else if (res.status === 404 || data.detail?.includes('No active account')) {
          showToast('Este correo no está registrado', 'error');
        } else if (data.detail) {
          showToast(data.detail, 'error');

        } else {
          showToast('Credenciales incorrectas', 'error');
        }
      }
    } catch (error: any) {
      console.error('Error de login:', error);
      
      // Detectar problemas de red
      if (error.message === 'Network request failed' || 
          error.message.includes('fetch') ||
          error.message.includes('timeout')) {
        showToast('Sin conexión a internet. Verifica tu red', 'error');
      } else {
        showToast('Error de conexión con el servidor', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ CERRAR TODA SESIÓN AL ENTRAR COMO INVITADO
  const handleGuestAccess = async () => {
    try {
      console.log('🔓 Cerrando todas las sesiones activas...');
      
      // Limpiar TODA la sesión anterior
      await AsyncStorage.multiRemove([
        "user",
        "token",
        "access",
        "refresh",
        "cliente_id",
        "showWelcome",
        "username",
        "tarjetas_wawallet",
        "tarjeta_waactiva",
        "profile_updated",
        "notification_dismissed",
      ]);
      
      // Configurar sesión de invitado
      await AsyncStorage.setItem("showWelcome", "true");
      await AsyncStorage.setItem("username", "Invitado");
      
      showToast('Entrando como invitado...', 'info');
      
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 1000);
    } catch (error) {
      console.error('Error al configurar sesión de invitado:', error);
      showToast('Error al entrar como invitado', 'error');
    }
  };

  const goToRegister = () => router.push("/(auth)/register");
  const goToRecovery = () => router.push("/(auth)/recuperacion");

  const rotateInterpolation = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // ✅ Splash Screen
  if (showSplash) {
    return (
      <Animated.View style={[styles.splashContainer, { opacity: finalFadeOut }]}>
        <View style={styles.baseBackground} />
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              opacity: logoOpacity,
              transform: [
                { scale: Animated.multiply(Animated.multiply(logoScale, logoPulse), logoExpand) },
                { rotate: rotateInterpolation },
              ],
            },
          ]}
        >
          <Animated.View style={[styles.logoGlow, { opacity: logoGlow }]}>
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']}
              style={styles.glowGradient}
            />
          </Animated.View>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.splashLogo}
            resizeMode="cover"
          />
        </Animated.View>
      </Animated.View>
    );
  }

  // ✅ Login Form
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.innerContainer,
            { opacity: fadeAnim, transform: [{ translateY }] },
          ]}
        >
          <Image
            source={require("../../assets/images/logomaison.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <TextInput
            placeholder="Correo electrónico"
            placeholderTextColor="#A0A0A0"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="Contraseña"
              placeholderTextColor="#A0A0A0"
              style={[styles.input, { flex: 1, paddingRight: 45 }]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#4A4A4A"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={goToRecovery} activeOpacity={0.7}>
            <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <Text style={styles.buttonText}>Iniciando sesión...</Text>
            ) : (
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.guestButton]}
            onPress={handleGuestAccess}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <Ionicons name="person-outline" size={20} color="#121212" style={{ marginRight: 8 }} />
            <Text style={styles.guestButtonText}>Entrar como Invitado</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={goToRegister} activeOpacity={0.7}>
            <Text style={styles.registerLink}>
              ¿No tienes cuenta?{" "}
              <Text style={styles.registerLinkBold}>Regístrate</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Toast
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    zIndex: 9999,
    elevation: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },

  // Splash
  splashContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: 'center',
    alignItems: 'center',
  },
  baseBackground: {
    position: "absolute",
    width: width,
    height: height,
    backgroundColor: "#FFFFFF",
  },
  logoWrapper: {
    width: 300,
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  logoGlow: {
    position: "absolute",
    width: 400,
    height: 400,
    justifyContent: "center",
    alignItems: "center",
  },
  glowGradient: {
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  splashLogo: {
    width: 300,
    height: 300,
    borderRadius: 150,
  },

  // Form
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  innerContainer: {
    width: "100%",
    paddingHorizontal: 30,
    alignItems: "center",
  },
  logo: { width: 220, height: 220, marginBottom: 20 },
  input: {
    width: "100%",
    height: 55,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 18,
    marginVertical: 10,
    fontSize: 16,
    color: "#121212",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 10,
    position: "relative",
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    padding: 5,
  },
  link: {
    color: "#4A4A4A",
    fontSize: 14,
    marginVertical: 10,
    textDecorationLine: "underline",
  },
  button: {
    backgroundColor: "#121212",
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    flexDirection: 'row',
  },
  buttonDisabled: {
    backgroundColor: "#999",
  },
  buttonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  guestButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#121212",
    marginTop: 10,
  },
  guestButtonText: { color: "#121212", fontWeight: "700", fontSize: 16 },
  registerLink: {
    color: "#4A4A4A",
    fontSize: 14,
    marginTop: 25,
    textAlign: "center",
  },
  registerLinkBold: { color: "#121212", fontWeight: "700" },
});
