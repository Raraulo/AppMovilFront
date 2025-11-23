// app/(auth)/register.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Vibration,
  View,
} from "react-native";
import { getApiUrl } from "../../config";

// ==================== TOAST PROFESIONAL ====================
const Toast = ({ visible, message, type = "success", onHide }: any) => {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 60,
          useNativeDriver: true,
          friction: 7,
          tension: 65,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -120,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (onHide) onHide();
        });
      }, 3000);
    }
  }, [visible]);

  if (!visible) return null;

  const backgroundColor =
    type === "error"
      ? "rgba(239, 68, 68, 0.95)"
      : type === "success"
      ? "rgba(16, 185, 129, 0.95)"
      : type === "warning"
      ? "rgba(245, 158, 11, 0.95)"
      : "rgba(18, 18, 18, 0.95)";

  const icon =
    type === "success"
      ? "checkmark-circle"
      : type === "error"
      ? "close-circle"
      : type === "warning"
      ? "warning"
      : "information-circle";

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { backgroundColor, transform: [{ translateY }], opacity },
      ]}
    >
      <View style={styles.toastContent}>
        <Ionicons name={icon} size={22} color="#fff" />
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

// ✨ NOTIFICACIÓN DE ÉXITO MEJORADA
const SuccessNotification = ({ visible, onComplete }: any) => {
  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 100,
            useNativeDriver: true,
            friction: 8,
            tension: 50,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 6,
            tension: 40,
          }),
        ]),
        Animated.spring(checkScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 5,
          tension: 50,
        }),
      ]).start();

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Vibration.vibrate([0, 100, 50, 100]);
      }

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -200,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.in(Easing.ease),
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (onComplete) onComplete();
        });
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.successNotificationContainer,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.successNotificationGradient}
      >
        <Animated.View
          style={[
            styles.checkIconContainer,
            { transform: [{ scale: checkScale }] }
          ]}
        >
          <Ionicons name="checkmark-circle" size={56} color="#fff" />
        </Animated.View>
        <Text style={styles.successNotificationTitle}>¡Registro exitoso!</Text>
        <Text style={styles.successNotificationMessage}>
          Tu cuenta ha sido creada correctamente
        </Text>
        <View style={styles.successDots}>
          <View style={styles.successDot} />
          <View style={[styles.successDot, { opacity: 0.6 }]} />
          <View style={[styles.successDot, { opacity: 0.3 }]} />
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export default function RegisterScreen() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [loading, setLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    translateYAnim.setValue(50);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  const showToast = (message: string, type: "success" | "error" | "warning" | "info" = "success") => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(type === "error" ? 100 : 50);
    }
    setToast({ visible: true, message, type });
  };

  const handleSendCode = async () => {
    if (!email.trim()) {
      showToast("Ingresa un correo válido", "warning");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast("El formato del correo no es válido", "error");
      return;
    }

    if (!acceptedTerms) {
      showToast("Debes aceptar los términos y condiciones", "warning");
      return;
    }

    setLoading(true);
    try {
      const API_URL = await getApiUrl();

      const res = await fetch(`${API_URL}/api/auth/send-code/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        showToast("Código enviado a tu correo", "success");
        setTimeout(() => setStep(2), 1000);
      } else {
        showToast(data.message || "Error al enviar código", "error");
      }
    } catch (error) {
      showToast("Error de conexión. Verifica tu red", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length < 6) {
      showToast("Ingresa el código de 6 dígitos", "warning");
      return;
    }

    setLoading(true);
    try {
      const API_URL = await getApiUrl();

      const res = await fetch(`${API_URL}/api/auth/verify-code/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), code }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.cliente_exists && data.cliente) {
          await AsyncStorage.setItem(
            "user",
            JSON.stringify({
              id: data.cliente.id,
              email: data.cliente.email,
              nombre: data.cliente.nombre,
              apellido: data.cliente.apellido,
              celular: data.cliente.celular,
              sexo: data.cliente.sexo,
            })
          );

          await AsyncStorage.setItem("showWelcome", "true");
          await AsyncStorage.setItem("username", data.cliente.nombre);

          setShowSuccessNotification(true);
        } else {
          showToast("Código verificado correctamente", "success");
          setTimeout(() => setStep(3), 1000);
        }
      } else {
        showToast(data.message || "Código incorrecto", "error");
      }
    } catch (error) {
      showToast("Error de conexión. Verifica tu red", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      showToast("Completa ambos campos de contraseña", "warning");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Las contraseñas no coinciden", "error");
      return;
    }

    if (password.length < 8) {
      showToast("La contraseña debe tener al menos 8 caracteres", "warning");
      return;
    }

    setLoading(true);
    try {
      const API_URL = await getApiUrl();

      const res = await fetch(`${API_URL}/api/auth/create-cliente/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: "Cliente",
          apellido: "Nuevo",
          cedula: "",
          direccion: "",
          celular: "",
          email: email.toLowerCase().trim(),
          sexo: "Hombre",
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        await AsyncStorage.setItem(
          "user",
          JSON.stringify({
            id: data.cliente.id,
            email: data.cliente.email,
            nombre: data.cliente.nombre,
            apellido: data.cliente.apellido,
            celular: "",
            sexo: "Hombre",
          })
        );

        await AsyncStorage.setItem("showWelcome", "true");
        await AsyncStorage.setItem("username", data.cliente.nombre);

        setShowSuccessNotification(true);
      } else {
        showToast(data.message || "Error al crear cuenta", "error");
      }
    } catch (error) {
      showToast("Error de conexión. Verifica tu red", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationComplete = () => {
    setShowSuccessNotification(false);
    router.replace("/(auth)/login");
  };

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 90}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContainer}
          >
            <Animated.View
              style={[
                styles.innerContainer,
                { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] },
              ]}
            >
              {/* LOGO */}
              <Image
                source={require("../../assets/images/logomaison.png")}
                style={styles.logo}
                resizeMode="contain"
              />

              {/* INDICADOR DE PASOS */}
              <View style={styles.stepsIndicator}>
                {[1, 2, 3].map((s) => (
                  <View
                    key={s}
                    style={[
                      styles.stepDot,
                      s === step && styles.stepDotActive,
                      s < step && styles.stepDotCompleted,
                    ]}
                  />
                ))}
              </View>

              {/* STEP 1 - EMAIL */}
              {step === 1 && (
                <>
                  <Text style={styles.title}>Crear una cuenta</Text>
                  <Text style={styles.subtitle}>
                    Ingresa tu correo para comenzar
                  </Text>

                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Correo electrónico"
                      placeholderTextColor="#aaa"
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      returnKeyType="next"
                      editable={!loading}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setAcceptedTerms(!acceptedTerms)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                      {acceptedTerms && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      Acepto los términos y condiciones
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.button,
                      (!acceptedTerms || loading) && styles.buttonDisabled,
                    ]}
                    onPress={handleSendCode}
                    disabled={!acceptedTerms || loading}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? "Enviando..." : "Continuar"}
                    </Text>
                    {!loading && <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />}
                  </TouchableOpacity>
                </>
              )}

              {/* STEP 2 - CÓDIGO */}
              {step === 2 && (
                <>
                  <Text style={styles.title}>Verificar código</Text>
                  <Text style={styles.subtitle}>
                    Ingresa el código enviado a {email}
                  </Text>

                  <View style={styles.inputContainer}>
                    <Ionicons name="keypad-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Código de 6 dígitos"
                      placeholderTextColor="#aaa"
                      style={styles.input}
                      value={code}
                      onChangeText={setCode}
                      keyboardType="numeric"
                      maxLength={6}
                      returnKeyType="done"
                      editable={!loading}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleVerifyCode}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? "Verificando..." : "Verificar código"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* STEP 3 - CONTRASEÑA */}
              {step === 3 && (
                <>
                  <Text style={styles.title}>Crear contraseña</Text>
                  <Text style={styles.subtitle}>
                    Elige una contraseña segura
                  </Text>

                  {/* Contraseña */}
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Contraseña (mín. 8 caracteres)"
                      placeholderTextColor="#aaa"
                      style={styles.input}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      returnKeyType="next"
                      editable={!loading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Confirmar contraseña */}
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Confirmar contraseña"
                      placeholderTextColor="#aaa"
                      style={styles.input}
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      returnKeyType="done"
                      editable={!loading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeIcon}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleCreateAccount}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? "Creando cuenta..." : "Crear cuenta"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Botón volver */}
              <TouchableOpacity
                style={styles.backLink}
                onPress={() => (step === 1 ? router.back() : setStep(step - 1))}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={18} color="#666" />
                <Text style={styles.backLinkText}>
                  {step === 1 ? "Volver al inicio" : "Paso anterior"}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* ✅ NOTIFICACIONES FLOTANTES (FUERA DEL KEYBOARDAVOIDINGVIEW) */}
      <SuccessNotification
        visible={showSuccessNotification}
        onComplete={handleNotificationComplete}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingBottom: 120,
  },
  innerContainer: {
    width: "100%",
    paddingHorizontal: 30,
    alignItems: "center",
  },
  logo: { width: 200, height: 200, marginBottom: 20 },
  
  // Indicador de pasos
  stepsIndicator: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 30,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
  },
  stepDotActive: {
    width: 30,
    backgroundColor: '#000',
  },
  stepDotCompleted: {
    backgroundColor: '#10B981',
  },

  title: { 
    fontSize: 28, 
    fontWeight: "700", 
    color: "#000", 
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Input mejorado
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: "100%",
    height: 56,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#121212",
  },
  eyeIcon: {
    padding: 8,
  },

  // Checkbox mejorado
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    width: '100%',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  checkboxLabel: { 
    flex: 1,
    color: "#666", 
    fontSize: 14,
    lineHeight: 20,
  },

  // Botón mejorado
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 10,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
  },
  buttonText: { 
    color: "#fff", 
    fontWeight: "700", 
    fontSize: 16,
    letterSpacing: 0.5,
  },

  // Link volver
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 30,
  },
  backLinkText: { 
    color: "#666", 
    fontSize: 15,
  },

  // ✅ TOAST
  toastContainer: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    borderRadius: 16,
    zIndex: 999999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 999,
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
    letterSpacing: 0.3,
  },

  // ✅ NOTIFICACIÓN DE ÉXITO MEJORADA
  successNotificationContainer: {
    position: 'absolute',
    top: 0,
    left: 30,
    right: 30,
    zIndex: 999999,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 999,
  },
  successNotificationGradient: {
    padding: 32,
    alignItems: 'center',
  },
  checkIconContainer: {
    marginBottom: 16,
  },
  successNotificationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: "#fff",
    marginBottom: 8,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  successNotificationMessage: {
    fontSize: 15,
    color: "#fff",
    opacity: 0.95,
    textAlign: 'center',
    lineHeight: 22,
  },
  successDots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  successDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
});
