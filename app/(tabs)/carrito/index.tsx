import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  useFonts,
} from "@expo-google-fonts/playfair-display";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  clearCart,
  getCart,
  removeFromCart,
  storageEvents,
  updateCartQuantity,
} from "../../../utils/storage";

const { width } = Dimensions.get("window");

type PaymentMethod = 'credit_card' | 'my_cards';

export default function CarritoScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
  });

  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [showResumen, setShowResumen] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

  const [numeroTarjeta, setNumeroTarjeta] = useState("");
  const [fechaCaducidad, setFechaCaducidad] = useState("");
  const [cvv, setCvv] = useState("");

  const slideAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    const handleCartChange = () => {
      if (isLogged) loadCart();
    };
    storageEvents.on("cartChanged", handleCartChange);
    return () => {
      storageEvents.off("cartChanged", handleCartChange);
    };
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
    cart
      .reduce(
        (acc, item) => acc + (Number(item.precio) || 0) * (item.cantidad || 1),
        0
      )
      .toFixed(2);

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
      "¿Estás seguro de eliminar este producto del cesto?",
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

  const validarFormulario = (): string | null => {
    if (selectedPaymentMethod === 'credit_card') {
      const onlyDigits = (s: string) => /^\d+$/.test(s);

      if (!numeroTarjeta || numeroTarjeta.replace(/\s/g, '').length !== 16 || !onlyDigits(numeroTarjeta.replace(/\s/g, '')))
        return "Número de tarjeta inválido (16 dígitos).";

      if (!fechaCaducidad || fechaCaducidad.length !== 5 || fechaCaducidad[2] !== '/')
        return "Fecha de caducidad inválida (MM/AA).";

      if (!cvv || !onlyDigits(cvv) || cvv.length !== 3)
        return "CVV inválido (3 dígitos).";

    } else if (selectedPaymentMethod === 'my_cards') {
      return null;
    } else {
      return "Por favor, selecciona una forma de pago.";
    }

    return null;
  };

  const formatCardNumber = (text: string) => {
    const digits = text.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += ' ';
      }
      formatted += digits[i];
    }
    setNumeroTarjeta(formatted);
  };

  const formatExpiryDate = (text: string) => {
    const digits = text.replace(/\D/g, '');
    let formatted = digits;
    if (digits.length > 2) {
      formatted = digits.substring(0, 2) + '/' + digits.substring(2, 4);
    }
    setFechaCaducidad(formatted);
  };

  const handleSimulatedPayment = async () => {
    const error = validarFormulario();
    if (error) {
      Alert.alert("Error de Pago", error);
      return;
    }

    setProcessing(true);
    setTimeout(async () => {
      const newOrderNumber = "ORD-" + Math.floor(Math.random() * 1000000);
      setOrderNumber(newOrderNumber);
      setProcessing(false);
      await clearCart();
      setModalVisible(false);
      await loadCart();
      setNumeroTarjeta("");
      setFechaCaducidad("");
      setCvv("");
      setSelectedPaymentMethod(null);
      setShowResumen(true);
    }, 2000);
  };

  const openModal = () => {
    setModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 350,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSelectedPaymentMethod(null);
    });
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [500, 0],
  });

  const renderCartItem = ({ item }: { item: any }) => {
    const price = Number(item.precio) || 0;
    const quantity = item.cantidad || 1;
    const totalItemPrice = (price * quantity).toFixed(2);

    return (
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Image
            source={{
              uri:
                item.url_imagen ||
                "https://via.placeholder.com/150/cccccc/000000?text=Perfume",
            }}
            style={styles.image}
            resizeMode="cover"
          />
          
          <View style={styles.infoBox}>
            <Text style={styles.cardName}>{item.nombre}</Text>
            <Text style={styles.cardBrand}>
              {item.marca_nombre || "Maison Parfum"}
            </Text>
            
            <Text style={styles.totalItemText}>Total: ${totalItemPrice}</Text>

            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => disminuirCantidad(item.id)}
              >
                <Ionicons name="remove" size={18} color="#121212" />
              </TouchableOpacity>
              <Text style={styles.quantity}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => aumentarCantidad(item.id)}
              >
                <Ionicons name="add" size={18} color="#121212" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => confirmarEliminar(item.id)}
          >
            <Ionicons name="trash-outline" size={24} color="#FF4B5C" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 80}
    >
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#121212" />
          </TouchableOpacity>
          <Text style={styles.title}>Cesta</Text>
          <View style={{ width: 24 }} />
        </View>

        {!isLogged ? (
          <View style={styles.messageContainer}>
            <Text style={styles.largeMessage}>
              Inicia sesión para poder ver y gestionar tu cesta.
            </Text>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#111" />
          </View>
        ) : cart.length === 0 ? (
          <View style={styles.messageContainer}>
            <Text style={styles.largeMessage}>
                Tu cesta está vacía.
            </Text>
          </View>
        ) : (
          <FlatList
            key="cart-horizontal-list"
            data={cart}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            style={styles.cardsList}
          />
        )}
      </View>

      {isLogged && cart.length > 0 && (
        <View style={styles.footerFixed}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalPrice}>${calcularTotal()}</Text>
          </View>
          <TouchableOpacity style={styles.mainButton} onPress={openModal}>
            <Text style={styles.mainButtonText}>Proceder con la compra</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal transparent visible={modalVisible} animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ translateY }] },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.formTitle}>Forma de pago</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.paymentOptionContainer}>
                <TouchableOpacity
                  style={styles.paymentOption}
                  onPress={() => setSelectedPaymentMethod('credit_card')}
                >
                  <Ionicons
                    name={selectedPaymentMethod === 'credit_card' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={selectedPaymentMethod === 'credit_card' ? '#000' : '#666'}
                  />
                  <Text style={styles.paymentText}>Tarjeta de crédito o débito</Text>
                </TouchableOpacity>

                <View style={styles.cardIcons}>
                  <Image source={{ uri: 'https://cdn.icon-icons.com/icons2/2855/PNG/512/visa_card_icon_181183.png' }} style={styles.cardIcon} />
                  <Image source={{ uri: 'https://cdn.icon-icons.com/icons2/2855/PNG/512/mastercard_card_icon_181180.png' }} style={styles.cardIcon} />
                  <Image source={{ uri: 'https://cdn.icon-icons.com/icons2/2855/PNG/512/american_express_card_icon_181177.png' }} style={styles.cardIcon} />
                  <Image source={{ uri: 'https://cdn.icon-icons.com/icons2/2855/PNG/512/diners_club_card_icon_181179.png' }} style={styles.cardIcon} />
                </View>

                {selectedPaymentMethod === 'credit_card' && (
                  <View style={styles.cardFormContainer}>
                    <View style={styles.cardLockContainer}>
                      <Text style={styles.cardNumberLabel}>Número de tarjeta</Text>
                      <Ionicons name="lock-closed-outline" size={18} color="#999" />
                    </View>
                    <View style={styles.inputGroup}>
                      <TextInput
                        placeholder="0000 0000 0000 0000"
                        placeholderTextColor="#aaa"
                        style={styles.inputCard}
                        value={numeroTarjeta}
                        onChangeText={formatCardNumber}
                        keyboardType="number-pad"
                        maxLength={19}
                      />
                      <Ionicons name="card-outline" size={24} color="#ccc" style={styles.inputIcon} />
                    </View>

                    <View style={styles.splitInputRow}>
                      <View style={[styles.inputGroup, styles.splitInput]}>
                        <Text style={styles.cardNumberLabel}>Fecha de caducidad</Text>
                        <TextInput
                          placeholder="MM/AA"
                          placeholderTextColor="#aaa"
                          style={styles.input}
                          value={fechaCaducidad}
                          onChangeText={formatExpiryDate}
                          keyboardType="number-pad"
                          maxLength={5}
                        />
                      </View>
                      <View style={[styles.inputGroup, styles.splitInput]}>
                        <Text style={styles.cardNumberLabel}>Código de seguridad</Text>
                        <TextInput
                          placeholder="?"
                          placeholderTextColor="#aaa"
                          style={styles.input}
                          value={cvv}
                          onChangeText={(t) => setCvv(t.replace(/\D/g, ""))}
                          keyboardType="number-pad"
                          maxLength={3}
                          secureTextEntry
                        />
                        <Ionicons name="help-circle-outline" size={20} color="#999" style={styles.inputIconQuestion} />
                      </View>
                    </View>
                  </View>
                )}

                <View style={styles.paymentDivider} />

                <TouchableOpacity
                  style={styles.paymentOption}
                  onPress={() => router.push('/(tabs)/carrito/mis-tarjetas')}
                >
                  <Ionicons
                    name={selectedPaymentMethod === 'my_cards' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={'#666'}
                  />
                  <Text style={styles.paymentText}>Mis tarjetas</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleSimulatedPayment}
                disabled={processing || !selectedPaymentMethod}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmText}>
                    Pagar ${calcularTotal()}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 50,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  title: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 18,
    color: "#111",
  },
  messageContainer: {
    paddingHorizontal: 20,
    marginTop: 40,
    alignItems: 'flex-start',
  },
  largeMessage: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 28,
    color: "#111",
    marginBottom: 10,
    textAlign: 'left',
  },
  listContainer: {
    paddingBottom: 200,
    paddingHorizontal: 20,
  },
  cardsList: {
    marginTop: 15,
  },
  cardContainer: {
    width: '100%',
    marginBottom: 15,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: "#ffffffff",
    borderColor: "#e0e0e0",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  image: { 
    width: 80, 
    height: 100, 
    backgroundColor: "#f9f9f9", 
    borderRadius: 8,
  },
  infoBox: { 
    flex: 1, 
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  cardName: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 16,
    color: "#111",
    marginBottom: 3,
  },
  cardBrand: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
  },
  totalItemText: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 16,
    color: "#FF4B5C",
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  quantityButton: {
    paddingHorizontal: 8,
  },
  quantity: {
    marginHorizontal: 12,
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 14,
    color: "#111",
  },
  deleteButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerFixed: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingTop: 15,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  totalLabel: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 18,
    color: "#000",
  },
  totalPrice: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 18,
    color: "#000",
  },
  mainButton: {
    backgroundColor: "#121212",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  mainButtonText: {
    color: "#fff",
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: "#10B981",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  confirmText: {
    color: "#fff",
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: "70%",
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  formTitle: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 20,
    color: "#111",
  },
  paymentOptionContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  paymentText: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 16,
    marginLeft: 10,
    color: '#111',
  },
  paymentDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  cardIcons: {
    flexDirection: 'row',
    marginLeft: 30,
    marginBottom: 10,
  },
  cardIcon: {
    width: 30,
    height: 20,
    resizeMode: 'contain',
    marginRight: 5,
  },
  cardFormContainer: {
    marginTop: 5,
    paddingTop: 10,
  },
  cardLockContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  cardNumberLabel: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 14,
    color: '#111',
  },
  inputGroup: { marginBottom: 15, position: 'relative' },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontFamily: "PlayfairDisplay_400Regular",
    color: "#121212",
  },
  inputCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 15,
    paddingLeft: 45,
    paddingVertical: 12,
    fontFamily: "PlayfairDisplay_400Regular",
    color: "#121212",
  },
  splitInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  splitInput: {
    width: '48%',
  },
  inputIcon: {
    position: 'absolute',
    left: 10,
    top: 15,
  },
  inputIconQuestion: {
    position: 'absolute',
    right: 15,
    top: 35,
  },
});
