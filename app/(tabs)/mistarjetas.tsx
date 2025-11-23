// app/(tabs)/mistarjetas.tsx
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  useFonts,
} from "@expo-google-fonts/playfair-display";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from 'expo-linear-gradient';
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Modal,
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
  storageEvents,
  type Card
} from "../../utils/storage";

const { width, height } = Dimensions.get("window");

// ==================== PALETA DE COLORES PREMIUM ====================
const CARD_COLORS = [
  ['#0f172a', '#1e293b'],  // Slate
  ['#1e3a8a', '#3b82f6'],  // Blue
  ['#581c87', '#9333ea'],  // Purple
  ['#831843', '#db2777'],  // Pink
  ['#713f12', '#f59e0b'],  // Amber
  ['#14532d', '#22c55e'],  // Green
  ['#164e63', '#06b6d4'],  // Cyan
  ['#7c2d12', '#f97316'],  // Orange
  ['#4c1d95', '#a855f7'],  // Violet
  ['#881337', '#f43f5e'],  // Rose
];

// ==================== TOAST FLOTANTE ====================
interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onHide: () => void;
}

function Toast({ visible, message, type = 'info', onHide }: ToastProps) {
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
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const iconName = type === 'success' ? 'checkmark-circle' : type === 'error' ? 'close-circle' : 'information-circle';
  const backgroundColor = type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#111';

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { transform: [{ translateY }], opacity, backgroundColor }
      ]}
    >
      <View style={styles.toastContent}>
        <Ionicons name={iconName} size={22} color="#fff" />
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
}

// ==================== MODAL DE CONFIRMACIÓN ====================
interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({
  visible,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
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
        onPress={onCancel}
        style={styles.confirmModalBackdrop}
      >
        <TouchableOpacity activeOpacity={1}>
          <Animated.View
            style={[
              styles.confirmModalContainer,
              { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }
            ]}
          >
            <View style={styles.confirmIconCircle}>
              <Ionicons name="alert-circle-outline" size={42} color="#111" />
            </View>
            <Text style={styles.confirmTitle}>{title}</Text>
            <Text style={styles.confirmMessage}>{message}</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmButtonPrimary}
                onPress={onConfirm}
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
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ==================== COMPONENTE PRINCIPAL ====================
export default function MisTarjetas() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });

  const [tarjetas, setTarjetas] = useState<Card[]>([]);
  const [tarjetaActiva, setTarjetaActiva] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'info',
  });

  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    message: '',
    action: null as (() => void) | null,
  });

  // Estados del formulario
  const [numero, setNumero] = useState("");
  const [cvv, setCvv] = useState("");
  const [fecha, setFecha] = useState("");
  const [titular, setTitular] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [verificada, setVerificada] = useState(false);
  const [duenioNombre, setDuenioNombre] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const cardFlipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    cargarTarjetas();

    // Escuchar cambios en tarjetas
    const handleCardsChanged = () => {
      console.log('🔄 Evento cardsChanged recibido');
      cargarTarjetas();
    };

    storageEvents.on('cardsChanged', handleCardsChanged);

    return () => {
      storageEvents.off('cardsChanged', handleCardsChanged);
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(type === 'error' ? 100 : 50);
    }
    setToast({ visible: true, message, type });
  };

  // ✅ CARGAR TARJETAS CON STORAGE.TS
  const cargarTarjetas = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Cargando tarjetas desde storage...');
      
      const [cards, activeCardId] = await Promise.all([
        getCards(),
        getActiveCardId()
      ]);
      
      console.log('📦 Tarjetas cargadas:', cards.length);
      console.log('⭐ Tarjeta activa:', activeCardId);
      
      setTarjetas(cards);
      setTarjetaActiva(activeCardId);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error('❌ Error al cargar tarjetas:', error);
      showToast('Error al cargar las tarjetas', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const abrirModal = () => {
    setModalVisible(true);
    resetForm();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const cerrarModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      resetForm();
    });
  };

  const resetForm = () => {
    setNumero("");
    setCvv("");
    setFecha("");
    setTitular("");
    setVerificada(false);
    setDuenioNombre("");
    setVerificando(false);
    setGuardando(false);
  };

  // ✅ VALIDACIÓN COMPLETA ANTES DE VERIFICAR
  const validarCamposCompletos = (): boolean => {
    const cleanNumero = numero.replace(/\s/g, "");
    
    // Validar titular
    if (!titular.trim()) {
      showToast('Ingresa el nombre del titular', 'error');
      return false;
    }
    
    if (titular.trim().length < 3) {
      showToast('El nombre debe tener al menos 3 caracteres', 'error');
      return false;
    }

    // Validar número de tarjeta
    if (cleanNumero.length !== 16) {
      showToast('El número debe tener 16 dígitos', 'error');
      return false;
    }

    if (!/^\d{16}$/.test(cleanNumero)) {
      showToast('El número solo debe contener dígitos', 'error');
      return false;
    }

    // Validar fecha
    if (!fecha || fecha.length !== 5) {
      showToast('Ingresa la fecha de vencimiento (MM/AA)', 'error');
      return false;
    }

    const [mes, anio] = fecha.split('/');
    const mesNum = parseInt(mes);
    const anioNum = parseInt(anio);

    if (isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
      showToast('Mes inválido (01-12)', 'error');
      return false;
    }

    const fechaActual = new Date();
    const anioActual = fechaActual.getFullYear() % 100;
    const mesActual = fechaActual.getMonth() + 1;

    if (anioNum < anioActual || (anioNum === anioActual && mesNum < mesActual)) {
      showToast('La tarjeta está vencida', 'error');
      return false;
    }

    // Validar CVV
    if (!cvv || cvv.length !== 3 || !/^\d{3}$/.test(cvv)) {
      showToast('CVV inválido (3 dígitos)', 'error');
      return false;
    }

    return true;
  };

  // ✅ VERIFICAR TARJETA (SOLO SI VALIDACIÓN PASÓ)
  const verificarTarjeta = async () => {
    // Primero validar todos los campos
    if (!validarCamposCompletos()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const cleanNumero = numero.replace(/\s/g, "");

    // Verificar si la tarjeta ya existe
    const tarjetaExistente = tarjetas.find(t => t.numero === cleanNumero);
    if (tarjetaExistente) {
      showToast('Esta tarjeta ya está registrada', 'error');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setVerificando(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const queryBody = {
        structuredQuery: {
          from: [{ collectionId: "usuarios" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "tarjeta.numero" },
              op: "EQUAL",
              value: { stringValue: cleanNumero },
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
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast('Tarjeta no encontrada en el sistema', 'error');
        setVerificando(false);
        return;
      }

      const userDoc = data[0].document;
      const nombre =
        (userDoc.fields.nombre?.stringValue || "") +
        " " +
        (userDoc.fields.apellido?.stringValue || "");

      setDuenioNombre(nombre.trim());
      setVerificada(true);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Vibration.vibrate([0, 50, 30, 50]);
      }

      showToast(`✓ Datos validados correctamente`, 'success');
    } catch (err) {
      console.error('Error al verificar:', err);
      showToast('Error al verificar la tarjeta', 'error');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setVerificando(false);
    }
  };

  // ✅ GUARDAR TARJETA (SOLO SI ESTÁ VERIFICADA)
  const guardarTarjeta = async () => {
    if (guardando || !verificada) {
      if (!verificada) {
        showToast('Primero debes verificar la tarjeta', 'error');
      }
      return;
    }

    setGuardando(true);

    const nextColorIndex = tarjetas.length % CARD_COLORS.length;

    const newCard: Card = {
      id: `${Date.now()}`,
      numero: numero.replace(/\s/g, ""),
      cvv,
      fecha,
      titular: titular.toUpperCase().trim(),
      duenio: duenioNombre,
      fechaAgregada: new Date().toISOString(),
      colorIndex: nextColorIndex,
    };

    try {
      await addCard(newCard);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Vibration.vibrate([0, 40, 60, 40]);
      }

      cerrarModal();

      setTimeout(() => {
        showToast('Tarjeta guardada exitosamente', 'success');
        
        cardFlipAnim.setValue(0);
        Animated.spring(cardFlipAnim, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }).start();
      }, 400);
    } catch (error: any) {
      console.error('Error al guardar tarjeta:', error);
      showToast(error.message || 'Error al guardar la tarjeta', 'error');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = (id: string) => {
    setConfirmModal({
      visible: true,
      title: 'Eliminar tarjeta',
      message: '¿Estás seguro de eliminar esta tarjeta? Esta acción no se puede deshacer.',
      action: () => eliminarTarjeta(id),
    });
  };

  const eliminarTarjeta = async (id: string) => {
    try {
      await removeCard(id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Tarjeta eliminada', 'success');
    } catch (error) {
      console.error('Error al eliminar tarjeta:', error);
      showToast('Error al eliminar la tarjeta', 'error');
    }
  };

  const confirmarCambioActiva = (id: string) => {
    if (id === tarjetaActiva) return;

    setConfirmModal({
      visible: true,
      title: 'Cambiar tarjeta activa',
      message: '¿Deseas usar esta tarjeta como método principal de pago?',
      action: () => seleccionarActiva(id),
    });
  };

  const seleccionarActiva = async (id: string) => {
    try {
      await setActiveCard(id);
      setTarjetaActiva(id);
      
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Vibration.vibrate(30);
      }
      showToast('Tarjeta activa actualizada', 'success');

      cardFlipAnim.setValue(0);
      Animated.spring(cardFlipAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error al cambiar tarjeta activa:', error);
      showToast('Error al cambiar tarjeta activa', 'error');
    }
  };

  const formatNumeroEnmascarado = (numero: string) => {
    const ultimosCuatro = numero.slice(-4);
    return `•••• •••• •••• ${ultimosCuatro}`;
  };

  const formatNumero = (text: string) => {
    const clean = text.replace(/\D/g, "");
    const chunks = clean.match(/.{1,4}/g);
    setNumero(chunks ? chunks.join(" ") : clean);
  };

  const formatFecha = (text: string) => {
    const clean = text.replace(/\D/g, "");
    if (clean.length >= 2) {
      setFecha(clean.slice(0, 2) + "/" + clean.slice(2, 4));
    } else {
      setFecha(clean);
    }
  };

  const getCardGradient = (colorIndex: number) => {
    return CARD_COLORS[colorIndex % CARD_COLORS.length];
  };

  // ✅ VERIFICAR SI EL BOTÓN DEBE ESTAR HABILITADO
  const isPuedeVerificar = () => {
    const cleanNumero = numero.replace(/\s/g, "");
    return (
      titular.trim().length >= 3 &&
      cleanNumero.length === 16 &&
      fecha.length === 5 &&
      cvv.length === 3 &&
      !verificada &&
      !verificando
    );
  };

  if (!fontsLoaded || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Cargando tarjetas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      <ConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={() => {
          confirmModal.action?.();
          setConfirmModal({ ...confirmModal, visible: false });
        }}
        onCancel={() => setConfirmModal({ ...confirmModal, visible: false })}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/(tabs)/profile")}
          activeOpacity={0.7}
        >
          <View style={styles.backButtonContainer}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </View>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Mis Tarjetas</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {tarjetas.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="card-outline" size={80} color="#ddd" />
            </View>
            <Text style={styles.emptyTitle}>Sin tarjetas</Text>
            <Text style={styles.emptySubtitle}>
              Vincula una o más tarjetas para hacer pagos de forma segura
            </Text>
            <TouchableOpacity
              style={styles.addCardButton}
              onPress={abrirModal}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.addCardButtonText}>Agregar tarjeta</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              {tarjetas.length > 1 ? "Tus tarjetas vinculadas" : "Tu tarjeta vinculada"}
            </Text>
            <FlatList
              data={tarjetas}
              keyExtractor={t => t.id}
              renderItem={({ item }) => {
                const isActive = tarjetaActiva === item.id;
                const cardColors = getCardGradient(item.colorIndex);
                
                return (
                  <Animated.View
                    style={[
                      styles.cardAnimatedWrapper,
                      {
                        opacity: isActive ? cardFlipAnim : 1,
                        transform: [{
                          scale: isActive
                            ? cardFlipAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.97, 1],
                              })
                            : 1,
                        }]
                      }
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => !isActive && confirmarCambioActiva(item.id)}
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
                              <Text style={styles.statusTextActive}>ACTIVA</Text>
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
                            {formatNumeroEnmascarado(item.numero)}
                          </Text>
                        </View>

                        <View style={styles.creditCardBottom}>
                          <View style={styles.cardInfoSection}>
                            <Text style={styles.creditCardLabel}>TITULAR</Text>
                            <Text style={styles.creditCardName} numberOfLines={1}>
                              {item.titular}
                            </Text>
                          </View>
                          <View style={styles.cardInfoSection}>
                            <Text style={styles.creditCardLabel}>VENCE</Text>
                            <Text style={styles.creditCardExpiry}>
                              {item.fecha}
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            confirmarEliminar(item.id);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.deleteButtonInner}>
                            <Ionicons name="trash-outline" size={18} color="#fff" />
                          </View>
                        </TouchableOpacity>

                        <View style={styles.cardPattern}>
                          <View style={styles.cardPatternCircle1} />
                          <View style={styles.cardPatternCircle2} />
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>

                    {isActive && (
                      <View style={styles.activeCardBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.activeCardBadgeText}>Método de pago principal</Text>
                      </View>
                    )}
                  </Animated.View>
                );
              }}
              scrollEnabled={false}
            />
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={abrirModal}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* MODAL AGREGAR TARJETA */}
      <Modal visible={modalVisible} animationType="none" transparent>
        <Animated.View
          style={[
            styles.modalContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={cerrarModal} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={32} color="#666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Agregar tarjeta</Text>
              <View style={{ width: 32 }} />
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalSubtitle}>
                Completa todos los campos para verificar tu tarjeta
              </Text>

              <View style={styles.cardPreviewWrapper}>
                <LinearGradient
                  colors={getCardGradient(tarjetas.length)}
                  style={styles.cardPreview}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.chipDecorationPreview}>
                    <View style={styles.chipInner} />
                  </View>

                  <Text style={styles.previewNumber}>
                    {numero || "•••• •••• •••• ••••"}
                  </Text>
                  <View style={styles.previewBottom}>
                    <View>
                      <Text style={styles.previewLabel}>TITULAR</Text>
                      <Text style={styles.previewName}>
                        {titular.toUpperCase() || "NOMBRE APELLIDO"}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.previewLabel}>VENCE</Text>
                      <Text style={styles.previewExpiry}>
                        {fecha || "MM/AA"}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nombre del titular *</Text>
                <View style={[styles.inputWrapper, verificada && styles.inputWrapperDisabled]}>
                  <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="NOMBRE APELLIDO"
                    autoCapitalize="characters"
                    value={titular}
                    onChangeText={setTitular}
                    placeholderTextColor="#999"
                    editable={!verificada}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Número de tarjeta *</Text>
                <View style={[styles.inputWrapper, verificada && styles.inputWrapperDisabled]}>
                  <Ionicons name="card-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="0000 0000 0000 0000"
                    keyboardType="number-pad"
                    maxLength={19}
                    value={numero}
                    onChangeText={formatNumero}
                    placeholderTextColor="#999"
                    editable={!verificada}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.inputLabel}>Vencimiento *</Text>
                  <View style={[styles.inputWrapper, verificada && styles.inputWrapperDisabled]}>
                    <Ionicons name="calendar-outline" size={18} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="MM/AA"
                      maxLength={5}
                      value={fecha}
                      onChangeText={formatFecha}
                      keyboardType="number-pad"
                      placeholderTextColor="#999"
                      editable={!verificada}
                    />
                  </View>
                </View>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>CVV *</Text>
                  <View style={[styles.inputWrapper, verificada && styles.inputWrapperDisabled]}>
                    <Ionicons name="lock-closed-outline" size={18} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="123"
                      secureTextEntry
                      maxLength={3}
                      keyboardType="number-pad"
                      value={cvv}
                      onChangeText={t => setCvv(t.replace(/[^0-9]/g, ""))}
                      placeholderTextColor="#999"
                      editable={!verificada}
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  verificada && styles.verifyButtonSuccess,
                  (!isPuedeVerificar() || verificando) && styles.verifyButtonDisabled,
                ]}
                onPress={verificarTarjeta}
                disabled={!isPuedeVerificar() || verificando}
                activeOpacity={0.85}
              >
                {verificando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name={verificada ? "checkmark-circle" : "shield-checkmark-outline"}
                      size={22}
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.verifyButtonText}>
                      {verificada ? "Datos validados ✓" : "Verificar tarjeta"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {verificada && duenioNombre && (
                <View style={styles.ownerInfo}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" style={{ marginRight: 12 }} />
                  <View style={styles.ownerInfoTextContainer}>
                    <Text style={styles.ownerInfoLabel}>Propietario verificado</Text>
                    <Text style={styles.ownerInfoName}>{duenioNombre}</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!verificada || guardando) && styles.saveButtonDisabled,
                ]}
                onPress={guardarTarjeta}
                disabled={!verificada || guardando}
                activeOpacity={0.85}
              >
                {guardando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.saveButtonText}>Guardar tarjeta</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>
    </View>
  );
}

// ==================== ESTILOS ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 14,
    color: '#666',
    marginTop: 16,
  },

  // TOAST
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    elevation: 9999,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  toastText: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 14,
    color: '#fff',
    marginLeft: 12,
    flex: 1,
  },

  // MODAL DE CONFIRMACIÓN
  confirmModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  confirmIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  confirmTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    color: '#111',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  confirmMessage: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  confirmButtons: {
    gap: 12,
  },
  confirmButtonPrimary: {
    backgroundColor: '#111',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmButtonTextPrimary: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 16,
    color: '#fff',
    letterSpacing: 0.5,
  },
  confirmButtonSecondary: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmButtonTextSecondary: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 16,
    color: '#666',
    letterSpacing: 0.5,
  },

  // HEADER
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    width: 44,
  },
  backButtonContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 24,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 20,
    color: "#111",
    letterSpacing: 2,
  },

  // CONTENIDO
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 18,
    color: "#111",
    marginBottom: 20,
    letterSpacing: 0.5,
  },

  // TARJETA DE CRÉDITO
  cardAnimatedWrapper: {
    marginBottom: 24,
  },
  creditCardWrapper: {
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  creditCardWrapperActive: {
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 14,
  },
  creditCard: {
    width: "100%",
    height: 210,
    borderRadius: 20,
    padding: 24,
    justifyContent: "space-between",
    overflow: 'hidden',
  },
  
  // INDICADOR DE ESTADO
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusIndicatorActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  statusIndicatorInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  activePulse: {
    position: 'absolute',
    left: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    opacity: 0.3,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  statusTextActive: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 11,
    color: '#fff',
    letterSpacing: 1.2,
  },
  statusTextInactive: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.8,
    marginLeft: 6,
  },

  chipDecoration: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: 50,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipDecorationPreview: {
    position: 'absolute',
    top: 20,
    left: 24,
    width: 50,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipInner: {
    width: 35,
    height: 25,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },

  cardNumberContainer: {
    marginTop: 'auto',
    marginBottom: 20,
  },
  creditCardNumber: {
    fontFamily: "monospace",
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 2,
  },
  creditCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardInfoSection: {
    flex: 1,
  },
  creditCardLabel: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 6,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  creditCardName: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  creditCardExpiry: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  deleteButton: {
    position: "absolute",
    top: 20,
    right: 20,
  },
  deleteButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cardPattern: {
    position: 'absolute',
    right: -80,
    bottom: -80,
    width: 280,
    height: 280,
  },
  cardPatternCircle1: {
    position: 'absolute',
    right: 50,
    bottom: 50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  cardPatternCircle2: {
    position: 'absolute',
    right: 90,
    bottom: 90,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },

  activeCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  activeCardBadgeText: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 13,
    color: '#059669',
    marginLeft: 6,
    letterSpacing: 0.3,
  },

  // ESTADO VACÍO
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 30,
  },
  emptyIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  emptyTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 24,
    color: "#111",
    marginBottom: 12,
  },
  emptySubtitle: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#000",
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  addCardButtonText: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 15,
    color: "#fff",
    letterSpacing: 1,
  },

  // BOTÓN FLOTANTE
  fabButton: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },

  // MODAL
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 20,
    color: "#111",
    letterSpacing: 1,
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalSubtitle: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 15,
    color: "#666",
    marginBottom: 30,
    lineHeight: 22,
  },

  cardPreviewWrapper: {
    marginBottom: 30,
  },
  cardPreview: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    padding: 24,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  previewNumber: {
    fontFamily: "monospace",
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 2,
    marginTop: 20,
  },
  previewBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 'auto',
  },
  previewLabel: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  previewName: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  previewExpiry: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },

  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 14,
    color: "#111",
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#fafafa",
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputWrapperDisabled: {
    backgroundColor: "#f5f5f5",
    borderColor: "#e0e0e0",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: "PlayfairDisplay_400Regular",
    padding: 16,
    fontSize: 16,
    color: "#111",
  },
  inputRow: {
    flexDirection: "row",
  },

  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  verifyButtonSuccess: {
    backgroundColor: "#10B981",
  },
  verifyButtonDisabled: {
    backgroundColor: "#d1d5db",
    shadowOpacity: 0,
  },
  verifyButtonText: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    color: "#fff",
    fontSize: 15,
    letterSpacing: 1,
  },

  ownerInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#d1fae5',
  },
  ownerInfoTextContainer: {
    flex: 1,
  },
  ownerInfoLabel: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 12,
    color: "#059669",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  ownerInfoName: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 16,
    color: "#111",
  },

  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#111",
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: "#d1d5db",
    shadowOpacity: 0,
  },
  saveButtonText: {
    fontFamily: "PlayfairDisplay_700Bold",
    color: "#fff",
    fontSize: 16,
    letterSpacing: 1,
  },
});
