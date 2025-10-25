import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { WebView } from "react-native-webview";
import {
    clearCart,
    getCart,
    removeFromCart,
    updateCartQuantity,
} from "../../../utils/storage";

export default function CarritoScreen() {
  const router = useRouter();

  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayPal, setShowPayPal] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [showResumen, setShowResumen] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  // Campos del formulario
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [numeroTarjeta, setNumeroTarjeta] = useState("");
  const [cvv, setCvv] = useState("");

  useEffect(() => {
    checkLogin();
  }, []);

  useEffect(() => {
    if (isLogged) loadCart();
    else {
      setCart([]);
      setLoading(false);
    }
  }, [isLogged]);

  const checkLogin = async () => {
    const user = await AsyncStorage.getItem("user");
    setIsLogged(!!user);
  };

  const loadCart = async () => {
    setLoading(true);
    const items = await getCart();
    setCart(items || []);
    setLoading(false);
  };

  const calcularTotal = () =>
    cart.reduce((acc, item) => acc + (item.precio || 0) * (item.cantidad || 1), 0).toFixed(2);

  const aumentarCantidad = async (id: number) => {
    const item = cart.find((i) => i.id === id);
    if (item) {
      const nuevaCantidad = (item.cantidad || 1) + 1;
      await updateCartQuantity(id, nuevaCantidad);
      loadCart();
    }
  };

  const disminuirCantidad = async (id: number) => {
    const item = cart.find((i) => i.id === id);
    if (item && item.cantidad && item.cantidad > 1) {
      const nuevaCantidad = item.cantidad - 1;
      await updateCartQuantity(id, nuevaCantidad);
      loadCart();
    } else {
      confirmarEliminar(id);
    }
  };

  const confirmarEliminar = (id: number) => {
    Alert.alert(
      "Eliminar producto",
      "¿Estás seguro de eliminar este producto del carrito?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            await removeFromCart(id);
            loadCart();
          },
        },
      ]
    );
  };

  const vaciarCarrito = () => {
    Alert.alert("Vaciar carrito", "¿Deseas eliminar todos los productos?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Vaciar",
        style: "destructive",
        onPress: async () => {
          await clearCart();
          loadCart();
        },
      },
    ]);
  };

  const validarFormulario = (): string | null => {
    if (!nombre.trim()) return "Ingresa el nombre.";
    if (!apellido.trim()) return "Ingresa el apellido.";
    if (!ciudad.trim()) return "Ingresa la ciudad.";
    const onlyDigits = (s: string) => /^\d+$/.test(s);
    if (!numeroTarjeta || !onlyDigits(numeroTarjeta) || numeroTarjeta.length !== 14)
      return "Número de tarjeta inválido (14 dígitos).";
    if (!cvv || !onlyDigits(cvv) || cvv.length !== 3)
      return "CVV inválido (3 dígitos).";
    return null;
  };

  const handleSimulatedPayment = async () => {
    const error = validarFormulario();
    if (error) {
      Alert.alert("Error", error);
      return;
    }

    setProcessing(true);
    setTimeout(async () => {
      const newOrderNumber = "ORD-" + Math.floor(Math.random() * 1000000);
      setOrderNumber(newOrderNumber);
      setProcessing(false);
      await clearCart();
      setShowPaymentForm(false);
      await loadCart();
      setNombre("");
      setApellido("");
      setCiudad("");
      setNumeroTarjeta("");
      setCvv("");
      setShowResumen(true);
    }, 2000);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#121212" />
      </View>
    );
  }

  if (!isLogged) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color="#121212" />
          </TouchableOpacity>
          <Text style={styles.title}>Carrito</Text>
          <View style={{ width: 26 }} />
        </View>

        <Text style={styles.emptyText}>
          Debes iniciar sesión para ver el carrito.
        </Text>

        <TouchableOpacity
          style={[styles.paypalButton, { marginHorizontal: 60 }]}
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text style={styles.paypalText}>Iniciar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showPayPal) {
    return (
      <WebView
        source={{ uri: "https://www.sandbox.paypal.com/signin" }}
        style={{ flex: 1 }}
        startInLoadingState
        renderLoading={() => (
          <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#121212" />
        )}
      />
    );
  }

  if (showResumen) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color="#121212" />
          </TouchableOpacity>
          <Text style={styles.title}>Pedido confirmado</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Gracias por tu compra</Text>
          <Text style={styles.summaryText}>Número de pedido: {orderNumber}</Text>
          <Text style={styles.summaryText}>Total pagado: ${calcularTotal()}</Text>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => setShowResumen(false)}
          >
            <Text style={styles.confirmText}>Volver al carrito</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 80}
    >
      <ScrollView
        style={{ backgroundColor: "#fff" }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color="#121212" />
          </TouchableOpacity>
          <Text style={styles.title}>Carrito</Text>
          <View style={{ width: 26 }} />
        </View>

        {cart.length === 0 ? (
          <Text style={styles.emptyText}>Tu carrito está vacío.</Text>
        ) : (
          <>
            {cart.map((item) => (
              <View key={item.id} style={styles.card}>
                <Image
                  source={{
                    uri:
                      item.url_imagen ||
                      item.imagen ||
                      "https://via.placeholder.com/150/cccccc/000000?text=Perfume",
                  }}
                  style={styles.image}
                />
                <View style={styles.info}>
                  <Text style={styles.name}>{item.nombre}</Text>
                  <Text style={styles.price}>${item.precio}</Text>

                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => disminuirCantidad(item.id)}
                    >
                      <Ionicons name="remove" size={18} color="#121212" />
                    </TouchableOpacity>
                    <Text style={styles.quantity}>{item.cantidad || 1}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => aumentarCantidad(item.id)}
                    >
                      <Ionicons name="add" size={18} color="#121212" />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => confirmarEliminar(item.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#FF4B5C" />
                    <Text style={styles.removeText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={styles.footer}>
              <Text style={styles.totalText}>Total: ${calcularTotal()}</Text>

              <TouchableOpacity
                style={styles.paypalButton}
                onPress={() => setShowPayPal(true)}
              >
                <Image
                  source={{
                    uri: "https://www.paypalobjects.com/webstatic/icon/pp258.png",
                  }}
                  style={{ width: 22, height: 22, marginRight: 6 }}
                />
                <Text style={styles.paypalText}>Pagar con PayPal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paypalButton, { backgroundColor: "#121212" }]}
                onPress={() => setShowPaymentForm((s) => !s)}
              >
                <Text style={[styles.paypalText, { color: "#fff" }]}>
                  {showPaymentForm ? "Cerrar formulario" : "Ir a pagar (tarjeta)"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.clearButton} onPress={vaciarCarrito}>
                <Text style={styles.clearText}>Vaciar carrito</Text>
              </TouchableOpacity>
            </View>

            {showPaymentForm && (
              <View style={styles.paymentForm}>
                <Text style={styles.formTitle}>Formulario de pago</Text>

                <TextInput
                  placeholder="Nombre"
                  placeholderTextColor="#888"
                  style={styles.input}
                  value={nombre}
                  onChangeText={setNombre}
                />
                <TextInput
                  placeholder="Apellido"
                  placeholderTextColor="#888"
                  style={styles.input}
                  value={apellido}
                  onChangeText={setApellido}
                />
                <TextInput
                  placeholder="Ciudad"
                  placeholderTextColor="#888"
                  style={styles.input}
                  value={ciudad}
                  onChangeText={setCiudad}
                />
                <TextInput
                  placeholder="Número de tarjeta (14 dígitos)"
                  placeholderTextColor="#888"
                  style={styles.input}
                  value={numeroTarjeta}
                  onChangeText={(t) => setNumeroTarjeta(t.replace(/\D/g, ""))}
                  keyboardType="number-pad"
                  maxLength={14}
                />
                <TextInput
                  placeholder="CVV (3 dígitos)"
                  placeholderTextColor="#888"
                  style={styles.input}
                  value={cvv}
                  onChangeText={(t) => setCvv(t.replace(/\D/g, ""))}
                  keyboardType="number-pad"
                  maxLength={3}
                />

                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleSimulatedPayment}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.confirmText}>
                      Pagar ${calcularTotal()}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  title: { fontSize: 20, fontWeight: "bold", color: "#121212" },
  emptyText: { textAlign: "center", marginTop: 40, color: "#777", fontSize: 16 },
  card: {
    flexDirection: "row",
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 10,
  },
  image: { width: 80, height: 80, borderRadius: 8 },
  info: { flex: 1, marginLeft: 10 },
  name: { fontSize: 14, fontWeight: "600", color: "#121212" },
  price: { fontSize: 13, color: "#555" },
  quantityContainer: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  quantityButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
  },
  quantity: { marginHorizontal: 10, fontSize: 14, fontWeight: "bold" },
  removeButton: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  removeText: { color: "#FF4B5C", marginLeft: 5, fontSize: 13 },
  footer: {
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingTop: 15,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#121212",
    textAlign: "right",
    marginBottom: 10,
  },
  paypalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0070BA",
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  paypalText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  clearButton: { alignItems: "center", paddingVertical: 6 },
  clearText: { color: "#FF4B5C", fontSize: 14, fontWeight: "600" },
  paymentForm: {
    marginHorizontal: 20,
    marginTop: 10,
    padding: 14,
    backgroundColor: "#fafafa",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  formTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    color: "#121212",
  },
  confirmButton: {
    backgroundColor: "#10B981",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  confirmText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  summaryContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  summaryTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  summaryText: { fontSize: 16, color: "#333", marginBottom: 8 },
});
