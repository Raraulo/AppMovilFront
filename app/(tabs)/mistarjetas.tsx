// app/(tabs)/mistarjetas.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from 'expo-linear-gradient';
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import {
  addCard,
  getActiveCardId,
  getCards,
  removeCard,
  setActiveCard,
  type Card
} from "../../utils/storage";

const { width, height } = Dimensions.get("window");
const SWIPE_THRESHOLD = -80;

// 🎨 TIPOGRAFÍA PREMIUM NATIVA
const FONT_TITLE = Platform.OS === 'ios' ? 'Didot' : 'serif';
const FONT_BODY = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const FONT_MODERN = Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif';
const FONT_MONO = Platform.OS === 'ios' ? 'Courier' : 'monospace';

// ✨ EXPORTAR CARD_COLORS PARA USAR EN EL CARRITO
export const CARD_COLORS = [
  ['#0f172a', '#1e293b', '#334155'],
  ['#1e1b4b', '#312e81', '#4c1d95'],
  ['#1f2937', '#374151', '#4b5563'],
  ['#7c2d12', '#9a3412', '#c2410c'],
  ['#064e3b', '#065f46', '#047857'],
  ['#4c1d95', '#5b21b6', '#6d28d9'],
];

export const getCardGradient = (index: number) => CARD_COLORS[index % CARD_COLORS.length];

// ==================== TUTORIAL ANIMADO PRIMERA VEZ ====================
const SwipeTutorial = ({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Animación de swipe continua
      Animated.loop(
        Animated.sequence([
          Animated.timing(slideAnim, {
            toValue: -80,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(300),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(1000),
        ])
      ).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.tutorialOverlay, { opacity: overlayAnim }]}>
        <TouchableOpacity style={styles.tutorialBackdrop} activeOpacity={1} onPress={onDismiss} />
        
        <Animated.View style={[styles.tutorialContent, { opacity: fadeAnim }]}>
          <View style={styles.tutorialIconContainer}>
            <Ionicons name="hand-left-outline" size={48} color="#F59E0B" />
          </View>

          <Text style={styles.tutorialTitle}>¡Desliza para eliminar!</Text>
          <Text style={styles.tutorialMessage}>
            Arrastra cualquier tarjeta hacia la izquierda para eliminarla de tu cuenta
          </Text>

          <View style={styles.tutorialDemoContainer}>
            <View style={styles.tutorialDeleteIcon}>
              <Ionicons name="trash" size={28} color="#EF4444" />
            </View>
            <Animated.View style={[styles.tutorialCard, { transform: [{ translateX: slideAnim }] }]}>
              <LinearGradient colors={CARD_COLORS[0]} style={styles.tutorialCardInner}>
                <View style={styles.tutorialCardChip} />
                <Text style={styles.tutorialCardNumber}>•••• •••• •••• 1234</Text>
              </LinearGradient>
            </Animated.View>
          </View>

          <TouchableOpacity style={styles.tutorialButton} onPress={onDismiss} activeOpacity={0.85}>
            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.tutorialButtonGradient}>
              <Text style={styles.tutorialButtonText}>¡Entendido!</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ==================== SWIPEABLE CARD ITEM ====================
const SwipeableCard = ({ item, isActive, onSetActive, onDelete }: any) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isSwiped, setIsSwiped] = useState(false);
  const hasTriggeredDelete = useRef(false); // Para evitar doble llamada

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < SWIPE_THRESHOLD) {
          Animated.spring(translateX, {
            toValue: SWIPE_THRESHOLD,
            useNativeDriver: true,
            friction: 8,
          }).start();
          setIsSwiped(true);
          
          if (Platform.OS === 'ios' || Platform.OS === 'android') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }

          // ✨ LLAMAR AUTOMÁTICAMENTE A ELIMINAR CUANDO HACE SWIPE COMPLETO
          if (!hasTriggeredDelete.current) {
            hasTriggeredDelete.current = true;
            setTimeout(() => {
              onDelete();
              hasTriggeredDelete.current = false;
            }, 100);
          }
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
          setIsSwiped(false);
        }
      },
    })
  ).current;

  const closeSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
    setIsSwiped(false);
    hasTriggeredDelete.current = false;
  };

  const handleCardPress = () => {
    if (isSwiped) {
      closeSwipe();
    } else if (!isActive) {
      onSetActive();
    }
  };

  const cardColors = getCardGradient(item.colorIndex);

  return (
    <View style={styles.swipeableContainer}>
      <View style={styles.deleteButtonBehind}>
        <Ionicons name="trash" size={35} color="#EF4444" />
      </View>

      <Animated.View
        style={[
          styles.cardAnimatedWrapper,
          { transform: [{ translateX }] }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          onPress={handleCardPress}
          activeOpacity={isActive ? 1 : 0.9}
          style={[
            styles.creditCardWrapper,
            isActive && styles.creditCardWrapperActive
          ]}
        >
          <LinearGradient
            colors={cardColors}
            style={styles.creditCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[
              styles.statusIndicator,
              isActive ? styles.statusIndicatorActive : styles.statusIndicatorInactive
            ]}>
              {isActive ? (
                <>
                  <View style={styles.activePulse} />
                  <View style={styles.activeDot} />
                  <Text style={styles.statusTextActive}>PRINCIPAL</Text>
                </>
              ) : (
                <>
                  <Ionicons name="radio-button-off-outline" size={14} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.statusTextInactive}>Disponible</Text>
                </>
              )}
            </View>

            <View style={styles.chipDecoration}>
              <View style={styles.chipInner} />
            </View>

            <View style={styles.cardNumberContainer}>
              <Text style={styles.creditCardNumber}>
                {`•••• •••• •••• ${item.numero.replace(/\s/g, "").slice(-4)}`}
              </Text>
            </View>

            <View style={styles.creditCardBottom}>
              <View style={styles.cardInfoSection}>
                <Text style={styles.creditCardLabel}>VENCE</Text>
                <Text style={styles.creditCardExpiry}>
                  {item.fecha}
                </Text>
              </View>
            </View>

            <View style={styles.cardPattern}>
              <View style={styles.cardPatternCircle1} />
              <View style={styles.cardPatternCircle2} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {isActive && (
          <View style={styles.activeCardBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.activeCardBadgeText}>Método de pago predeterminado</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

// ==================== PROFESSIONAL MODAL NOTIFICATION ====================
const NotificationModal = ({ visible, title, message, type = "error", onClose, onConfirm, showCancel = false }: any) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
          tension: 50,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const getConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: "checkmark-circle",
          iconColor: "#10B981",
          iconBg: "#D1FAE5",
          buttonColor: "#10B981",
        };
      case "error":
        return {
          icon: "close-circle",
          iconColor: "#EF4444",
          iconBg: "#FEE2E2",
          buttonColor: "#EF4444",
        };
      case "warning":
        return {
          icon: "alert-circle",
          iconColor: "#F59E0B",
          iconBg: "#FEF3C7",
          buttonColor: "#F59E0B",
        };
      default:
        return {
          icon: "information-circle",
          iconColor: "#3B82F6",
          iconBg: "#DBEAFE",
          buttonColor: "#3B82F6",
        };
    }
  };

  const config = getConfig();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.notificationOverlay,
          { opacity: opacityAnim },
        ]}
      >
        <TouchableOpacity
          style={styles.notificationBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.notificationContent,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <View style={[styles.notificationIconContainer, { backgroundColor: config.iconBg }]}>
            <Ionicons name={config.icon as any} size={48} color={config.iconColor} />
          </View>

          <Text style={styles.notificationTitle}>{title}</Text>
          <Text style={styles.notificationMessage}>{message}</Text>

          {showCancel ? (
            <View style={styles.notificationButtonsRow}>
              <TouchableOpacity
                style={[styles.notificationButtonHalf, styles.notificationButtonCancel]}
                onPress={onClose}
                activeOpacity={0.85}
              >
                <Text style={styles.notificationButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.notificationButtonHalf, { backgroundColor: config.buttonColor }]}
                onPress={onConfirm}
                activeOpacity={0.85}
              >
                <Text style={styles.notificationButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.notificationButton, { backgroundColor: config.buttonColor }]}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.notificationButtonText}>Entendido</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default function MisTarjetasScreen() {
  const [tarjetas, setTarjetas] = useState<Card[]>([]);
  const [tarjetaActiva, setTarjetaActiva] = useState<string | null>(null);
  const [modalAgregar, setModalAgregar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false); // ✨ TUTORIAL
  const [notification, setNotification] = useState({
    visible: false,
    title: "",
    message: "",
    type: "error",
    showCancel: false,
    onConfirm: () => {}
  });

  const [numero, setNumero] = useState("");
  const [fecha, setFecha] = useState("");
  const [cvv, setCvv] = useState("");
  const [colorIndex, setColorIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const cardFlipAnim = useRef(new Animated.Value(1)).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    cargarTarjetas();
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  const showNotification = (
    title: string,
    message: string,
    type: "success" | "error" | "warning" = "error",
    showCancel: boolean = false,
    onConfirm: () => void = () => {}
  ) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(type === "error" ? [0, 100, 50, 100] : 50);
    }
    setNotification({ visible: true, title, message, type, showCancel, onConfirm });
  };

  const hideNotification = () => {
    setNotification({ ...notification, visible: false });
  };

  const cargarTarjetas = async () => {
    try {
      const cards = await getCards();
      const activeId = await getActiveCardId();
      setTarjetas(cards);
      setTarjetaActiva(activeId);
      console.log("✅ Tarjetas cargadas:", cards.length);
    } catch (error) {
      console.error("Error cargando tarjetas:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmarCambioActiva = async (id: string) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Animated.sequence([
      Animated.timing(cardFlipAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardFlipAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    await setActiveCard(id);
    setTarjetaActiva(id);
    showNotification(
      "Operación exitosa",
      "La tarjeta principal ha sido actualizada correctamente",
      "success"
    );
  };

  const confirmarEliminar = async (id: string) => {
    showNotification(
      "Confirmar eliminación",
      "¿Está seguro de que desea eliminar esta tarjeta? Esta acción no se puede deshacer.",
      "warning",
      true,
      async () => {
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        hideNotification();
        await removeCard(id);
        await cargarTarjetas();
        setTimeout(() => {
          showNotification(
            "Operación completada",
            "La tarjeta ha sido eliminada de su cuenta",
            "success"
          );
        }, 300);
      }
    );
  };

  const abrirModalAgregar = () => {
    setModalAgregar(true);
    Animated.parallel([
      Animated.spring(modalSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const cerrarModalAgregar = () => {
    Animated.parallel([
      Animated.timing(modalSlideAnim, {
        toValue: height,
        duration: 350,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalAgregar(false);
      limpiarFormulario();
    });
  };

  const limpiarFormulario = () => {
    setNumero("");
    setFecha("");
    setCvv("");
    setColorIndex(0);
  };

  const tarjetaYaExiste = (numeroNuevo: string): boolean => {
    const numeroLimpio = numeroNuevo.replace(/\s/g, "");
    return tarjetas.some(t => t.numero.replace(/\s/g, "") === numeroLimpio);
  };

  const validarCVV = (cvvValue: string): boolean => {
    if (!/^\d{3}$/.test(cvvValue)) {
      return false;
    }

    const cvvsTriviales = [
      "000", "111", "222", "333", "444", "555", "666", "777", "888", "999",
      "123", "234", "345", "456", "567", "678", "789",
      "012", "321", "654", "987"
    ];

    if (cvvsTriviales.includes(cvvValue)) {
      return false;
    }

    if (cvvValue[0] === cvvValue[1] && cvvValue[1] === cvvValue[2]) {
      return false;
    }

    return true;
  };

  const verificarTarjetaEnBackend = async (numeroTarjeta: string): Promise<boolean> => {
    try {
      const queryBody = {
        structuredQuery: {
          from: [{ collectionId: "usuarios" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "tarjeta.numero" },
              op: "EQUAL",
              value: { stringValue: numeroTarjeta },
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
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error verificando tarjeta en backend:', error);
      return false;
    }
  };

  const validarFormulario = (): { valid: boolean; title: string; message: string } => {
    if (!numero.trim()) {
      return {
        valid: false,
        title: "Campo requerido",
        message: "El número de tarjeta es obligatorio"
      };
    }

    const numeroLimpio = numero.replace(/\s/g, "");

    if (numeroLimpio.length !== 16) {
      return {
        valid: false,
        title: "Número inválido",
        message: "El número de tarjeta debe contener exactamente 16 dígitos"
      };
    }

    if (!/^\d+$/.test(numeroLimpio)) {
      return {
        valid: false,
        title: "Formato incorrecto",
        message: "El número de tarjeta solo puede contener dígitos numéricos"
      };
    }

    if (tarjetaYaExiste(numero)) {
      return {
        valid: false,
        title: "Tarjeta duplicada",
        message: "Esta tarjeta ya se encuentra registrada en su cuenta"
      };
    }

    if (!fecha.trim()) {
      return {
        valid: false,
        title: "Campo requerido",
        message: "La fecha de vencimiento es obligatoria"
      };
    }

    if (fecha.length !== 5 || !fecha.includes('/')) {
      return {
        valid: false,
        title: "Formato incorrecto",
        message: "Use el formato MM/AA para la fecha de vencimiento"
      };
    }

    const [mes, anio] = fecha.split('/');
    const mesNum = parseInt(mes);
    const anioNum = parseInt(anio);

    if (isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
      return {
        valid: false,
        title: "Mes inválido",
        message: "El mes debe estar entre 01 y 12"
      };
    }

    if (isNaN(anioNum)) {
      return {
        valid: false,
        title: "Año inválido",
        message: "El año ingresado no es válido"
      };
    }

    const anioActual = new Date().getFullYear() % 100;
    const mesActual = new Date().getMonth() + 1;

    if (anioNum < anioActual || (anioNum === anioActual && mesNum < mesActual)) {
      return {
        valid: false,
        title: "Tarjeta vencida",
        message: "La tarjeta se encuentra vencida. Ingrese una tarjeta válida"
      };
    }

    if (anioNum > anioActual + 10) {
      return {
        valid: false,
        title: "Fecha inválida",
        message: "La fecha de vencimiento ingresada no es válida"
      };
    }

    if (!cvv.trim()) {
      return {
        valid: false,
        title: "Campo requerido",
        message: "El código CVV es obligatorio"
      };
    }

    if (!validarCVV(cvv.trim())) {
      return {
        valid: false,
        title: "CVV inválido",
        message: "El código CVV ingresado no es válido. Verifique los 3 dígitos al reverso de su tarjeta"
      };
    }

    return { valid: true, title: "", message: "" };
  };

  const handleAgregarTarjeta = async () => {
    if (procesando) return;

    const validacion = validarFormulario();
    if (!validacion.valid) {
      showNotification(validacion.title, validacion.message, "error");
      return;
    }

    setVerificando(true);
    setProcesando(true);

    try {
      const numeroLimpio = numero.replace(/\s/g, "");

      const existeEnBackend = await verificarTarjetaEnBackend(numeroLimpio);

      if (!existeEnBackend) {
        showNotification(
          "Tarjeta no encontrada",
          "Esta tarjeta no está registrada en el sistema WaWallet. Verifica el número e intenta nuevamente.",
          "error"
        );
        setVerificando(false);
        setProcesando(false);
        return;
      }

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const nuevaTarjeta: Omit<Card, 'id'> = {
        numero: numeroLimpio,
        titular: "TARJETA DE CRÉDITO",
        fecha,
        cvv,
        colorIndex,
      };

      await addCard(nuevaTarjeta);
      await cargarTarjetas();
      
      cerrarModalAgregar();

      // ✨ MOSTRAR TUTORIAL SI ES LA PRIMERA TARJETA
      const hasSeenTutorial = await AsyncStorage.getItem('swipe_tutorial_seen');
      if (!hasSeenTutorial && tarjetas.length === 0) {
        setTimeout(() => {
          setShowTutorial(true);
        }, 800);
      }
      
      setTimeout(() => {
        showNotification(
          "Operación exitosa",
          "La tarjeta ha sido verificada y agregada correctamente a su cuenta",
          "success"
        );
      }, 400);
    } catch (error) {
      console.error("Error:", error);
      showNotification(
        "Error del sistema",
        "No se pudo agregar la tarjeta. Intente nuevamente",
        "error"
      );
    } finally {
      setVerificando(false);
      setProcesando(false);
    }
  };

  const handleDismissTutorial = async () => {
    await AsyncStorage.setItem('swipe_tutorial_seen', 'true');
    setShowTutorial(false);
  };

  const formatNumeroTarjeta = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
    setNumero(formatted);
  };

  const formatFecha = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 2) {
      setFecha(cleaned.slice(0, 2) + "/" + cleaned.slice(2));
    } else {
      setFecha(cleaned);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Cargando información...</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => router.push("/(tabs)/profile")}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.title}>Mis Tarjetas</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.cardsSection}>
              {tarjetas.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="card-outline" size={64} color="#ccc" />
                  </View>
                  <Text style={styles.emptyTitle}>No hay tarjetas registradas</Text>
                  <Text style={styles.emptySubtitle}>
                    Agregue una tarjeta de pago para comenzar a realizar compras
                  </Text>
                </View>
              ) : (
                <>
                  {tarjetas.map((item) => (
                    <SwipeableCard
                      key={item.id}
                      item={item}
                      isActive={tarjetaActiva === item.id}
                      onSetActive={() => confirmarCambioActiva(item.id)}
                      onDelete={() => confirmarEliminar(item.id)}
                    />
                  ))}
                </>
              )}
            </View>

            <View style={{ height: 150 }} />
          </ScrollView>

          <View style={styles.addButtonContainer}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={abrirModalAgregar}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#000', '#1a1a1a']}
                style={styles.addButtonGradient}
              >
                <Ionicons name="add-circle-outline" size={24} color="#fff" />
                <Text style={styles.addButtonText}>Agregar nueva tarjeta</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* MODAL AGREGAR TARJETA */}
        <Modal
          visible={modalAgregar}
          transparent
          animationType="none"
          onRequestClose={cerrarModalAgregar}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            <Animated.View style={[styles.modalOverlay, { opacity: overlayOpacity }]}>
              <TouchableOpacity
                style={styles.modalBackdrop}
                activeOpacity={1}
                onPress={cerrarModalAgregar}
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.modalContent,
                {
                  transform: [{ translateY: modalSlideAnim }],
                },
              ]}
            >
              <View style={styles.modalHandle} />

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.modalTitle}>Agregar Tarjeta</Text>

                <LinearGradient
                  colors={getCardGradient(colorIndex)}
                  style={styles.previewCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.chipDecoration}>
                    <View style={styles.chipInner} />
                  </View>
                  <Text style={styles.previewNumber}>
                    {numero || "•••• •••• •••• ••••"}
                  </Text>
                  <View style={styles.previewBottom}>
                    <View>
                      <Text style={styles.previewLabel}>VENCE</Text>
                      <Text style={styles.previewValue}>{fecha || "MM/AA"}</Text>
                    </View>
                  </View>
                  <View style={styles.cardPattern}>
                    <View style={styles.cardPatternCircle1} />
                    <View style={styles.cardPatternCircle2} />
                  </View>
                </LinearGradient>

                <View style={styles.colorSelectorContainer}>
                  <Text style={styles.colorSelectorLabel}>Diseño de tarjeta</Text>
                  <View style={styles.colorSelector}>
                    {CARD_COLORS.map((colors, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setColorIndex(index);
                          if (Platform.OS === 'ios' || Platform.OS === 'android') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <LinearGradient
                          colors={colors}
                          style={[
                            styles.colorOption,
                            colorIndex === index && styles.colorOptionSelected,
                          ]}
                        >
                          {colorIndex === index && (
                            <Ionicons name="checkmark" size={18} color="#fff" />
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Número de tarjeta WaWallet</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor="#999"
                    value={numero}
                    onChangeText={formatNumeroTarjeta}
                    keyboardType="numeric"
                    maxLength={19}
                    editable={!procesando}
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.inputLabel}>Fecha de vencimiento</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="MM/AA"
                      placeholderTextColor="#999"
                      value={fecha}
                      onChangeText={formatFecha}
                      keyboardType="numeric"
                      maxLength={5}
                      editable={!procesando}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Código CVV</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="123"
                      placeholderTextColor="#999"
                      value={cvv}
                      onChangeText={(text) => setCvv(text.replace(/\D/g, "").slice(0, 3))}
                      keyboardType="numeric"
                      maxLength={3}
                      secureTextEntry
                      editable={!procesando}
                    />
                  </View>
                </View>

                {verificando && (
                  <View style={styles.verificandoContainer}>
                    <ActivityIndicator color="#3B82F6" size="small" />
                    <Text style={styles.verificandoText}>Verificando tarjeta en WaWallet...</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.primaryButton, (procesando || verificando) && styles.primaryButtonDisabled]}
                  onPress={handleAgregarTarjeta}
                  disabled={procesando || verificando}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={(procesando || verificando) ? ['#ccc', '#999'] : ['#000', '#1a1a1a']}
                    style={styles.primaryButtonGradient}
                  >
                    {procesando ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        {verificando ? "Verificando..." : "Verificar y agregar"}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={cerrarModalAgregar}
                  disabled={procesando}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.secondaryButtonText, procesando && { opacity: 0.5 }]}>
                    Cancelar operación
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </KeyboardAvoidingView>
        </Modal>
      </View>

      {/* MODAL DE NOTIFICACIÓN */}
      <NotificationModal
        visible={notification.visible}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
        onConfirm={notification.onConfirm}
        showCancel={notification.showCancel}
      />

      {/* ✨ TUTORIAL ANIMADO PRIMERA VEZ */}
      <SwipeTutorial visible={showTutorial} onDismiss={handleDismissTutorial} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FAFAFA" },
  loadingText: { marginTop: 16, fontSize: 16, color: "#666", fontFamily: FONT_BODY },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: Platform.OS === "ios" ? 60 : 50, paddingBottom: 20, backgroundColor: "#FAFAFA" },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  title: { fontSize: 20, fontFamily: FONT_TITLE, color: "#000", letterSpacing: 0.5, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  cardsSection: { marginBottom: 20 },
  swipeableContainer: {
    marginBottom: 24,
    position: "relative",
  },
  deleteButtonBehind: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 20,
  },
  cardAnimatedWrapper: {
    marginBottom: 0,
  },
  creditCardWrapper: { borderRadius: 20, overflow: "hidden", elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 12 },
  creditCardWrapperActive: { shadowColor: "#10B981", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 12 },
  creditCard: { width: "100%", height: 200, borderRadius: 20, padding: 24, justifyContent: "space-between", position: "relative" },
  statusIndicator: { position: "absolute", top: 16, right: 16, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  statusIndicatorActive: { backgroundColor: "rgba(16, 185, 129, 0.25)" },
  statusIndicatorInactive: { backgroundColor: "rgba(255, 255, 255, 0.15)" },
  activePulse: { position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: "#10B981", opacity: 0.3 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" },
  statusTextActive: { color: "#10B981", fontSize: 11, fontFamily: FONT_TITLE, letterSpacing: 1, fontWeight: '700' },
  statusTextInactive: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: FONT_MODERN, letterSpacing: 0.5, fontWeight: '600' },
  chipDecoration: { width: 50, height: 40, borderRadius: 8, backgroundColor: "rgba(255, 255, 255, 0.25)", padding: 6, marginBottom: 8 },
  chipInner: { flex: 1, borderRadius: 4, backgroundColor: "rgba(255, 255, 255, 0.4)" },
  cardNumberContainer: { marginVertical: 8 },
  creditCardNumber: { fontSize: 22, fontWeight: "600", color: "#fff", letterSpacing: 2, fontFamily: FONT_MONO },
  creditCardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  cardInfoSection: { flex: 1 },
  creditCardLabel: { fontSize: 10, color: "rgba(255,255,255,0.7)", marginBottom: 4, letterSpacing: 1, fontFamily: FONT_MODERN, fontWeight: '600' },
  creditCardExpiry: { fontSize: 14, fontWeight: "600", color: "#fff", fontFamily: FONT_MONO },
  cardPattern: { position: "absolute", top: -30, right: -30, width: 200, height: 200, opacity: 0.1 },
  cardPatternCircle1: { position: "absolute", width: 150, height: 150, borderRadius: 75, backgroundColor: "#fff", top: 20, right: 20 },
  cardPatternCircle2: { position: "absolute", width: 100, height: 100, borderRadius: 50, backgroundColor: "#fff", bottom: 0, left: 0 },
  activeCardBadge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", backgroundColor: "rgba(16, 185, 129, 0.1)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginTop: 8, gap: 6 },
  activeCardBadgeText: { fontSize: 13, fontFamily: FONT_MODERN, color: "#10B981", letterSpacing: 0.3, fontWeight: '600' },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyIconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontFamily: FONT_TITLE, color: "#333", marginBottom: 8, fontWeight: '700' },
  emptySubtitle: { fontSize: 15, fontFamily: FONT_BODY, color: "#666", textAlign: "center", paddingHorizontal: 40, lineHeight: 22 },
  addButtonContainer: {
    position: "absolute",
    bottom: 62,
    left: 0,
    right: 0,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  addButton: { borderRadius: 16, overflow: "hidden", elevation: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10 },
  addButtonGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 18, gap: 12 },
  addButtonText: { color: "#fff", fontSize: 16, fontFamily: FONT_TITLE, letterSpacing: 0.5, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  modalBackdrop: { flex: 1 },
  modalContent: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingTop: 12, paddingBottom: Platform.OS === "ios" ? 40 : 24, maxHeight: height * 0.9 },
  modalHandle: { width: 40, height: 4, backgroundColor: "#ddd", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 26, fontFamily: FONT_TITLE, color: "#000", marginBottom: 24, textAlign: "center", letterSpacing: 0.5, fontWeight: '700' },
  previewCard: { height: 200, borderRadius: 20, padding: 24, marginBottom: 24, justifyContent: "space-between", position: "relative", overflow: "hidden" },
  previewNumber: { fontSize: 22, fontWeight: "600", color: "#fff", letterSpacing: 2, fontFamily: FONT_MONO },
  previewBottom: { flexDirection: "row", justifyContent: "space-between" },
  previewLabel: { fontSize: 10, color: "rgba(255,255,255,0.7)", marginBottom: 4, letterSpacing: 1, fontFamily: FONT_MODERN, fontWeight: '600' },
  previewValue: { fontSize: 14, fontWeight: "600", color: "#fff", letterSpacing: 0.5, fontFamily: FONT_MONO },
  colorSelectorContainer: { marginBottom: 24 },
  colorSelectorLabel: { fontSize: 15, fontFamily: FONT_MODERN, color: "#333", marginBottom: 12, letterSpacing: 0.3, fontWeight: '600' },
  colorSelector: { flexDirection: "row", gap: 12 },
  colorOption: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  colorOptionSelected: { borderWidth: 3, borderColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  formGroup: { marginBottom: 20 },
  formRow: { flexDirection: "row" },
  inputLabel: { fontSize: 14, fontFamily: FONT_MODERN, color: "#333", marginBottom: 8, letterSpacing: 0.3, fontWeight: '600' },
  input: { backgroundColor: "#F5F5F5", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontFamily: FONT_BODY, color: "#000", borderWidth: 1, borderColor: "transparent" },
  verificandoContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#EFF6FF", padding: 16, borderRadius: 12, marginBottom: 16, gap: 12 },
  verificandoText: { fontSize: 14, fontFamily: FONT_MODERN, color: "#3B82F6", letterSpacing: 0.3, fontWeight: '600' },
  primaryButton: { borderRadius: 16, overflow: "hidden", marginTop: 10, elevation: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10 },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonGradient: { paddingVertical: 16, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontSize: 16, fontFamily: FONT_TITLE, letterSpacing: 0.5, fontWeight: '700' },
  secondaryButton: { paddingVertical: 16, alignItems: "center", marginTop: 12 },
  secondaryButtonText: { color: "#666", fontSize: 16, fontFamily: FONT_MODERN, letterSpacing: 0.3, fontWeight: '600' },
  notificationOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.7)", justifyContent: "center", alignItems: "center", padding: 20 },
  notificationBackdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  notificationContent: { backgroundColor: "#fff", borderRadius: 24, padding: 32, width: "100%", maxWidth: 380, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.4, shadowRadius: 30, elevation: 20 },
  notificationIconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  notificationTitle: { fontSize: 22, fontFamily: FONT_TITLE, color: "#1F2937", marginBottom: 12, textAlign: "center", letterSpacing: 0.3, fontWeight: '700' },
  notificationMessage: { fontSize: 15, fontFamily: FONT_BODY, color: "#6B7280", textAlign: "center", lineHeight: 22, marginBottom: 28, paddingHorizontal: 10 },
  notificationButton: { width: "100%", paddingVertical: 16, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  notificationButtonText: { color: "#fff", fontSize: 16, fontFamily: FONT_TITLE, letterSpacing: 0.5, fontWeight: '700' },
  notificationButtonsRow: { flexDirection: "row", width: "100%", gap: 12 },
  notificationButtonHalf: { flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  notificationButtonCancel: { backgroundColor: "#F3F4F6" },
  notificationButtonTextCancel: { color: "#6B7280", fontSize: 16, fontFamily: FONT_TITLE, letterSpacing: 0.5, fontWeight: '700' },

  // ✨ TUTORIAL ANIMADO
  tutorialOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.85)", justifyContent: "center", alignItems: "center", padding: 20 },
  tutorialBackdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  tutorialContent: { backgroundColor: "#fff", borderRadius: 24, padding: 32, width: "100%", maxWidth: 400, alignItems: "center" },
  tutorialIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#FEF3C7", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  tutorialTitle: { fontSize: 24, fontFamily: FONT_TITLE, color: "#000", marginBottom: 12, textAlign: "center", fontWeight: '700' },
  tutorialMessage: { fontSize: 15, fontFamily: FONT_BODY, color: "#666", textAlign: "center", lineHeight: 22, marginBottom: 28 },
  tutorialDemoContainer: { width: "100%", height: 140, backgroundColor: "#F5F5F5", borderRadius: 16, marginBottom: 24, overflow: "hidden", position: "relative" },
  tutorialDeleteIcon: { position: "absolute", right: 20, top: 0, bottom: 0, justifyContent: "center", zIndex: 1 },
  tutorialCard: { position: "absolute", left: 10, right: 10, top: 20, bottom: 20, zIndex: 2 },
  tutorialCardInner: { flex: 1, borderRadius: 12, padding: 16, justifyContent: "space-between" },
  tutorialCardChip: { width: 40, height: 30, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.3)" },
  tutorialCardNumber: { fontSize: 18, fontWeight: "600", color: "#fff", letterSpacing: 2, fontFamily: FONT_MONO },
  tutorialButton: { width: "100%", borderRadius: 16, overflow: "hidden" },
  tutorialButtonGradient: { paddingVertical: 16, alignItems: "center" },
  tutorialButtonText: { color: "#fff", fontSize: 16, fontFamily: FONT_TITLE, letterSpacing: 0.5, fontWeight: '700' },
});
