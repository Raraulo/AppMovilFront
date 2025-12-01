// app/(tabs)/carrito/index.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from "expo-router";
import { collection, doc, runTransaction } from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { useApi } from "../../../contexts/ApiContext";
import { db } from "../../../utils/firebase";
import {
  clearCart,
  getActiveCard,
  getCart,
  removeFromCart,
  storageEvents,
  updateCartQuantity,
  type Card,
} from "../../../utils/storage";

const { width, height } = Dimensions.get("window");

// 🎨 TIPOGRAFÍA PREMIUM NATIVA
const FONT_TITLE = Platform.OS === 'ios' ? 'Didot' : 'serif';
const FONT_BODY = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const FONT_MODERN = Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif';

const CARD_COLORS = [
  ['#0f172a', '#1e293b'],
  ['#1e3a8a', '#3b82f6'],
  ['#581c87', '#9333ea'],
  ['#831843', '#db2777'],
  ['#713f12', '#f59e0b'],
  ['#14532d', '#22c55e'],
  ['#164e63', '#06b6d4'],
  ['#7c2d12', '#f97316'],
  ['#4c1d95', '#a855f7'],
  ['#881337', '#f43f5e'],
];

// ==================== MODAL DE CONFIRMACIÓN ====================
interface ConfirmModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

const ConfirmModal = ({
  visible,
  onConfirm,
  onCancel,
  title = "Confirmar acción",
  message = "¿Estás seguro?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  showCancel = true,
}: ConfirmModalProps) => {
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
    <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={showCancel ? onCancel : undefined}
        style={styles.confirmModalBackdrop}
      >
        <Animated.View
          style={[
            styles.confirmModalContainer,
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.confirmIconCircle}>
              <Ionicons name="cart-outline" size={48} color="#111" />
            </View>
            <Text style={styles.confirmTitle}>{title}</Text>
            <Text style={styles.confirmMessage}>{message}</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmConfirmButton}
                onPress={() => {
                  onConfirm();
                  onCancel();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmConfirmText}>{confirmText}</Text>
              </TouchableOpacity>
              {showCancel && (
                <TouchableOpacity
                  style={styles.confirmCancelButton}
                  onPress={onCancel}
                  activeOpacity={0.85}
                >
                  <Text style={styles.confirmCancelText}>{cancelText}</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

// ==================== TOAST ====================
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
      : "rgba(18, 18, 18, 0.95)";

  const icon =
    type === "success"
      ? "checkmark-circle"
      : type === "error"
      ? "close-circle"
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

// ✨ NOTIFICACIÓN DE PERFIL INCOMPLETO
const IncompleteProfileNotification = ({ visible, onClose, onUpdate }: any) => {
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
        styles.incompleteNotificationContainer,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <LinearGradient
        colors={['#EF4444', '#DC2626']}
        style={styles.incompleteNotificationGradient}
      >
        <View style={styles.incompleteNotificationContent}>
          <View style={styles.incompleteNotificationIconContainer}>
            <Ionicons name="warning" size={28} color="#fff" />
          </View>
          <View style={styles.incompleteNotificationTextContainer}>
            <Text style={styles.incompleteNotificationTitle}>Perfil incompleto</Text>
            <Text style={styles.incompleteNotificationMessage}>
              Completa tus datos personales para continuar
            </Text>
          </View>
        </View>
        <View style={styles.incompleteNotificationActions}>
          <TouchableOpacity 
            style={styles.incompleteNotificationButtonSecondary}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.incompleteNotificationButtonSecondaryText}>Cerrar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.incompleteNotificationButtonPrimary}
            onPress={onUpdate}
            activeOpacity={0.8}
          >
            <Text style={styles.incompleteNotificationButtonPrimaryText}>Completar ahora</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================
export default function CarritoScreen() {
  const apiUrl = useApi();

  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [tarjetaWawallet, setTarjetaWawallet] = useState<Card | null>(null);
  const [loadingTarjeta, setLoadingTarjeta] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const [clienteData, setClienteData] = useState<any>(null);
  const [showIncompleteNotification, setShowIncompleteNotification] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: "",
    message: "",
    onConfirm: () => {},
    showCancel: true,
  });

  const slideAnim = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.5)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkRotate = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(20)).current;

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    if (Platform.OS === "ios" || Platform.OS === "android") {
      Vibration.vibrate(50);
    }
    setToast({ visible: true, message, type });
  };

  useEffect(() => {
    checkLogin();
  }, []);

  useEffect(() => {
    if (isLogged) {
      loadCart();
      loadClienteData();
    } else {
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

  useFocusEffect(
    useCallback(() => {
      if (isLogged) {
        loadClienteData();
      }
      if (modalVisible) {
        loadTarjetaWawallet();
      }
    }, [modalVisible, isLogged])
  );

  useEffect(() => {
    const handleCardsChanged = () => {
      if (modalVisible) {
        loadTarjetaWawallet();
      }
    };

    const handleActiveCardChanged = () => {
      if (modalVisible) {
        loadTarjetaWawallet();
      }
    };

    storageEvents.on('cardsChanged', handleCardsChanged);
    storageEvents.on('activeCardChanged', handleActiveCardChanged);

    return () => {
      storageEvents.off('cardsChanged', handleCardsChanged);
      storageEvents.off('activeCardChanged', handleActiveCardChanged);
    };
  }, [modalVisible]);

  const checkLogin = async () => {
    const user = await AsyncStorage.getItem("user");
    const isUserLogged = !!user;
    setIsLogged(isUserLogged);
  };

  const loadCart = async () => {
    setLoading(true);
    const items = await getCart();
    setCart(items);
    setLoading(false);
  };

  const loadClienteData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) return;

      const userData = JSON.parse(storedUser);

      const res = await fetch(`${apiUrl}/api/clientes/`, {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) return;

      const clientes = await res.json();
      const data = clientes.find((c: any) => c.email === userData.email);

      if (data) {
        setClienteData(data);
      }
    } catch (error) {
      // Error silencioso
    }
  };

  const isProfileComplete = () => {
    if (!clienteData) return false;

    const camposFaltantes = [];
    
    if (!clienteData.nombre?.trim() || clienteData.nombre?.trim() === "Cliente") {
      camposFaltantes.push("nombre");
    }
    if (!clienteData.apellido?.trim() || clienteData.apellido?.trim() === "Nuevo") {
      camposFaltantes.push("apellido");
    }
    if (!clienteData.cedula?.trim()) {
      camposFaltantes.push("cédula");
    }
    if (!clienteData.direccion?.trim()) {
      camposFaltantes.push("dirección");
    }
    if (!clienteData.celular?.trim()) {
      camposFaltantes.push("celular");
    }

    return camposFaltantes.length === 0;
  };

  const loadTarjetaWawallet = async () => {
    setLoadingTarjeta(true);
    try {
      const activeCard = await getActiveCard();
      
      if (activeCard) {
        setTarjetaWawallet(activeCard);
      } else {
        setTarjetaWawallet(null);
      }
    } catch (error) {
      showToast("No se pudo cargar la tarjeta", "error");
      setTarjetaWawallet(null);
    } finally {
      setLoadingTarjeta(false);
    }
  };

  const verificarStockDisponible = async (productId: number) => {
    try {
      const res = await fetch(`${apiUrl}/api/productos/${productId}`);
      const producto = await res.json();
      return producto.stock;
    } catch (error) {
      return 0;
    }
  };

  const calcularTotal = () =>
    cart
      .reduce(
        (acc, item) => acc + Number(item.precio || 0) * (item.cantidad || 1),
        0
      )
      .toFixed(2);

  const aumentarCantidad = async (id: number) => {
    const item = cart.find((i) => i.id === id);
    if (!item) return;

    const stockDisponible = await verificarStockDisponible(id);
    const nuevaCantidad = (item.cantidad || 1) + 1;

    if (nuevaCantidad > stockDisponible) {
      showToast(
        `Solo hay ${stockDisponible} unidades disponibles`,
        "error"
      );
      return;
    }

    await updateCartQuantity(id, nuevaCantidad);
    loadCart();
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
    const item = cart.find((i) => i.id === id);
    setConfirmModal({
      visible: true,
      title: "Eliminar producto",
      message: item
        ? `¿Estás seguro de eliminar "${item.nombre}" de tu cesta?`
        : "¿Estás seguro de eliminar este producto?",
      onConfirm: async () => {
        await removeFromCart(id);
        loadCart();
        showToast("Producto eliminado", "success");
      },
      showCancel: true,
    });
  };

  const startSuccessAnimation = () => {
    setShowSuccessAnimation(true);

    successOpacity.setValue(0);
    successScale.setValue(0.5);
    checkScale.setValue(0);
    checkRotate.setValue(0);
    glowOpacity.setValue(0);
    textOpacity.setValue(0);
    textTranslate.setValue(20);

    Animated.sequence([
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(successScale, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.sequence([
          Animated.delay(100),
          Animated.parallel([
            Animated.spring(checkScale, {
              toValue: 1,
              tension: 100,
              friction: 7,
              useNativeDriver: true,
            }),
            Animated.timing(checkRotate, {
              toValue: 1,
              duration: 500,
              easing: Easing.elastic(1.2),
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.sequence([
          Animated.delay(200),
          Animated.loop(
            Animated.sequence([
              Animated.timing(glowOpacity, {
                toValue: 0.8,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(glowOpacity, {
                toValue: 0.3,
                duration: 1000,
                useNativeDriver: true,
              }),
            ]),
            { iterations: 2 }
          ),
        ]),
        Animated.sequence([
          Animated.delay(400),
          Animated.parallel([
            Animated.spring(textTranslate, {
              toValue: 0,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
            Animated.timing(textOpacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]),
    ]).start();

    if (Platform.OS === "ios" || Platform.OS === "android") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Vibration.vibrate([0, 100, 50, 100]);
    }

    setTimeout(() => {
      Animated.timing(successOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setShowSuccessAnimation(false);
      });
    }, 3500);
  };

  // ✅ FUNCIÓN DE PAGO COMPLETA - USANDO ENDPOINTS EXISTENTES
  const procesarPagoWawallet = async () => {
    if (processing) return;
    
    if (!tarjetaWawallet) {
      showToast("No hay tarjeta seleccionada", "error");
      return;
    }
    
    const total = parseFloat(calcularTotal());
    const TARJETA_DESTINO = "9375021914180118";

    try {
      setProcessing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const userStr = await AsyncStorage.getItem("user");
      if (!userStr) {
        throw new Error("Usuario no encontrado");
      }
      const userData = JSON.parse(userStr);

      // ========== FIRESTORE: TRANSFERENCIA DE SALDO ==========
      const queryBody = {
        structuredQuery: {
          from: [{ collectionId: "usuarios" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "tarjeta.numero" },
              op: "EQUAL",
              value: { stringValue: tarjetaWawallet.numero },
            },
          },
          limit: 1,
        },
      };

      const res = await fetch(
        "https://firestore.googleapis.com/v1/projects/wawalle/databases/(default)/documents:runQuery",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(queryBody),
        }
      );

      const data = await res.json();
      if (!data || !data[0] || !data[0].document) {
        showToast("Error al conectar con tu cuenta", "error");
        return;
      }

      const userDoc = data[0].document;
      const userId = userDoc.name.split("/").pop();

      const queryDestino = {
        structuredQuery: {
          from: [{ collectionId: "usuarios" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "tarjeta.numero" },
              op: "EQUAL",
              value: { stringValue: TARJETA_DESTINO },
            },
          },
          limit: 1,
        },
      };

      const resDestino = await fetch(
        "https://firestore.googleapis.com/v1/projects/wawalle/databases/(default)/documents:runQuery",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(queryDestino),
        }
      );

      const dataDestino = await resDestino.json();
      if (!dataDestino || !dataDestino[0] || !dataDestino[0].document) {
        showToast("Error al procesar el pago", "error");
        return;
      }

      const destinoDoc = dataDestino[0].document;
      const destinoId = destinoDoc.name.split("/").pop();

      const userRef = doc(db, "usuarios", userId);
      const destinoRef = doc(db, "usuarios", destinoId);

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        const destinoSnap = await transaction.get(destinoRef);

        if (!userSnap.exists() || !destinoSnap.exists()) {
          throw new Error("Error en las cuentas");
        }

        const currentBalance = userSnap.data().balance || 0;
        const destinoBalance = destinoSnap.data().balance || 0;

        if (currentBalance < total) {
          throw new Error("SALDO_INSUFICIENTE");
        }

        const newUserBalance = currentBalance - total;
        const newDestinoBalance = destinoBalance + total;

        transaction.update(userRef, { balance: newUserBalance });
        transaction.update(destinoRef, { balance: newDestinoBalance });

        const transaccionUserRef = doc(
          collection(db, "usuarios", userId, "transacciones")
        );
        transaction.set(transaccionUserRef, {
          tipo: "pago",
          monto: total,
          destinatario: "MaisonDesSenteurs",
          razon: `Compra de ${cart.length} productos`,
          fecha: new Date(),
          estado: "completado",
        });

        const transaccionDestinoRef = doc(
          collection(db, "usuarios", destinoId, "transacciones")
        );
        transaction.set(transaccionDestinoRef, {
          tipo: "recepcion",
          monto: total,
          remitente: `${userSnap.data().nombre} ${userSnap.data().apellido}`,
          razon: `Venta de ${cart.length} productos`,
          fecha: new Date(),
          estado: "completado",
        });
      });

      // ========== DJANGO: REGISTRAR VENTA (USANDO ENDPOINTS EXISTENTES) ==========
      
      // 1. Verificar/Crear cliente
      const clienteExiste = await fetch(`${apiUrl}/api/clientes/`, {
        headers: { Accept: "application/json" },
      });
      const clientes = await clienteExiste.json();
      const clienteExistente = clientes.find((c: any) => c.email === clienteData.email);

      let clienteId = clienteExistente?.id;

      if (!clienteExistente) {
        const createClienteRes = await fetch(`${apiUrl}/api/clientes/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: clienteData.nombre,
            apellido: clienteData.apellido,
            cedula: clienteData.cedula,
            direccion: clienteData.direccion,
            celular: clienteData.celular,
            email: clienteData.email,
            sexo: clienteData.sexo || "Hombre",
          }),
        });

        if (!createClienteRes.ok) {
          throw new Error("Error al crear cliente");
        }

        const nuevoCliente = await createClienteRes.json();
        clienteId = nuevoCliente.id;
      }

      // 2. Crear factura
      const createFacturaRes = await fetch(`${apiUrl}/api/facturas/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente: clienteId,
          total: total.toFixed(2),
          metodo_pago: "wawallet",
        }),
      });

      if (!createFacturaRes.ok) {
        throw new Error("Error al crear factura");
      }

      const factura = await createFacturaRes.json();

      // 3. Crear detalles y actualizar stock
      for (const item of cart) {
        const subtotal = (Number(item.precio) * (item.cantidad || 1)).toFixed(2);

        // Crear detalle
        await fetch(`${apiUrl}/api/detalles/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            factura: factura.id,
            producto: item.id,
            cantidad: item.cantidad || 1,
            precio_unitario: item.precio,
            subtotal: subtotal,
          }),
        });

        // Actualizar stock
        const nuevoStock = item.stock - (item.cantidad || 1);
        
        await fetch(`${apiUrl}/api/productos/${item.id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stock: nuevoStock,
          }),
        });
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      await clearCart();
      setModalVisible(false);
      await loadCart();
      setTarjetaWawallet(null);
      
      setTimeout(() => {
        startSuccessAnimation();
      }, 200);

    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      if (error.message === "SALDO_INSUFICIENTE") {
        showToast("Saldo insuficiente. Revisa tu cuenta y vuelve a intentarlo más tarde", "error");
      } else if (error.message === "STOCK_INSUFICIENTE" || error.message.includes("stock")) {
        showToast("Stock insuficiente para completar tu compra", "error");
        await loadCart();
      } else {
        showToast("Error al procesar el pago. Inténtalo de nuevo", "error");
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmarCompra = () => {
    if (processing) return;
    
    if (!isProfileComplete()) {
      closeModal();
      setTimeout(() => {
        setShowIncompleteNotification(true);
      }, 400);
      return;
    }

    if (!tarjetaWawallet) {
      showToast("No se ha cargado la tarjeta", "error");
      return;
    }

    const total = parseFloat(calcularTotal());

    setConfirmModal({
      visible: true,
      title: "Confirmar compra",
      message: `IMPORTANTE: No existe reembolso una vez confirmada la compra.\n\nVas a pagar ${total.toFixed(
        2
      )} (${cart.length} ${cart.length === 1 ? 'producto' : 'productos'}).\n\n¿Deseas continuar?`,
      onConfirm: procesarPagoWawallet,
      showCancel: true,
    });
  };

  const openModal = () => {
    const perfilCompleto = isProfileComplete();
    
    if (!perfilCompleto) {
      setShowIncompleteNotification(true);
      return;
    }

    setModalVisible(true);
    loadTarjetaWawallet();
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
      setTarjetaWawallet(null);
    });
  };

  const handleGoToCards = () => {
    if (!isProfileComplete()) {
      showToast("Completa tu perfil antes de gestionar tarjetas", "error");
      
      setTimeout(() => {
        closeModal();
        router.push("/(tabs)/profile");
      }, 1500);
      return;
    }
    
    closeModal();
    router.push("/(tabs)/mistarjetas");
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  const checkRotateInterpolate = checkRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getCardGradient = (colorIndex: number) => {
    return CARD_COLORS[colorIndex % CARD_COLORS.length];
  };

  const renderCartItem = ({ item }: { item: any }) => {
    const price = Number(item.precio || 0);
    const quantity = item.cantidad || 1;
    const totalItemPrice = (price * quantity).toFixed(2);
    const stock = item.stock || 0;

    return (
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri:
                  item.url_imagen ||
                  "https://via.placeholder.com/150/cccccc/000000?text=Perfume",
              }}
              style={styles.image}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.1)"]}
              style={styles.imageGradient}
            />
            {stock === 0 && (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockText}>AGOTADO</Text>
              </View>
            )}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.cardBrand} numberOfLines={1}>
              {item.marca_nombre || "Maison Parfum"}
            </Text>
            <Text style={styles.cardName} numberOfLines={2}>
              {item.nombre}
            </Text>
            <Text style={styles.totalItemText}>€{totalItemPrice}</Text>
            <Text
              style={[
                styles.stockText,
                stock === 0 && styles.stockTextDanger,
                stock > 0 && stock <= 5 && styles.stockTextWarning,
              ]}
            >
              {stock === 0 ? "Sin stock" : `${stock} disponibles`}
            </Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => disminuirCantidad(item.id)}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={18} color="#000" />
              </TouchableOpacity>
              <Text style={styles.quantity}>{quantity}</Text>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  stock === 0 && styles.quantityButtonDisabled,
                ]}
                onPress={() => aumentarCantidad(item.id)}
                disabled={stock === 0}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color={stock === 0 ? "#ccc" : "#000"} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => confirmarEliminar(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.deleteButtonContainer}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <>
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonContainer}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </View>
          </TouchableOpacity>
          <Text style={styles.title}>CESTA</Text>
          <View style={{ width: 44 }} />
        </View>

        {!isLogged ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="bag-handle-outline" size={80} color="#ddd" />
            </View>
            <Text style={styles.emptyTitle}>Inicia sesión</Text>
            <Text style={styles.emptySubtitle}>
              Para ver y gestionar tu cesta necesitas iniciar sesión
            </Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push("/login")}
              activeOpacity={0.85}
            >
              <Text style={styles.loginButtonText}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : cart.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="bag-handle-outline" size={80} color="#ddd" />
            </View>
            <Text style={styles.emptyTitle}>Tu cesta está vacía</Text>
            <Text style={styles.emptySubtitle}>
              Explora nuestro catálogo y añade tus fragancias favoritas
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => router.push("/(tabs)")}
              activeOpacity={0.85}
            >
              <Text style={styles.exploreButtonText}>Explorar catálogo</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            key="cart-list"
            data={cart}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}

        {isLogged && cart.length > 0 && (
          <View style={styles.footerFixed}>
            <View style={styles.summaryContainer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabelFinal}>Total</Text>
                <Text style={styles.totalPriceFinal}>€{calcularTotal()}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={openModal}
              activeOpacity={0.85}
            >
              <Ionicons name="card-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.checkoutButtonText}>Proceder al pago</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal transparent visible={modalVisible} animationType="none" statusBarTranslucent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          <View style={styles.modalBackdrop}>
            <Animated.View
              style={[styles.modalContent, { transform: [{ translateY }] }]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Método de pago</Text>
                <TouchableOpacity onPress={closeModal} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={28} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <View style={styles.wawalletCardContainer}>
                  {loadingTarjeta ? (
                    <View style={styles.loadingCard}>
                      <ActivityIndicator color="#000" />
                      <Text style={styles.loadingText}>Cargando tarjeta...</Text>
                    </View>
                  ) : tarjetaWawallet ? (
                    <>
                      <View style={styles.wawalletCard}>
                        <LinearGradient
                          colors={getCardGradient(tarjetaWawallet.colorIndex || 0)}
                          style={styles.cardGradientBg}
                        />
                        <View style={styles.wawalletCardHeader}>
                          <Ionicons name="card" size={32} color="#fff" />
                          <Text style={styles.wawalletCardTitle}>WaWallet</Text>
                        </View>
                        <Text style={styles.wawalletCardNumber}>
                          •••• •••• •••• {tarjetaWawallet.numero.slice(-4)}
                        </Text>
                        <Text style={styles.wawalletCardOwner}>
                          {tarjetaWawallet.titular}
                        </Text>
                      </View>
                      <View style={styles.warningBox}>
                        <Ionicons
                          name="information-circle"
                          size={22}
                          color="#F59E0B"
                        />
                        <Text style={styles.warningText}>
                          No existe reembolso una vez confirmada la compra
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.changeTarjetaButton}
                        onPress={handleGoToCards}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="swap-horizontal" size={18} color="#000" />
                        <Text style={styles.changeTarjetaText}>
                          Cambiar tarjeta
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.addTarjetaButton}
                      onPress={handleGoToCards}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="add-circle-outline" size={24} color="#000" />
                      <Text style={styles.addTarjetaText}>
                        Añadir tarjeta de pago
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    (!tarjetaWawallet || processing) &&
                      styles.confirmButtonDisabled,
                  ]}
                  onPress={handleConfirmarCompra}
                  disabled={processing || !tarjetaWawallet}
                  activeOpacity={0.85}
                >
                  {processing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.confirmText}>
                        Pagar ${calcularTotal()}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, visible: false })}
        confirmText="Confirmar"
        cancelText="Cancelar"
        showCancel={confirmModal.showCancel}
      />

      {showSuccessAnimation && (
        <Modal transparent visible={showSuccessAnimation} animationType="none">
          <Animated.View
            style={[styles.successOverlay, { opacity: successOpacity }]}
          >
            <View style={styles.successContainer}>
              <Animated.View
                style={[
                  styles.mainCircle,
                  { transform: [{ scale: successScale }] },
                ]}
              >
                <Animated.View
                  style={[
                    styles.checkmarkContainer,
                    {
                      transform: [
                        { scale: checkScale },
                        { rotate: checkRotateInterpolate },
                      ],
                    },
                  ]}
                >
                  <Ionicons name="checkmark" size={100} color="#fff" />
                </Animated.View>
              </Animated.View>
              <Animated.View
                style={[
                  styles.successTextContainer,
                  {
                    opacity: textOpacity,
                    transform: [{ translateY: textTranslate }],
                  },
                ]}
              >
                <Text style={styles.successTitle}>¡Compra exitosa!</Text>
                <Text style={styles.successSubtitle}>
                  Tu pedido ha sido procesado correctamente
                </Text>
              </Animated.View>
            </View>
          </Animated.View>
        </Modal>
      )}

      <IncompleteProfileNotification
        visible={showIncompleteNotification}
        onClose={() => setShowIncompleteNotification(false)}
        onUpdate={() => {
          setShowIncompleteNotification(false);
          router.push("/(tabs)/profile");
        }}
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

// ✨ ESTILOS
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  loadingText: { fontFamily: FONT_BODY, fontSize: 13, color: "#666", marginTop: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 50, paddingHorizontal: 20, marginBottom: 20 },
  backButton: { width: 44 },
  backButtonContainer: { backgroundColor: "#f5f5f5", borderRadius: 24, padding: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  title: { fontFamily: FONT_TITLE, fontSize: 20, color: "#111", letterSpacing: 2, fontWeight: '700' },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 },
  emptyIconContainer: { marginBottom: 30 },
  emptyTitle: { fontFamily: FONT_TITLE, fontSize: 28, color: "#111", marginBottom: 15, textAlign: "center", letterSpacing: 1, fontWeight: '700' },
  emptySubtitle: { fontFamily: FONT_BODY, fontSize: 15, color: "#666", textAlign: "center", lineHeight: 24, marginBottom: 40 },
  loginButton: { backgroundColor: "#000", paddingHorizontal: 30, paddingVertical: 18, borderRadius: 30, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  loginButtonText: { fontFamily: FONT_MODERN, fontSize: 14, color: "#fff", letterSpacing: 1, textTransform: "uppercase", fontWeight: '600' },
  exploreButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#000", paddingHorizontal: 30, paddingVertical: 16, borderRadius: 30, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  exploreButtonText: { fontFamily: FONT_MODERN, fontSize: 14, color: "#fff", letterSpacing: 1, textTransform: "uppercase", fontWeight: '600' },
  listContainer: { paddingBottom: 200, paddingHorizontal: 20, paddingTop: 10 },
  cardContainer: { width: "100%", marginBottom: 16 },
  card: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, padding: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  imageContainer: { position: "relative", width: 90, height: 120, borderRadius: 8, overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  imageGradient: { position: "absolute", width: "100%", height: "100%" },
  outOfStockBadge: { position: "absolute", top: "40%", left: 0, right: 0, backgroundColor: "rgba(239, 68, 68, 0.96)", paddingVertical: 6, alignItems: "center" },
  outOfStockText: { color: "#fff", fontFamily: FONT_MODERN, fontSize: 10, letterSpacing: 1.5, fontWeight: '700' },
  infoBox: { flex: 1, paddingLeft: 14, justifyContent: "space-between" },
  cardBrand: { fontFamily: FONT_BODY, fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  cardName: { fontFamily: FONT_MODERN, fontSize: 15, color: "#111", lineHeight: 20, marginBottom: 8, fontWeight: '600' },
  totalItemText: { fontFamily: FONT_TITLE, fontSize: 18, color: "#000", marginBottom: 6, fontWeight: '700' },
  stockText: { fontFamily: FONT_BODY, fontSize: 11, color: "#10B981", marginBottom: 10 },
  stockTextDanger: { color: "#EF4444" },
  stockTextWarning: { color: "#F59E0B" },
  quantityContainer: { flexDirection: "row", alignItems: "center", borderRadius: 8, borderWidth: 1.5, borderColor: "#e8e8e8", alignSelf: "flex-start", backgroundColor: "#fafafa" },
  quantityButton: { paddingHorizontal: 12, paddingVertical: 8 },
  quantityButtonDisabled: { opacity: 0.4 },
  quantity: { marginHorizontal: 12, fontFamily: FONT_TITLE, fontSize: 16, color: "#111", minWidth: 20, textAlign: "center", fontWeight: '700' },
  deleteButton: { justifyContent: "center", alignItems: "center", paddingLeft: 12 },
  deleteButtonContainer: { backgroundColor: "#fee", borderRadius: 8, padding: 8 },
  footerFixed: { position: "absolute", bottom: Platform.OS === 'ios' ? 80 : 60, left: 0, right: 0, backgroundColor: "#fff", borderTopWidth: 1, borderColor: "#f0f0f0", paddingTop: 20, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 25 : 20, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 10 },
  summaryContainer: { marginBottom: 16 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabelFinal: { fontFamily: FONT_TITLE, fontSize: 20, color: "#000", fontWeight: '700' },
  totalPriceFinal: { fontFamily: FONT_TITLE, fontSize: 24, color: "#000", fontWeight: '700' },
  checkoutButton: { flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#000", paddingVertical: 16, borderRadius: 30, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  checkoutButtonText: { color: "#fff", fontFamily: FONT_MODERN, fontSize: 15, letterSpacing: 1, textTransform: "uppercase", fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: "90%", width: "100%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontFamily: FONT_TITLE, fontSize: 22, color: "#111", letterSpacing: 1, fontWeight: '700' },
  wawalletCardContainer: { marginBottom: 20 },
  loadingCard: { padding: 40, alignItems: "center" },
  wawalletCard: { position: "relative", borderRadius: 16, padding: 24, marginBottom: 20, overflow: "hidden", height: 180 },
  cardGradientBg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  wawalletCardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  wawalletCardTitle: { color: "#fff", fontSize: 24, fontFamily: FONT_TITLE, marginLeft: 12, letterSpacing: 2, fontWeight: '700' },
  wawalletCardNumber: { color: "#fff", fontSize: 20, fontFamily: "monospace", fontWeight: "700", letterSpacing: 2, marginBottom: 16 },
  wawalletCardOwner: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontFamily: FONT_BODY, textTransform: "uppercase", letterSpacing: 1 },
  warningBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEF3C7", padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: "#FDE68A" },
  warningText: { marginLeft: 12, fontFamily: FONT_MODERN, fontSize: 13, color: "#92400E", flex: 1, lineHeight: 20, fontWeight: '600' },
  changeTarjetaButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  changeTarjetaText: { color: "#000", fontSize: 14, fontFamily: FONT_MODERN, textDecorationLine: "underline", marginLeft: 8, fontWeight: '600' },
  addTarjetaButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f5", padding: 20, borderRadius: 16, borderWidth: 2, borderColor: "#e8e8e8", borderStyle: "dashed" },
  addTarjetaText: { fontFamily: FONT_MODERN, fontSize: 15, marginLeft: 12, color: "#000", fontWeight: '600' },
  confirmButton: { flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#000", paddingVertical: 18, borderRadius: 30, marginTop: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  confirmButtonDisabled: { backgroundColor: "#d1d5db", shadowOpacity: 0 },
  confirmText: { color: "#fff", fontFamily: FONT_TITLE, fontSize: 16, letterSpacing: 1, fontWeight: '700' },
  successOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" },
  successContainer: { alignItems: "center", justifyContent: "center" },
  mainCircle: { width: 220, height: 220, borderRadius: 110, backgroundColor: "#10B981", justifyContent: "center", alignItems: "center" },
  checkmarkContainer: { justifyContent: "center", alignItems: "center" },
  successTextContainer: { alignItems: "center", paddingHorizontal: 40, marginTop: 50 },
  successTitle: { fontFamily: FONT_TITLE, fontSize: 34, color: "#fff", letterSpacing: 1.5, marginBottom: 16, textAlign: "center", fontWeight: '700' },
  successSubtitle: { fontFamily: FONT_BODY, fontSize: 16, color: "#aaa", letterSpacing: 0.5, textAlign: "center", lineHeight: 24 },
  toastContainer: { position: "absolute", top: 0, left: 20, right: 20, borderRadius: 16, zIndex: 999999, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 999 },
  toastContent: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 },
  toastText: { color: "#fff", fontSize: 14, fontFamily: FONT_MODERN, marginLeft: 12, flex: 1, letterSpacing: 0.3, fontWeight: '600' },
  incompleteNotificationContainer: { position: "absolute", top: 10, left: 15, right: 15, zIndex: 999998, borderRadius: 16, overflow: "hidden", shadowColor: "#EF4444", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 998 },
  incompleteNotificationGradient: { padding: 16 },
  incompleteNotificationContent: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  incompleteNotificationIconContainer: { marginRight: 12, marginTop: 2 },
  incompleteNotificationTextContainer: { flex: 1 },
  incompleteNotificationTitle: { fontFamily: FONT_TITLE, fontSize: 16, color: "#fff", marginBottom: 4, letterSpacing: 0.5, fontWeight: '700' },
  incompleteNotificationMessage: { fontFamily: FONT_BODY, fontSize: 13, color: "#fff", opacity: 0.95, lineHeight: 18 },
  incompleteNotificationActions: { flexDirection: "row", gap: 10 },
  incompleteNotificationButtonSecondary: { flex: 1, backgroundColor: "rgba(255,255,255,0.2)", paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  incompleteNotificationButtonSecondaryText: { fontFamily: FONT_MODERN, fontSize: 13, color: "#fff", fontWeight: '600' },
  incompleteNotificationButtonPrimary: { flex: 1, backgroundColor: "#fff", paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  incompleteNotificationButtonPrimaryText: { fontFamily: FONT_MODERN, fontSize: 13, color: "#DC2626", fontWeight: '600' },
  confirmModalBackdrop: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.75)", justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  confirmModalContainer: { backgroundColor: "#fff", borderRadius: 24, padding: 32, width: "100%", maxWidth: 400, shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 20 },
  confirmIconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#f5f5f5", justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 24 },
  confirmTitle: { fontFamily: FONT_TITLE, fontSize: 24, color: "#111", textAlign: "center", marginBottom: 16, letterSpacing: 0.5, fontWeight: '700' },
  confirmMessage: { fontFamily: FONT_BODY, fontSize: 15, color: "#666", textAlign: "center", lineHeight: 24, marginBottom: 32 },
  confirmButtons: { gap: 12 },
  confirmConfirmButton: { backgroundColor: "#111", paddingVertical: 16, borderRadius: 16, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  confirmConfirmText: { fontFamily: FONT_TITLE, fontSize: 16, color: "#fff", letterSpacing: 0.5, fontWeight: '700' },
  confirmCancelButton: { backgroundColor: "#f5f5f5", paddingVertical: 16, borderRadius: 16, alignItems: "center" },
  confirmCancelText: { fontFamily: FONT_MODERN, fontSize: 16, color: "#666", letterSpacing: 0.5, fontWeight: '600' },
});
