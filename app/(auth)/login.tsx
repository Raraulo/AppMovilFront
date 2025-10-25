import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../../config";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
  }, []);

  const showAlert = (title: string, message: string) => {
    Alert.alert(title, message, [{ text: "Aceptar", style: "default" }]);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert("⚠️ Campos incompletos", "Ingresa tu correo y contraseña.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.access) {
        // ✅ Guardar token y datos del usuario
        await AsyncStorage.setItem("token", data.access);
        await AsyncStorage.setItem("user", JSON.stringify(data));

        showAlert("✅ Bienvenido", `Hola ${data.username || "usuario"}`);
        router.replace("/(tabs)");
      } else {
        // 🔹 Manejo de errores más detallado
        const errorMessage =
          data.detail ||
          data.non_field_errors?.[0] ||
          "Credenciales incorrectas.";
        showAlert("❌ Error", errorMessage);
      }
    } catch (error) {
      console.error("Login error:", error);
      showAlert(
        "⚠️ Error de conexión",
        "No se pudo conectar con el servidor. Verifica tu red."
      );
    }
  };

  const handleGuestAccess = () => router.replace("/(tabs)");
  const goToRegister = () => router.push("/(auth)/register");

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
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
          />

          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="Contraseña"
              placeholderTextColor="#A0A0A0"
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.showPasswordButton}
            >
              <Text style={styles.showPasswordText}>
                {showPassword ? "Ocultar" : "Ver"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity>
            <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.guestButton]}
            onPress={handleGuestAccess}
          >
            <Text style={styles.guestButtonText}>Entrar como Invitado</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={goToRegister}>
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
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  innerContainer: { width: "100%", paddingHorizontal: 30, alignItems: "center" },
  logo: { width: 220, height: 220, marginBottom: 30 },
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
  },
  showPasswordButton: { paddingHorizontal: 10 },
  showPasswordText: { color: "#4A4A4A", fontSize: 14, fontWeight: "600" },
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
    width: "100%",
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
