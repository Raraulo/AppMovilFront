// app/(tabs)/profile.tsx
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  useFonts,
} from "@expo-google-fonts/playfair-display";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useApi } from "../../contexts/ApiContext";

const { width, height } = Dimensions.get("window");

// ✨ TOAST PROFESIONAL
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

// ✨ MODAL DE CONFIRMACIÓN PROFESIONAL
const ConfirmModal = ({ visible, title, message, onConfirm, onCancel, confirmText = "Confirmar", cancelText = "Cancelar" }: any) => {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.confirmModalBackdrop}>
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={onCancel}
        style={styles.confirmModalBackdropTouchable}
      >
        <Animated.View
          style={[
            styles.confirmModalContainer,
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.confirmIconCircle}>
              <Ionicons name="alert-circle-outline" size={48} color="#F59E0B" />
            </View>
            <Text style={styles.confirmTitle}>{title}</Text>
            <Text style={styles.confirmMessage}>{message}</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmButtonPrimary}
                onPress={() => {
                  onConfirm();
                  onCancel();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmButtonTextPrimary}>{confirmText}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButtonSecondary}
                onPress={onCancel}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmButtonTextSecondary}>{cancelText}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

// ✨ NOTIFICACIÓN FLOTANTE PARA ACTUALIZAR DATOS
const UpdateDataNotification = ({ visible, onClose, onUpdate }: any) => {
  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 50,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -150,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.notificationContainer,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <LinearGradient
        colors={['#F59E0B', '#D97706']}
        style={styles.notificationGradient}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationIconContainer}>
            <Ionicons name="information-circle" size={28} color="#fff" />
          </View>
          <View style={styles.notificationTextContainer}>
            <Text style={styles.notificationTitle}>Completa tu perfil</Text>
            <Text style={styles.notificationMessage}>
              Actualiza tus datos personales para una mejor experiencia
            </Text>
          </View>
        </View>
        <View style={styles.notificationActions}>
          <TouchableOpacity 
            style={styles.notificationButtonSecondary}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.notificationButtonSecondaryText}>Después</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.notificationButtonPrimary}
            onPress={onUpdate}
            activeOpacity={0.8}
          >
            <Text style={styles.notificationButtonPrimaryText}>Actualizar ahora</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export default function ProfileScreen() {
  const router = useRouter();
  const apiUrl = useApi();
  const videoRef = useRef<Video>(null);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });

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

  // ✨ Estados para notificaciones
  const [showNotification, setShowNotification] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Animaciones 
  const fadeAnim = useRef(new Animated.Value(0)).current; 
  const translateAnim = useRef(new Animated.Value(40)).current; 

  // ✅ FUNCIÓN PARA MOSTRAR TOAST
  const showToast = (message: string, type: "success" | "error" | "info" | "warning" = "success") => {
    if (Platform.OS === "ios" || Platform.OS === "android") {
      Vibration.vibrate(type === "error" ? 100 : 50);
    }
    setToast({ visible: true, message, type });
  };

  // Animación Inicial
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { 
        toValue: 1, 
        duration: 600, 
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(translateAnim, { 
        toValue: 0, 
        tension: 50,
        friction: 7,
        useNativeDriver: true 
      }),
    ]).start();
  }, []);

  // ✨ Verificar si debe mostrar la notificación
  const checkIfShouldShowNotification = async (clienteData: any) => {
    try {
      const hasUpdated = await AsyncStorage.getItem('profile_updated');
      const isIncomplete = !clienteData.nombre || 
                          !clienteData.apellido || 
                          !clienteData.cedula || 
                          !clienteData.direccion || 
                          !clienteData.celular;

      if (!hasUpdated && isIncomplete) {
        setTimeout(() => {
          setShowNotification(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Error verificando notificación:', error);
    }
  };

  // ✅ FUNCIÓN PARA VERIFICAR SI EL PERFIL ESTÁ COMPLETO
  const isProfileComplete = () => {
    return (
      nombre.trim() !== "" &&
      apellido.trim() !== "" &&
      cedula.trim() !== "" &&
      direccion.trim() !== "" &&
      celular.trim() !== ""
    );
  };

  // ✅ RECARGAR DATOS CUANDO VUELVE A LA PANTALLA
  useFocusEffect(
    useCallback(() => {
      if (apiUrl && isLogged) {
        fetchCliente();
      }
    }, [apiUrl, isLogged])
  );

  // Carga de Datos del Cliente
  useEffect(() => {
    if (!apiUrl) return;
    fetchCliente();
  }, [apiUrl]);

  const fetchCliente = async () => {
    try {
      console.log('📡 Conectando a:', apiUrl);
      
      const storedUser = await AsyncStorage.getItem("user");
      const access = (await AsyncStorage.getItem("access")) || (await AsyncStorage.getItem("token"));
      if (!storedUser || !access) {
        setIsLogged(false);
        return;
      }

      setIsLogged(true);
      const userData = JSON.parse(storedUser);
      const res = await fetch(`${apiUrl}/api/clientes/`, {
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
        console.log('✅ Cliente cargado:', data.email);

        await checkIfShouldShowNotification(data);
      }
    } catch (error) {
      console.error('❌ Error cargando cliente:', error);
      showToast("No se pudieron cargar los datos del cliente", "error");
    }
  };

  const handleSave = async () => { 
    try {
      const access = (await AsyncStorage.getItem("access")) || (await AsyncStorage.getItem("token"));
      const clienteId = await AsyncStorage.getItem("cliente_id");

      if (!access || !clienteId) {
        showToast("Vuelve a iniciar sesión para actualizar", "warning");
        return;
      }

      if (!nombre.trim() || !apellido.trim() || !cedula.trim() || !direccion.trim() || !celular.trim()) {
        showToast("Por favor completa todos los campos", "warning");
        return;
      }

      const res = await fetch(`${apiUrl}/api/clientes/secure/update/${clienteId}/`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
        } as any,
        body: JSON.stringify({ nombre, apellido, cedula, direccion, celular, sexo }),
      });

      if (res.ok) {
        await AsyncStorage.setItem('profile_updated', 'true');
        setShowNotification(false);
        
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          Vibration.vibrate(50);
        }

        showToast("Datos actualizados correctamente", "success");
        console.log('✅ Datos actualizados');
        
        // Recargar datos
        await fetchCliente();
      } else {
        showToast("No se pudo actualizar el cliente", "error");
      }
    } catch (error) {
      console.error('❌ Error actualizando datos:', error);
      showToast("Hubo un problema con la conexión", "error");
    }
  };

  const confirmLogout = () => {
    setConfirmModal({
      visible: true,
      title: "Cerrar sesión",
      message: "¿Estás seguro de que deseas salir de tu cuenta?",
      onConfirm: async () => {
        await AsyncStorage.multiRemove(["user", "token", "access", "refresh", "cliente_id", "profile_updated"]);
        showToast("Sesión cerrada exitosamente", "success");
        setTimeout(() => {
          router.replace("/(auth)/login");
        }, 800);
      },
    });
  };

  const handleFacturas = () => router.push("/facturas");

  // ✅ VALIDAR ANTES DE IR A MIS TARJETAS CON TOAST
  const handleManageCards = () => {
    if (!isProfileComplete()) {
      showToast("Completa tu perfil antes de gestionar tarjetas", "warning");
      setTimeout(() => {
        setMostrarPerfil(true);
      }, 1000);
      return;
    }
    router.push('/(tabs)/mistarjetas');
  };

  const handleCloseNotification = async () => {
    setShowNotification(false);
    await AsyncStorage.setItem('notification_dismissed', 'true');
  };

  const handleUpdateFromNotification = () => {
    setShowNotification(false);
    setMostrarPerfil(true);
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  // 🛑 ESTADO NO LOGUEADO CON VIDEO
  if (!isLogged) {
    return (
      <Animated.View
        style={[styles.notLoggedContainer, { opacity: fadeAnim, transform: [{ translateY: translateAnim }] }]}
      >
        <Video
          ref={videoRef}
          source={require('../../assets/images/inicio.mp4')}
          style={styles.videoBackground}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted
          useNativeControls={false}
        />
        
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.4)']}
          style={styles.videoOverlay}
        />

        <View style={styles.notLoggedContent}>
          <Text style={styles.infoTextVideo}>
            Inicie sesión o regístrese para disfrutar de contenido exclusivo.
          </Text>

          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={() => router.replace("/(auth)/login")}
            activeOpacity={0.85}
          >
            <Ionicons name="log-in-outline" size={20} color="#000" style={{ marginRight: 10 }} />
            <Text style={styles.primaryButtonText}>INICIAR SESIÓN</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => router.push("/(auth)/register")}
            activeOpacity={0.85}
          >
            <Ionicons name="person-add-outline" size={20} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.secondaryButtonText}>CREAR CUENTA</Text>
          </TouchableOpacity>
        </View>
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

  // ✅ ESTADO LOGUEADO
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* ✨ TOAST */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      {/* ✨ MODAL DE CONFIRMACIÓN */}
      <ConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, visible: false })}
      />

      {/* ✨ NOTIFICACIÓN FLOTANTE */}
      <UpdateDataNotification
        visible={showNotification}
        onClose={handleCloseNotification}
        onUpdate={handleUpdateFromNotification}
      />

      {/* ✨ HEADER MEJORADO */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeText}>Hola,</Text>
            <Text style={styles.titleHeader}>{nombre || cliente.email}</Text>
          </View>
        </View>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContainer}
        enableOnAndroid
        showsVerticalScrollIndicator={false}
      >
        {/* ✨ SECCIÓN DE ACCIONES MEJORADA */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Acciones rápidas</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionCard} 
              onPress={handleFacturas}
              activeOpacity={0.85}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="receipt-outline" size={28} color="#000" />
              </View>
              <Text style={styles.actionCardTitle}>Mis facturas</Text>
              <Text style={styles.actionCardSubtitle}>Ver historial</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard} 
              onPress={handleManageCards}
              activeOpacity={0.85}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="card-outline" size={28} color="#000" />
              </View>
              <Text style={styles.actionCardTitle}>Mis tarjetas</Text>
              <Text style={styles.actionCardSubtitle}>Gestionar pagos</Text>
              {!isProfileComplete() && (
                <View style={styles.incompleteBadge}>
                  <Ionicons name="warning" size={12} color="#F59E0B" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ✨ DATOS PERSONALES */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity 
            style={styles.toggleProfile} 
            onPress={() => setMostrarPerfil(!mostrarPerfil)}
            activeOpacity={0.85}
          >
            <View style={styles.toggleLeft}>
              <Ionicons 
                name={mostrarPerfil ? "person" : "person-outline"} 
                size={22} 
                color="#000" 
              />
              <Text style={styles.toggleProfileText}>
                {mostrarPerfil ? "Datos personales" : "Ver datos personales"}
              </Text>
            </View>
            <Ionicons 
              name={mostrarPerfil ? "chevron-up" : "chevron-down"} 
              size={22} 
              color="#000" 
            />
          </TouchableOpacity>

          {mostrarPerfil && (
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput 
                  style={styles.inputDisabled} 
                  value={cliente.email} 
                  editable={false} 
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.inputLabel}>Nombre *</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Ingresa tu nombre" 
                    value={nombre} 
                    onChangeText={setNombre} 
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Apellido *</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Ingresa tu apellido" 
                    value={apellido} 
                    onChangeText={setApellido} 
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cédula *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0000000000"
                  value={cedula}
                  onChangeText={setCedula}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Dirección *</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Ingresa tu dirección completa" 
                  value={direccion} 
                  onChangeText={setDireccion}
                  multiline
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Celular *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0999999999"
                  value={celular}
                  onChangeText={setCelular}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Sexo</Text>
                <View style={styles.pickerWrapper}>
                  <Picker 
                    selectedValue={sexo} 
                    onValueChange={(v) => setSexo(v)} 
                    style={styles.picker}
                  >
                    <Picker.Item label="Hombre" value="Hombre" />
                    <Picker.Item label="Mujer" value="Mujer" />
                  </Picker>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSave}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveText}>Guardar cambios</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ✨ BENEFICIOS */}
        {!mostrarPerfil && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Tus beneficios</Text>
            <View style={styles.benefitsGrid}>
              {[
                { icon: "cart-outline", title: "Compra fácil", text: "Explora y agrega productos" },
                { icon: "mail-outline", title: "Notificaciones", text: "Mantente informado" },
                { icon: "location-outline", title: "Entrega rápida", text: "Recoge tu pedido en nuestra Boutique de aromas" },
                { icon: "shield-checkmark-outline", title: "Seguridad", text: "Toda tu información se encuentra protegida" },
              ].map((benefit, i) => (
                <View key={i} style={styles.benefitCard}>
                  <View style={styles.benefitIconContainer}>
                    <Ionicons name={benefit.icon as any} size={32} color="#000" />
                  </View>
                  <Text style={styles.benefitTitle}>{benefit.title}</Text>
                  <Text style={styles.benefitText}>{benefit.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ✨ CERRAR SESIÓN */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={confirmLogout}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => Linking.openURL("https://www.victoriassecretbeauty.ec/politicas-de-bopis")}
          style={styles.privacyLink}
          activeOpacity={0.7}
        >
          <Text style={styles.privacyLinkText}>Políticas de privacidad</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
}

// ✨ ESTILOS PREMIUM COMPLETOS
const styles = StyleSheet.create({
  // ✨ TOAST PROFESIONAL
  toastContainer: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    borderRadius: 16,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
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
    fontFamily: "PlayfairDisplay_600SemiBold",
    marginLeft: 12,
    flex: 1,
    letterSpacing: 0.3,
  },

  // ✨ MODAL DE CONFIRMACIÓN
  confirmModalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9998,
  },
  confirmModalBackdropTouchable: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  confirmModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
  },
  confirmIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 24,
  },
  confirmTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 24,
    color: "#111",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  confirmMessage: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  confirmButtons: {
    gap: 12,
  },
  confirmButtonPrimary: {
    backgroundColor: "#111",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonTextPrimary: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 16,
    color: "#fff",
    letterSpacing: 0.5,
  },
  confirmButtonSecondary: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  confirmButtonTextSecondary: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 16,
    color: "#666",
    letterSpacing: 0.5,
  },

  // ✨ NO LOGUEADO CON VIDEO
  notLoggedContainer: { 
    flex: 1, 
    backgroundColor: "#000",
  },
  videoBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  notLoggedContent: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 30,
    paddingBottom: 100,
    alignItems: 'center',
  },
  infoTextVideo: { 
    fontSize: 15, 
    color: "#fff", 
    textAlign: "center", 
    marginBottom: 30, 
    lineHeight: 22,
    fontFamily: "PlayfairDisplay_400Regular",
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: { 
    color: "#000", 
    fontSize: 14, 
    fontFamily: "PlayfairDisplay_700Bold",
    letterSpacing: 1.5,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 2,
    borderColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: '100%',
    justifyContent: 'center',
  },
  secondaryButtonText: { 
    color: "#fff", 
    fontSize: 14, 
    fontFamily: "PlayfairDisplay_700Bold",
    letterSpacing: 1.5,
  },

  // ✨ HEADER LOGUEADO
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 14,
    color: "#666",
  },
  titleHeader: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 20,
    color: "#000",
    letterSpacing: 0.5,
  },

  // ✨ NOTIFICACIÓN FLOTANTE (MÁS ABAJO)
  notificationContainer: {
    position: 'absolute',
    top: 80,
    left: 15,
    right: 15,
    zIndex: 1000,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  notificationGradient: {
    padding: 16,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  notificationIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 16,
    color: "#fff",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  notificationMessage: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 13,
    color: "#fff",
    opacity: 0.95,
    lineHeight: 18,
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 10,
  },
  notificationButtonSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  notificationButtonSecondaryText: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 13,
    color: "#fff",
  },
  notificationButtonPrimary: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  notificationButtonPrimaryText: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 13,
    color: "#D97706",
  },

  // ✨ CONTENIDO
  scrollContainer: {
    paddingBottom: 120,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 25,
  },
  sectionTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 20,
    color: "#000",
    marginBottom: 15,
    letterSpacing: 0.5,
  },

  // ✨ TARJETAS DE ACCIÓN
  actionGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#fafafa",
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  actionCardTitle: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 15,
    color: "#000",
    marginBottom: 4,
    textAlign: 'center',
  },
  actionCardSubtitle: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 12,
    color: "#666",
    textAlign: 'center',
  },
  incompleteBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },

  // ✨ TOGGLE DATOS PERSONALES
  toggleProfile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleProfileText: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    color: "#000",
    fontSize: 15,
  },

  // ✨ FORMULARIO
  formContainer: {
    marginTop: 20,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 13,
    color: "#000",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: "#fff",
    width: "100%",
    padding: 14,
    borderRadius: 12,
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    fontFamily: "PlayfairDisplay_400Regular",
  },
  inputDisabled: {
    backgroundColor: "#f5f5f5",
    width: "100%",
    padding: 14,
    borderRadius: 12,
    fontSize: 15,
    fontFamily: "PlayfairDisplay_400Regular",
    color: "#666",
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
  },
  pickerWrapper: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    overflow: 'hidden',
  },
  picker: { 
    width: "100%", 
    height: 50,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 30,
    width: "100%",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  saveText: { 
    color: "#fff", 
    fontSize: 15, 
    fontFamily: "PlayfairDisplay_700Bold",
    letterSpacing: 1,
  },

  // ✨ BENEFICIOS
  benefitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
  },
  benefitCard: {
    width: (width - 55) / 2,
    backgroundColor: "#fafafa",
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  benefitIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff",
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  benefitTitle: { 
    fontFamily: "PlayfairDisplay_600SemiBold", 
    fontSize: 15,
    color: "#000", 
    textAlign: 'center',
    marginBottom: 6,
  },
  benefitText: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 12,
    textAlign: "center",
    color: "#666",
    lineHeight: 18,
  },

  // ✨ CERRAR SESIÓN
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 30,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fee',
    backgroundColor: '#fff',
  },
  logoutText: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 15,
    color: "#EF4444",
    letterSpacing: 0.5,
  },

  // ✨ PRIVACIDAD
  privacyLink: {
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  privacyLinkText: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 13,
    color: "#666",
    textDecorationLine: "underline",
  },

  // ✨ LOADING
  loadingContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#fff" 
  },
  loadingText: { 
    fontSize: 16, 
    fontFamily: "PlayfairDisplay_600SemiBold", 
    color: "#000" 
  },
});
