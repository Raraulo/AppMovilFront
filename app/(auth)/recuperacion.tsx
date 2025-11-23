// app/(auth)/recuperacion.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Easing,
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

const { width } = Dimensions.get("window");

// Toast Component
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

export default function RecuperacionScreen() {
  const router = useRouter();
  const apiUrl = useApi();

  // Estados del flujo
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Email, 2: Código, 3: Nueva contraseña
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(type === 'error' ? 100 : 50);
    }
    setToast({ visible: true, message, type });
  };

  // PASO 1: Enviar código al correo
  const handleSendCode = async () => {
    if (!email.trim()) {
      showToast('Ingresa tu correo electrónico', 'warning');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('Formato de correo inválido', 'error');
      return;
    }

    setIsLoading(true);

    try {
      console.log('📧 Enviando código a:', email);

      const res = await fetch(`${apiUrl}/api/password-reset/request/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast('Código enviado a tu correo', 'success');
        setStep(2);
      } else {
        if (res.status === 404) {
          showToast('Este correo no está registrado', 'error');
        } else {
          showToast(data.message || 'Error al enviar código', 'error');
        }
      }
    } catch (error: any) {
      console.error('Error:', error);
      if (error.message.includes('Network')) {
        showToast('Sin conexión a internet', 'error');
      } else {
        showToast('Error de conexión con el servidor', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // PASO 2: Verificar código
  const handleVerifyCode = async () => {
    if (!codigo.trim()) {
      showToast('Ingresa el código de verificación', 'warning');
      return;
    }

    if (codigo.length !== 6) {
      showToast('El código debe tener 6 dígitos', 'error');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Verificando código...');

      const res = await fetch(`${apiUrl}/api/password-reset/verify/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(), 
          code: codigo 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast('Código verificado correctamente', 'success');
        setStep(3);
      } else {
        if (res.status === 400) {
          showToast('Código inválido o expirado', 'error');
        } else {
          showToast(data.message || 'Error al verificar código', 'error');
        }
      }
    } catch (error: any) {
      console.error(' Error:', error);
      if (error.message.includes('Network')) {
        showToast('Sin conexión a internet', 'error');
      } else {
        showToast('Error de conexión con el servidor', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // PASO 3: Cambiar contraseña
  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      showToast('Completa ambos campos', 'warning');
      return;
    }

    if (newPassword.length < 8) {
      showToast('La contraseña debe tener al menos 8 caracteres', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Las contraseñas no coinciden', 'error');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔒 Cambiando contraseña...');

      const res = await fetch(`${apiUrl}/api/password-reset/confirm/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          code: codigo,
          new_password: newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast('Contraseña actualizada exitosamente', 'success');
        
        setTimeout(() => {
          router.replace("/(auth)/login");
        }, 2000);
      } else {
        showToast(data.message || 'Error al cambiar contraseña', 'error');
      }
    } catch (error: any) {
      console.error(' Error:', error);
      if (error.message.includes('Network')) {
        showToast('Sin conexión a internet', 'error');
      } else {
        showToast('Error de conexión con el servidor', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (step === 1) {
      router.back();
    } else {
      setStep((prev) => (prev - 1) as 1 | 2);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recuperar contraseña</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Indicador de pasos */}
          <View style={styles.stepsIndicator}>
            {[1, 2, 3].map((s) => (
              <View key={s} style={styles.stepWrapper}>
                <View style={[styles.stepDot, step >= s && styles.stepDotActive]}>
                  {step > s ? (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  ) : (
                    <Text style={[styles.stepNumber, step >= s && styles.stepNumberActive]}>
                      {s}
                    </Text>
                  )}
                </View>
                {s < 3 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
              </View>
            ))}
          </View>

          {/* PASO 1: Ingresar correo */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="mail-outline" size={60} color="#000" />
              </View>
              <Text style={styles.title}>Ingresa tu correo</Text>
              <Text style={styles.subtitle}>
                Te enviaremos un código de verificación para restablecer tu contraseña
              </Text>

              <TextInput
                style={styles.input}
                placeholder="correo@ejemplo.com"
                placeholderTextColor="#A0A0A0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSendCode}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Enviando...' : 'Enviar código'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* PASO 2: Verificar código */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="shield-checkmark-outline" size={60} color="#000" />
              </View>
              <Text style={styles.title}>Verifica tu código</Text>
              <Text style={styles.subtitle}>
                Ingresa el código de 6 dígitos que enviamos a {email}
              </Text>

              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="000000"
                placeholderTextColor="#A0A0A0"
                value={codigo}
                onChangeText={setCodigo}
                keyboardType="number-pad"
                maxLength={6}
                editable={!isLoading}
              />

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleVerifyCode}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Verificando...' : 'Verificar código'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleSendCode}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.resendText}>Reenviar código</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* PASO 3: Nueva contraseña */}
          {step === 3 && (
            <View style={styles.stepContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="lock-closed-outline" size={60} color="#000" />
              </View>
              <Text style={styles.title}>Nueva contraseña</Text>
              <Text style={styles.subtitle}>
                Crea una contraseña segura de al menos 8 caracteres
              </Text>

              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, { flex: 1, paddingRight: 45 }]}
                  placeholder="Nueva contraseña"
                  placeholderTextColor="#A0A0A0"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.eyeIcon}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#4A4A4A"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, { flex: 1, paddingRight: 45 }]}
                  placeholder="Confirmar contraseña"
                  placeholderTextColor="#A0A0A0"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#4A4A4A"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Actualizando...' : 'Cambiar contraseña'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 30,
  },
  content: {
    paddingHorizontal: 30,
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e8e8e8',
  },
  stepDotActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#999',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e8e8e8',
    marginHorizontal: 5,
  },
  stepLineActive: {
    backgroundColor: '#000',
  },
  stepContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  input: {
    width: '100%',
    height: 55,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 18,
    marginBottom: 15,
    fontSize: 16,
    color: '#121212',
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 10,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  button: {
    backgroundColor: '#121212',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  resendButton: {
    marginTop: 20,
  },
  resendText: {
    color: '#4A4A4A',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
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
});
