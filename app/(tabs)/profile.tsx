import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  useFonts,
} from "@expo-google-fonts/playfair-display";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const { width, height } = Dimensions.get("window");

const API_URL = "http://172.22.19.248:8000";

// URL DE IMAGEN ÚNICA (Reemplaza el carrusel)
const IMAGE_URI = 'https://w.wallhaven.cc/full/nz/wallhaven-nzk25y.jpg';

// No se usa SLIDE_INTERVAL ya que no hay carrusel

export default function ProfileScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
  });

  // --- INICIALIZACIÓN DE ESTADOS Y REFERENCIAS ---
  const [cliente, setCliente] = useState<any>(null);
  const [isLogged, setIsLogged] = useState(false);
  const [mostrarPerfil, setMostrarPerfil] = useState(false);
  
  // Estados de formulario
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [cedula, setCedula] = useState("");
  const [direccion, setDireccion] = useState("");
  const [celular, setCelular] = useState("");
  const [sexo, setSexo] = useState("Hombre");

  // Animaciones 
  const fadeAnim = useRef(new Animated.Value(0)).current; 
  const translateAnim = useRef(new Animated.Value(40)).current; 
  // -----------------------------------------------------------

  // El useEffect para el carrusel automático ha sido eliminado.

  // 1. Lógica de Animación Inicial del Contenido
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(translateAnim, { toValue: 0, speed: 1, bounciness: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  // 2. Lógica de Carga de Datos del Cliente
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
        }
      } catch {
        Alert.alert("Error", "No se pudieron cargar los datos del cliente");
      }
    };

    fetchCliente();
  }, []);

  // Funciones de manejo
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

      if (res.ok) Alert.alert("Éxito", "Datos actualizados correctamente");
      else Alert.alert("Error", "No se pudo actualizar el cliente");
    } catch {
      Alert.alert("Error", "Hubo un problema con la conexión");
    }
  };

  const confirmLogout = () => {
    Alert.alert("Cerrar sesión", "¿Seguro que deseas salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(["user", "token", "access", "refresh", "cliente_id"]);
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleFacturas = () => router.push("/facturas");
  const handleManageCards = () => router.push('/carrito/mis-tarjetas'); 

  // --- Renderización ---

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  // 🛑 ESTADO NO LOGUEADO (Imagen estática sin filtro, bloque subido)
  if (!isLogged) {
    return (
      <Animated.View
        style={[styles.notLoggedContainer, { opacity: fadeAnim, transform: [{ translateY: translateAnim }] }]}
      >
        {/* Imagen Estática de Fondo */}
        <View style={StyleSheet.absoluteFill}>
          {/* Aquí se ajusta el tamaño de la imagen para simular "alejamiento" */}
          <Image source={{ uri: IMAGE_URI }} style={styles.staticImage} resizeMode="cover" />
        </View>
        
        {/* Contenido de Botones (Subido) */}
        <View style={styles.notLoggedContent}>
          <Text style={styles.infoTextVideo}>
            Inicia sesión o crea una cuenta para ver tus pedidos, facturas y datos de perfil.
          </Text>

          {/* Botones Compactos con BORDES AFILADOS */}
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace("/(auth)/login")}>
            <Ionicons name="log-in-outline" size={18} color="#000" style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>INICIAR SESIÓN</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/(auth)/register")}>
            <Ionicons name="person-add-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.secondaryButtonText}>CREAR CUENTA</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }
  // ----------------------------------------------------

  if (!cliente) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  // ✅ ESTADO LOGUEADO
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={30} color="#000" />
        <Text style={styles.titleHeader}>Mi Perfil</Text>
        <View style={{ width: 30 }} />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContainer}
        enableOnAndroid
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionButton} onPress={handleFacturas}>
            <Ionicons name="receipt-outline" size={20} color="#000" />
            <Text style={styles.actionText}>Ver Facturas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleManageCards}>
            <Ionicons name="card-outline" size={20} color="#000" />
            <Text style={styles.actionText}>Administrar mis tarjetas</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={confirmLogout}>
            <Ionicons name="log-out-outline" size={20} color="#000" />
            <Text style={styles.actionText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.toggleProfile} onPress={() => setMostrarPerfil(!mostrarPerfil)}>
          <Text style={styles.toggleProfileText}>
            {mostrarPerfil ? "Ocultar datos personales" : "Editar mis datos personales"}
          </Text>
          <Ionicons name={mostrarPerfil ? "chevron-up-outline" : "chevron-down-outline"} size={16} color="#000" />
        </TouchableOpacity>

        {mostrarPerfil && (
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
                <Picker.Item label="Hombre" value="Hombre" fontFamily="PlayfairDisplay_400Regular" />
                <Picker.Item label="Mujer" value="Mujer" fontFamily="PlayfairDisplay_400Regular" />
              </Picker>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>Guardar cambios</Text>
            </TouchableOpacity>
          </>
        )}

        {!mostrarPerfil && (
          <>
            <Text style={styles.stepsTitle}>Tus beneficios</Text>
            <View style={styles.stepsGrid}>
              {[
                { icon: "cart-outline", title: "Compra fácil", text: "Explora y agrega tus productos favoritos." },
                { icon: "mail-outline", title: "Recibe avisos", text: "Te notificamos por correo y app." },
                { icon: "bag-outline", title: "Recoge o recibe", text: "Selecciona entrega o retiro en tienda." },
                { icon: "shield-checkmark-outline", title: "Seguridad total", text: "Tu información siempre protegida." },
              ].map((s, i) => (
                <View key={i} style={styles.stepCard}>
                  <Ionicons name={s.icon as any} size={30} color="#000" />
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Text style={styles.stepText}>{s.text}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity
          onPress={() => Linking.openURL("https://www.victoriassecretbeauty.ec/politicas-de-bopis")}
          style={{ marginTop: 30 }}
        >
          <Text style={styles.politicasLink}>Ver políticas de privacidad</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // --- Imagen Estática y No Logueado ---
  notLoggedContainer: { 
    flex: 1, 
    backgroundColor: "#000",
    width: '100%',
    height: '100%',
  },
  staticImage: {
    // Aumentamos el tamaño para simular un "alejamiento"
    width: width * 1.2, 
    height: height * 1.2,
    // Centramos la imagen para que el exceso se recorte uniformemente
    alignSelf: 'center', 
    position: 'absolute',
    top: -(height * 0.1), // Ajusta la posición vertical para centrar mejor
    left: -(width * 0.1), // Ajusta la posición horizontal para centrar mejor
  },
  
  // Contenedor de botones (Compacto, subido y con padding inferior)
  notLoggedContent: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingBottom: 90, 
    paddingTop: 20, 
    // Fondo semitransparente oscuro para asegurar la legibilidad del texto
    backgroundColor: 'rgba(0, 0, 0, 0.65)', 
    zIndex: 5,
  },
  // Texto más pequeño
  infoTextVideo: { 
    fontSize: 13, 
    color: "#fff", 
    textAlign: "center", 
    marginBottom: 20, 
    lineHeight: 18,
    fontFamily: "PlayfairDisplay_400Regular", 
  },
  // Botón primario
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 10, 
    paddingHorizontal: 25, 
    borderRadius: 0, 
    width: '100%', 
    justifyContent: 'center',
    marginTop: 8,
  },
  // Texto de botón
  primaryButtonText: { 
    color: "#000", 
    fontSize: 14, 
    fontFamily: "PlayfairDisplay_600SemiBold",
    letterSpacing: 1.2,
  },
  // Botón secundario
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 2, 
    borderColor: "#fff",
    paddingVertical: 10, 
    paddingHorizontal: 25, 
    borderRadius: 0, 
    width: '100%', 
    justifyContent: 'center',
    marginTop: 10,
  },
  // Texto de botón
  secondaryButtonText: { 
    color: "#fff", 
    fontSize: 14, 
    fontFamily: "PlayfairDisplay_600SemiBold",
    letterSpacing: 1.2,
  },

  // --- Estilos Logueado (Mantenidos) ---
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50, 
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  titleHeader: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 18,
    color: "#000",
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  actionGrid: {
    marginTop: 15,
    marginBottom: 5,
    paddingHorizontal: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  actionText: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 15,
    color: "#000",
    marginLeft: 15,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 8,
  },
  toggleProfile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#d1d1d1",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginVertical: 12,
  },
  toggleProfileText: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    color: "#000",
    fontSize: 14,
  },
  input: {
    backgroundColor: "#fff",
    width: "100%",
    padding: 12,
    borderRadius: 8,
    marginVertical: 5,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#d1d1d1",
    fontFamily: "PlayfairDisplay_400Regular",
  },
  inputDisabled: {
    backgroundColor: "#f0f0f0",
    width: "100%",
    padding: 12,
    borderRadius: 8,
    marginVertical: 5,
    fontSize: 15,
    fontFamily: "PlayfairDisplay_400Regular",
    color: "#555",
  },
  pickerWrapper: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d1d1",
    marginVertical: 5,
    justifyContent: 'center',
  },
  picker: { width: "100%", height: 48 },
  saveButton: {
    backgroundColor: "#000",
    paddingVertical: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 15,
  },
  saveText: { 
    color: "#fff", 
    fontSize: 15, 
    fontFamily: "PlayfairDisplay_600SemiBold",
  },
  stepsTitle: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 18,
    color: "#000",
    textAlign: "left",
    marginVertical: 15,
    paddingLeft: 0,
    width: '100%'
  },
  stepsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  stepCard: {
    width: '48%',
    minHeight: 150,
    borderRadius: 8,
    backgroundColor: "#fafafa",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ededed",
    marginBottom: 10,
  },
  stepTitle: { 
    fontFamily: "PlayfairDisplay_600SemiBold", 
    marginTop: 6, 
    color: "#000", 
    fontSize: 14,
    textAlign: 'center',
  },
  stepText: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 12,
    textAlign: "center",
    marginTop: 3,
    color: "#444",
  },
  politicasLink: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 14,
    color: "#000",
    textDecorationLine: "underline",
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  loadingText: { 
    fontSize: 16, 
    fontFamily: "PlayfairDisplay_600SemiBold", 
    color: "#000" 
  },
});