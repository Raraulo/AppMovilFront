import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  TouchableWithoutFeedback
} from "react-native";
import { API_URL } from "../../config";

export default function RegisterScreen() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
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
  }, [step]);

  // --- Funciones principales ---
  const handleSendCode = async () => {
    if (!email) return alert("❌ Ingresa un correo válido");
    if (!acceptedTerms) return alert("❌ Debes aceptar los términos y condiciones");

    try {
      const res = await fetch(`${API_URL}/api/auth/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        alert("✅ Código enviado al correo");
        setStep(2);
      } else alert(data.message || "Error al enviar código");
    } catch {
      alert("⚠️ Error de conexión");
    }
  };

  const handleVerifyCode = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (res.ok) {
        alert("✅ Código válido");
        setStep(3);
      } else alert(data.message || "Código incorrecto");
    } catch {
      alert("⚠️ Error de conexión");
    }
  };

  const handleCreateAccount = async () => {
    if (password !== confirmPassword)
      return alert("❌ Las contraseñas no coinciden");

    try {
      const res = await fetch(`${API_URL}/api/auth/create-cliente`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: "SinNombre",
          apellido: "Cliente",
          cedula: "",
          direccion: "",
          celular: "",
          email,
          sexo: "Hombre",
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Cuenta creada con éxito");

        if (data.token && data.user) {
          await AsyncStorage.setItem("token", data.token);
          await AsyncStorage.setItem("user", JSON.stringify(data.user));
          router.replace("/(tabs)/profile");
        } else {
          router.replace("/(auth)/login");
        }
      } else {
        alert(data.message || "Error al crear cuenta");
      }
    } catch {
      alert("⚠️ Error de conexión");
    }
  };

  // --- Render ---
  return (
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
              { opacity: fadeAnim, transform: [{ translateY }] },
            ]}
          >
            <Image
              source={require("../../assets/images/logomaison.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            {/* STEP 1 */}
            {step === 1 && (
              <>
                <Text style={styles.title}>Crear una cuenta</Text>
                <TextInput
                  placeholder="Correo electrónico"
                  placeholderTextColor="#aaa"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                />

                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setAcceptedTerms(!acceptedTerms)}
                >
                  <Ionicons
                    name={acceptedTerms ? "checkbox-outline" : "square-outline"}
                    size={24}
                    color={acceptedTerms ? "#121212" : "#aaa"}
                  />
                  <Text style={styles.checkboxLabel}>
                    Acepto los términos y condiciones
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: acceptedTerms ? "#121212" : "#ccc" },
                  ]}
                  onPress={handleSendCode}
                  disabled={!acceptedTerms}
                >
                  <Text style={styles.buttonText}>Enviar código</Text>
                </TouchableOpacity>
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                <Text style={styles.title}>Verificar Código</Text>
                <TextInput
                  placeholder="Ingresa el código"
                  placeholderTextColor="#aaa"
                  style={styles.input}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="numeric"
                  maxLength={6}
                  returnKeyType="done"
                />

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: "#121212" }]}
                  onPress={handleVerifyCode}
                >
                  <Text style={styles.buttonText}>Verificar</Text>
                </TouchableOpacity>
              </>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <>
                <Text style={styles.title}>Crear Contraseña</Text>
                <TextInput
                  placeholder="Contraseña"
                  placeholderTextColor="#aaa"
                  style={styles.input}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  returnKeyType="next"
                />
                <TextInput
                  placeholder="Confirmar contraseña"
                  placeholderTextColor="#aaa"
                  style={styles.input}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  returnKeyType="done"
                />

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: "#121212" }]}
                  onPress={handleCreateAccount}
                >
                  <Text style={styles.buttonText}>Crear Cuenta</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Back button */}
            <TouchableOpacity
              style={{ marginTop: 20 }}
              onPress={() => (step === 1 ? router.back() : setStep(step - 1))}
            >
              <Text style={styles.link}>← Volver</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    paddingBottom: 80, // 👈 Espacio extra para teclado
  },
  innerContainer: { width: "100%", paddingHorizontal: 30, alignItems: "center" },
  logo: { width: 220, height: 220, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "bold", color: "#000", marginBottom: 30 },
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
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  checkboxLabel: { marginLeft: 10, color: "#121212", fontSize: 14 },
  button: {
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
    width: "100%",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  link: { color: "#000", textAlign: "center", fontSize: 16 },
});
