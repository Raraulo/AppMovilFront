import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const API_URL = "http://192.168.1.5:8000";

export default function ProfileScreen() {
  const router = useRouter();

  const [cliente, setCliente] = useState<any>(null);
  const [isLogged, setIsLogged] = useState(false);
  const [mostrarPerfil, setMostrarPerfil] = useState(false);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [cedula, setCedula] = useState("");
  const [direccion, setDireccion] = useState("");
  const [celular, setCelular] = useState("");
  const [sexo, setSexo] = useState("Hombre");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    Animated.spring(translateAnim, { toValue: 0, speed: 1, bounciness: 10, useNativeDriver: true }).start();
  }, []);

  // 🔹 Carga inicial del cliente (busca por email y guarda el ID real)
  useEffect(() => {
    const fetchCliente = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        const access = (await AsyncStorage.getItem("access")) || (await AsyncStorage.getItem("token"));
        if (!storedUser || !access) {
          setIsLogged(false);
          return;
        }

        setIsLogged(true);
        const userData = JSON.parse(storedUser);

        const res = await fetch(`${API_URL}/api/clientes/`, {
          headers: { Accept: "application/json" },
        });

        if (!res.ok) throw new Error("No se pudo cargar clientes");

        const clientes = await res.json();
        const data = clientes.find((c: any) => c.email === userData.email);

        if (data) {
          setCliente(data);
          await AsyncStorage.setItem("cliente_id", data.id.toString());
          setNombre(data.nombre || "");
          setApellido(data.apellido || "");
          setCedula(data.cedula || "");
          setDireccion(data.direccion || "");
          setCelular(data.celular || "");
          setSexo(data.sexo || "Hombre");
        } else {
          console.log("⚠️ No se encontró cliente con email:", userData.email);
        }
      } catch (e) {
        console.log("⚠️ Error cargando cliente:", e);
        Alert.alert("Error", "No se pudieron cargar los datos del cliente");
      }
    };

    fetchCliente();
  }, []);

  // 🔹 Guardar cambios
  const handleSave = async () => {
    try {
      const access = (await AsyncStorage.getItem("access")) || (await AsyncStorage.getItem("token"));
      const clienteId = await AsyncStorage.getItem("cliente_id");

      if (!access || !clienteId) {
        Alert.alert("Sesión", "Vuelve a iniciar sesión para actualizar tus datos.");
        return;
      }

      const res = await fetch(`${API_URL}/api/clientes/secure/update/${clienteId}/`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
        } as any,
        body: JSON.stringify({ nombre, apellido, cedula, direccion, celular, sexo }),
      });

      if (res.ok) {
        Alert.alert("Éxito", "Datos actualizados correctamente");
      } else {
        const err = await res.json().catch(() => ({} as any));
        Alert.alert("Error", err?.message || "No se pudo actualizar el cliente");
      }
    } catch {
      Alert.alert("Error", "Hubo un problema con la conexión");
    }
  };

  // 🔹 Confirmar cierre de sesión
  const confirmLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que deseas cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, salir",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.multiRemove(["user", "token", "access", "refresh", "cliente_id"]);
            router.replace("/(auth)/login");
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleFacturas = () => router.push("/facturas");

  const getPrimerNombre = (nombreCompleto: string) => {
    if (!nombreCompleto) return "";
    const primerNombre = nombreCompleto.split(" ")[0];
    return primerNombre.charAt(0).toUpperCase() + primerNombre.slice(1).toLowerCase();
  };

  // 🔹 Si no hay sesión
  if (!isLogged) {
    return (
      <Animated.View
        style={[styles.notLoggedContainer, { opacity: fadeAnim, transform: [{ translateY: translateAnim }] }]}
      >
        <Ionicons name="person-circle-outline" size={120} color="#4B5563" />
        <Text style={styles.welcomeText}>¡Bonjour!</Text>
        <Text style={styles.infoText}>
          Inicia sesión para ver tu perfil, tus facturas y tus productos favoritos.
        </Text>

        <TouchableOpacity style={styles.loginButton} onPress={() => router.replace("/(auth)/login")}>
          <Ionicons name="log-in-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.loginText}>Iniciar Sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.registerButton} onPress={() => router.push("/(auth)/register")}>
          <Ionicons name="person-add-outline" size={20} color="#1F2937" style={{ marginRight: 6 }} />
          <Text style={styles.registerText}>Crear Cuenta</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (!cliente) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <View style={styles.topButtonsContainer}>
        <TouchableOpacity style={styles.facturaButton} onPress={handleFacturas}>
          <Ionicons name="receipt-outline" size={22} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContainer}
        enableOnAndroid
        extraScrollHeight={100}
        keyboardOpeningTime={0}
        showsVerticalScrollIndicator={false}
      >
        <Ionicons name="person-circle-outline" size={110} color="#6B7280" style={{ marginTop: 120 }} />
        <Text style={styles.title}>Bonjour {getPrimerNombre(nombre)}</Text>

        <TouchableOpacity style={styles.profileButton} onPress={() => setMostrarPerfil(!mostrarPerfil)}>
          <Text style={styles.profileButtonText}>
            {mostrarPerfil ? "Ocultar Perfil" : "Ver Mi Perfil"}
          </Text>
        </TouchableOpacity>

        {mostrarPerfil ? (
          <>
            <TextInput style={styles.inputDisabled} value={cliente.email} editable={false} />
            <TextInput style={styles.input} placeholder="Nombre" value={nombre} onChangeText={setNombre} />
            <TextInput style={styles.input} placeholder="Apellido" value={apellido} onChangeText={setApellido} />
            <TextInput
              style={styles.input}
              placeholder="Cédula"
              value={cedula}
              onChangeText={setCedula}
              keyboardType="numeric"
            />
            <TextInput style={styles.input} placeholder="Dirección" value={direccion} onChangeText={setDireccion} />
            <TextInput
              style={styles.input}
              placeholder="Celular"
              value={celular}
              onChangeText={setCelular}
              keyboardType="phone-pad"
            />
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={sexo} onValueChange={(v) => setSexo(v)} style={styles.picker}>
                <Picker.Item label="Hombre" value="Hombre" />
                <Picker.Item label="Mujer" value="Mujer" />
              </Picker>
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>Guardar Cambios</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.stepsTitle}>COMPRA TUS PRODUCTOS FAVORITOS EN 4 PASOS</Text>
            <View style={styles.stepsGrid}>
              {[
                { icon: "cart-outline", title: "COMPRA", text: "Agrega tus productos al carrito." },
                { icon: "mail-outline", title: "REVISA", text: "Recibirás un correo cuando esté listo." },
                { icon: "bag-outline", title: "RETIRA", text: "Ve a tu tienda y recoge tu pedido." },
                { icon: "help-circle-outline", title: "AYUDA", text: "Nuestro equipo te asistirá." },
              ].map((s, i) => (
                <View key={i} style={styles.stepCard}>
                  <Ionicons name={s.icon as any} size={38} color="#fff" />
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Text style={styles.stepText}>{s.text}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity
          onPress={() => Linking.openURL("https://www.victoriassecretbeauty.ec/politicas-de-bopis")}
          style={{ marginTop: 35 }}
        >
          <Text style={styles.politicasLink}>Ver Políticas</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { padding: 20, alignItems: "center", paddingBottom: 80 },
  topButtonsContainer: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  notLoggedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    backgroundColor: "#F9FAFB",
  },
  welcomeText: { fontSize: 28, fontWeight: "700", color: "#000000ff", marginTop: 10 },
  infoText: { fontSize: 16, color: "#000000ff", textAlign: "center", marginVertical: 15, lineHeight: 22 },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginTop: 10,
  },
  loginText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  registerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E5E7EB",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginTop: 12,
  },
  registerText: { color: "#1F2937", fontSize: 16, fontWeight: "bold" },
  title: { fontSize: 26, fontWeight: "700", color: "#1F2937", marginTop: 10, marginBottom: 20 },
  profileButton: {
    backgroundColor: "#D1D5DB",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
  },
  profileButtonText: { fontSize: 16, fontWeight: "bold", color: "#000000ff" },
  input: {
    backgroundColor: "#fff",
    width: "100%",
    padding: 14,
    borderRadius: 10,
    marginVertical: 6,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  inputDisabled: {
    backgroundColor: "#E5E7EB",
    width: "100%",
    padding: 14,
    borderRadius: 10,
    marginVertical: 6,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  pickerWrapper: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginVertical: 6,
  },
  picker: { width: "100%" },
  saveButton: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 15,
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  facturaButton: {
    width: 45,
    height: 45,
    backgroundColor: "#6B7280",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutButton: {
    width: 45,
    height: 45,
    backgroundColor: "#DC2626",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000ff",
    textAlign: "center",
    marginVertical: 10,
  },
  stepsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 15,
    marginTop: 10,
  },
  stepCard: {
    width: 160,
    height: 160,
    borderRadius: 20,
    backgroundColor: "#000000ff",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  stepTitle: { fontWeight: "bold", marginTop: 6, color: "#fff" },
  stepText: { fontSize: 13, textAlign: "center", marginTop: 3, color: "#E5E7EB" },
  politicasLink: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#111827",
    textDecorationLine: "underline",
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F9FAFB" },
  loadingText: { fontSize: 18, fontWeight: "600", color: "#000000ff" },
});
