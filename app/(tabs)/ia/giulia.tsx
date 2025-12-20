// app/(tabs)/ia/giulia.tsx - ✅ VERSIÓN COMPLETA CON CORRECCIONES
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  useFonts,
} from "@expo-google-fonts/playfair-display";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ResizeMode, Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useApi } from "../../../contexts/ApiContext";

const { width, height } = Dimensions.get("window");

// ✅ Detección de tamaño de pantalla
const getScreenSize = () => {
  if (height < 700) return 'small';
  if (height < 850) return 'medium';
  return 'large';
};

const SCREEN_SIZE = getScreenSize();

// ✅ Configuración adaptativa según tamaño
const KEYBOARD_CONFIG = {
  small: {
    paddingBottom: 90,
    keyboardPadding: 80,
    tabBarOffset: 50,
  },
  medium: {
    paddingBottom: 90,
    keyboardPadding: 100,
    tabBarOffset: 60,
  },
  large: {
    paddingBottom: 150,
    keyboardPadding: 120,
    tabBarOffset: 70,
  },
};

const CONFIG = KEYBOARD_CONFIG[SCREEN_SIZE];

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  productos?: any[];
}

interface Conversation {
  id: string;
  nombre: string;
  fecha: Date;
  mensajes: Message[];
}

const FEATURES = [
  {
    id: "1",
    icon: "search",
    text: "Recomendaciones personalizadas para tu estilo único",
  },
  {
    id: "2",
    icon: "chatbubbles",
    text: "Conversación natural, fluida e intuitiva",
  },
  {
    id: "3",
    icon: "star",
    text: "Acceso exclusivo a nuestra colección de lujo",
  },
];

const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -8,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation1 = animate(dot1, 0);
    const animation2 = animate(dot2, 150);
    const animation3 = animate(dot3, 300);

    animation1.start();
    animation2.start();
    animation3.start();

    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
    };
  }, []);

  return (
    <View style={styles.typingContainer}>
      <View style={styles.aiAvatar}>
        <Ionicons name="sparkles" size={18} color="#fff" />
      </View>
      <View style={styles.typingBubble}>
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[styles.dot, { transform: [{ translateY: dot1 }] }]}
          />
          <Animated.View
            style={[styles.dot, { transform: [{ translateY: dot2 }] }]}
          />
          <Animated.View
            style={[styles.dot, { transform: [{ translateY: dot3 }] }]}
          />
        </View>
      </View>
    </View>
  );
};

const ProductCard = ({
  producto,
  onPress,
}: {
  producto: any;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={styles.productCard}
    onPress={onPress}
    activeOpacity={0.7}
  >
    {producto.url_imagen && (
      <Image
        source={{ uri: producto.url_imagen }}
        style={styles.productImage}
        resizeMode="cover"
      />
    )}
    <View style={styles.productInfo}>
      <Text style={styles.productBrand}>{producto.marca_nombre}</Text>
      <Text style={styles.productName} numberOfLines={2}>
        {producto.nombre}
      </Text>
      <View style={styles.productDetails}>
        <Text style={styles.productPrice}>${producto.precio}</Text>
        {producto.tipo_nombre && (
          <Text style={styles.productType}>{producto.tipo_nombre}</Text>
        )}
      </View>
    </View>
    <View style={styles.productArrow}>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </View>
  </TouchableOpacity>
);

const SwipeableConversationItem = ({
  conversation,
  isActive,
  onPress,
  onDelete,
  showTutorial = false,
}: {
  conversation: Conversation;
  isActive: boolean;
  onPress: () => void;
  onDelete: () => void;
  showTutorial?: boolean;
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isSwiped, setIsSwiped] = useState(false);

  useEffect(() => {
    if (showTutorial) {
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: -60,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(1000),
          Animated.spring(translateX, {
            toValue: 0,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      }, 300);
    }
  }, [showTutorial]);

  const panResponder = useRef(
    require("react-native").PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_: any, gestureState: any) => {
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderMove: (_: any, gestureState: any) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_: any, gestureState: any) => {
        if (gestureState.dx < -80) {
          Animated.spring(translateX, {
            toValue: -100,
            useNativeDriver: true,
            friction: 8,
          }).start();
          setIsSwiped(true);
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
  };

  const handlePress = () => {
    if (isSwiped) {
      closeSwipe();
    } else {
      onPress();
    }
  };

  const handleDelete = () => {
    Animated.timing(translateX, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDelete();
    });
  };

  return (
    <View style={styles.swipeableConversationContainer}>
      <TouchableOpacity
        style={styles.deleteBackground}
        onPress={handleDelete}
        activeOpacity={0.8}
      >
        <Ionicons name="trash" size={24} color="#fff" />
      </TouchableOpacity>
      <Animated.View
        style={[
          styles.conversationItemAnimated,
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[
            styles.conversationItem,
            isActive && styles.conversationItemActive,
          ]}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <View style={styles.conversationIcon}>
            <Ionicons name="chatbubbles" size={20} color="#666" />
          </View>
          <View style={styles.conversationInfo}>
            <Text style={styles.conversationName}>{conversation.nombre}</Text>
            <Text style={styles.conversationDate}>
              {conversation.fecha.toLocaleDateString("es-ES")} -{" "}
              {conversation.mensajes.length} mensajes
            </Text>
          </View>
          {isActive && (
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default function GiuliaScreen() {
  const router = useRouter();
  const apiUrl = useApi();
  const tabBarHeight = useBottomTabBarHeight();
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const videoRef = useRef<Video>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(40)).current;

  // ✅ CAMBIO: Usar translateY en lugar de bottom
  const inputTranslateY = useRef(new Animated.Value(0)).current;

  // ✅ NUEVO: Estado para mostrar/ocultar botón scroll to bottom
  const [showScrollButton, setShowScrollButton] = useState(false);

  const [activeSlide, setActiveSlide] = useState(0);
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveSlide(viewableItems[0].index || 0);
    }
  }).current;

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });

  const [isLogged, setIsLogged] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [productos, setProductos] = useState<any[]>([]);
  const [conversaciones, setConversaciones] = useState<Conversation[]>([]);
  const [conversacionActual, setConversacionActual] = useState<string | null>(
    null
  );
  const [modalHistorial, setModalHistorial] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  
// ✅ AJUSTE: Gestión del teclado SIN TAPAR NAVBAR
useEffect(() => {
  console.log('🔧 TabBarHeight detectado:', tabBarHeight);

  const keyboardDidShowListener = Keyboard.addListener(
    Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
    (e) => {
      const keyHeight = e.endCoordinates.height;
      console.log('⌨️ Teclado mostrado - Altura:', keyHeight);
      setKeyboardHeight(keyHeight);

      // ✅ NUEVO CÁLCULO: Solo elevar lo justo sin tapar navbar
      // Resta el tabBarHeight para mantener espacio para el navbar
      const targetValue = Platform.OS === 'android' 
        ? -(keyHeight - tabBarHeight - 308)  // -60 deja espacio para navbar en Android
        : -(keyHeight - tabBarHeight - 40); // -20 para iOS

      console.log('🎯 Target translateY:', targetValue);

      Animated.spring(inputTranslateY, {
        toValue: targetValue,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  );

  const keyboardDidHideListener = Keyboard.addListener(
    Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
    () => {
      console.log('⌨️ Teclado oculto');
      setKeyboardHeight(0);

      Animated.spring(inputTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();
    }
  );

  return () => {
    keyboardDidShowListener.remove();
    keyboardDidHideListener.remove();
  };
}, [tabBarHeight]);

  useEffect(() => {
    checkAuth();
    cargarProductos();
    cargarConversaciones();
  }, [apiUrl]);

  useEffect(() => {
    const cargarConversacionTemporal = async () => {
      try {
        const temporal = await AsyncStorage.getItem(
          "giulia_conversacion_temporal"
        );
        if (temporal) {
          const data = JSON.parse(temporal);
          setMessages(
            data.mensajes.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            }))
          );
          setConversacionActual(data.id);
          console.log("✅ Conversación cargada desde temporal");
        } else if (!conversacionActual) {
          crearNuevaConversacion();
        }
      } catch (error) {
        console.error("Error cargando conversación temporal:", error);
        crearNuevaConversacion();
      }
    };

    if (isLogged) {
      cargarConversacionTemporal();
    }
  }, [isLogged]);

  useEffect(() => {
    if (conversacionActual && messages.length > 0) {
      const timeoutId = setTimeout(() => {
        guardarConversacionActualTemporal();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [messages, conversacionActual]);

  useEffect(() => {
    if (!checkingAuth) {
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
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [checkingAuth]);

  // ✅ NUEVO: Detectar si el usuario está cerca del final
  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isNearBottom = 
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
    setShowScrollButton(!isNearBottom);
  };

  // ✅ NUEVO: Función para ir al final
  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const checkAuth = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      const access =
        (await AsyncStorage.getItem("access")) ||
        (await AsyncStorage.getItem("token"));

      if (storedUser && access) {
        setIsLogged(true);
      } else {
        setIsLogged(false);
      }
    } catch (error) {
      console.error("Error verificando autenticación:", error);
      setIsLogged(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  const cargarProductos = async () => {
    setLoadingProducts(true);
    try {
      if (!apiUrl) {
        console.warn("⚠️ API URL no disponible");
        return;
      }

      console.log("📡 Conectando a:", `${apiUrl}/api/productos/`);
      const res = await fetch(`${apiUrl}/api/productos/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("✅ Productos cargados desde API:", data.length);

      await AsyncStorage.setItem("giulia_productos_cache", JSON.stringify(data));
      setProductos(data);
    } catch (error) {
      console.error("❌ Error cargando productos desde API:", error);

      try {
        const cache = await AsyncStorage.getItem("giulia_productos_cache");
        if (cache) {
          const cachedData = JSON.parse(cache);
          setProductos(cachedData);
          console.log("✅ Productos cargados desde caché:", cachedData.length);
        }
      } catch (cacheError) {
        console.error("❌ Error cargando caché:", cacheError);
      }
    } finally {
      setLoadingProducts(false);
    }
  };

  const cargarConversaciones = async () => {
    try {
      const saved = await AsyncStorage.getItem("giulia_conversaciones");
      if (saved) {
        const parsed = JSON.parse(saved);
        const conversacionesValidas = parsed
          .filter((c: any) => c && c.id && c.mensajes && c.mensajes.length >= 1)
          .map((c: any) => ({
            ...c,
            fecha: new Date(c.fecha),
            mensajes: c.mensajes.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            })),
          }));
        setConversaciones(conversacionesValidas);
        console.log("✅ Conversaciones cargadas:", conversacionesValidas.length);
      }
    } catch (error) {
      console.error("Error cargando conversaciones:", error);
      await AsyncStorage.removeItem("giulia_conversaciones");
    }
  };

  const guardarConversaciones = async (convs: Conversation[]) => {
    try {
      const convsValidas = convs.filter(
        (conv) => conv && conv.id && conv.mensajes && conv.mensajes.length >= 2
      );
      await AsyncStorage.setItem(
        "giulia_conversaciones",
        JSON.stringify(convsValidas)
      );
      console.log("✅ Conversaciones guardadas:", convsValidas.length);
    } catch (error) {
      console.error("Error guardando conversaciones:", error);
    }
  };

  const guardarConversacionActualTemporal = async () => {
    try {
      if (conversacionActual && messages.length > 0) {
        const conversacionData = {
          id: conversacionActual,
          mensajes: messages,
        };
        await AsyncStorage.setItem(
          "giulia_conversacion_temporal",
          JSON.stringify(conversacionData)
        );
      }
    } catch (error) {
      console.error("Error guardando conversación temporal:", error);
    }
  };

  const crearNuevaConversacion = () => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: `Bienvenido a Maison Des Senteurs ✨\n\nSoy Giulia, su asesora personal de fragancias de lujo. Tengo acceso a nuestro exclusivo catálogo de ${productos.length} fragancias premium de las mejores casas del mundo.\n\n¿Qué tipo de experiencia olfativa está buscando hoy?`,
      isUser: false,
      timestamp: new Date(),
    };

    const nuevaConv: Conversation = {
      id: Date.now().toString(),
      nombre: "Nueva conversación",
      fecha: new Date(),
      mensajes: [welcomeMessage],
    };

    const nuevasConvs = [nuevaConv, ...conversaciones];
    setConversaciones(nuevasConvs);
    setConversacionActual(nuevaConv.id);
    setMessages([welcomeMessage]);
    guardarConversaciones(nuevasConvs);
  };

  const eliminarConversacion = async (convId: string) => {
    try {
      console.log("🗑️ Eliminando conversación:", convId);

      const nuevasConvs = conversaciones.filter((c) => c.id !== convId);
      setConversaciones(nuevasConvs);

      await guardarConversaciones(nuevasConvs);

      if (convId === conversacionActual) {
        await AsyncStorage.removeItem("giulia_conversacion_temporal");

        if (nuevasConvs.length > 0) {
          const primeraConv = nuevasConvs[0];
          setMessages(primeraConv.mensajes);
          setConversacionActual(primeraConv.id);

          await AsyncStorage.setItem(
            "giulia_conversacion_temporal",
            JSON.stringify({
              id: primeraConv.id,
              mensajes: primeraConv.mensajes,
            })
          );
        } else {
          setMessages([]);
          setConversacionActual(null);
          setTimeout(() => {
            crearNuevaConversacion();
          }, 100);
        }
      }

      console.log("✅ Conversación eliminada exitosamente");
    } catch (error) {
      console.error("❌ Error eliminando conversación:", error);
    }
  };

  const cargarMensajesConversacion = (convId: string) => {
    const conv = conversaciones.find((c) => c.id === convId);
    if (conv) {
      setMessages(conv.mensajes);
      setConversacionActual(convId);
    }
  };

  const actualizarConversacionActual = (nuevosMensajes: Message[]) => {
    if (!conversacionActual) return;

    const nuevasConvs = conversaciones.map((c) => {
      if (c.id === conversacionActual) {
        let nuevoNombre = c.nombre;
        if (c.nombre === "Nueva conversación") {
          const primerMensajeUsuario = nuevosMensajes.find((m) => m.isUser);
          if (primerMensajeUsuario) {
            const palabras = primerMensajeUsuario.text
              .trim()
              .split(/\s+/)
              .slice(0, 4);
            nuevoNombre = palabras.join(" ") + "...";
          }
        }
        return {
          ...c,
          nombre: nuevoNombre,
          mensajes: nuevosMensajes,
          fecha: new Date(),
        };
      }
      return c;
    });

    setConversaciones(nuevasConvs);
    guardarConversaciones(nuevasConvs);
  };

  const extraerProductosRecomendados = (
    respuesta: string,
    productosDisponibles: any[]
  ): any[] => {
    const productosEncontrados: any[] = [];
    const productosConStock: any[] = [];

    productosDisponibles.forEach((producto) => {
      const nombreCompleto = `${producto.nombre} ${producto.marca_nombre}`.toLowerCase();
      const respuestaLower = respuesta.toLowerCase();

      if (
        respuestaLower.includes(producto.nombre.toLowerCase()) ||
        respuestaLower.includes(nombreCompleto)
      ) {
        if (producto.stock > 0) {
          productosConStock.push(producto);
        } else {
          productosEncontrados.push(producto);
        }
      }
    });

    return [...productosConStock, ...productosEncontrados].slice(0, 3);
  };

  const navegarAProducto = (producto: any) => {
    router.push(`/marcas/${producto.marca_nombre}`);
  };

  const enviarMensaje = async () => {
    if (!inputText.trim() || isLoading) return;

    if (productos.length === 0) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "Disculpe, estoy teniendo problemas para acceder al catálogo en este momento. Por favor, intente nuevamente en unos instantes.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages([...messages, errorMessage]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    const consultaUsuario = inputText.trim();
    setInputText("");
    setIsLoading(true);

    // ✅ Auto-scroll después de enviar mensaje
    setTimeout(() => {
      scrollToBottom();
    }, 100);

    try {
      const consultaLower = consultaUsuario.toLowerCase();
      const esMasculino =
        /\b(hombre|masculino|caballero|él|para él|him|men)\b/i.test(consultaLower);
      const esFemenino =
        /\b(mujer|femenino|dama|ella|para ella|her|women)\b/i.test(consultaLower);

      let productosRelevantes = productos.filter((p) => p.stock > 0);

      if (esMasculino && !esFemenino) {
        productosRelevantes = productosRelevantes.filter(
          (p) => p.genero === "Masculino" || p.genero === "Unisex"
        );
      } else if (esFemenino && !esMasculino) {
        productosRelevantes = productosRelevantes.filter(
          (p) => p.genero === "Femenino" || p.genero === "Unisex"
        );
      }

      productosRelevantes = productosRelevantes
        .sort((a, b) => b.stock - a.stock)
        .slice(0, 15);

      const inventarioTexto = productosRelevantes
        .map(
          (p) =>
            `${p.nombre} de ${p.marca_nombre} (${p.tipo_nombre}): $${p.precio}. Stock: ${p.stock}. ${p.descripcion || ""
            }`
        )
        .join("\n");

      const prompt = `Eres Giulia, experta consultora de fragancias de lujo de Maison Des Senteurs.

INVENTARIO DISPONIBLE (${productosRelevantes.length} fragancias con stock):
${inventarioTexto}

CONSULTA DEL CLIENTE: ${consultaUsuario}

INSTRUCCIONES IMPORTANTES:
- Recomienda ÚNICAMENTE fragancias del inventario proporcionado arriba
- NO uses asteriscos, negritas ni formato markdown
- Escribe en texto plano y elegante con un tono profesional
- Máximo 3 recomendaciones específicas
- Menciona el nombre EXACTO del perfume y la marca tal como aparece en el inventario
- Explica brevemente por qué cada fragancia es adecuada para lo que busca el cliente
- Si mencionas precio o stock, usa la información exacta del inventario
- Usa emojis sutiles solo para dar elegancia (✨🌸💎)
- Si el cliente pregunta por algo no disponible, ofrece alternativas similares del inventario`;

      console.log("📤 Enviando consulta a Perplexity AI...");

      const response = await fetch(
        "https://api.perplexity.ai/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer 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",
          },
          body: JSON.stringify({
            model: "sonar",
            messages: [
              {
                role: "system",
                content:
                  "Eres Giulia, asesora de fragancias de lujo de Maison Des Senteurs. Respondes en texto plano sin asteriscos ni formato markdown. Escribe de forma elegante, profesional y personalizada. Tu objetivo es ayudar a los clientes a encontrar la fragancia perfecta del inventario disponible.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            max_tokens: 600,
            temperature: 0.7,
          }),
        }
      );

      console.log("📥 Respuesta recibida. Status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error API:", errorText);
        throw new Error(
          `Error ${response.status}: No se pudo conectar con el servicio de IA`
        );
      }

      const data = await response.json();
      let aiResponse =
        data.choices[0]?.message?.content ||
        "Disculpe, no pude procesar su solicitud en este momento.";

      aiResponse = aiResponse
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/#{1,6}\s/g, "")
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");

      const productosRecomendados = extraerProductosRecomendados(
        aiResponse,
        productosRelevantes
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
        productos: productosRecomendados,
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      actualizarConversacionActual(finalMessages);

      console.log("✅ Respuesta procesada exitosamente");
      console.log("🎁 Productos recomendados:", productosRecomendados.length);

      // ✅ Auto-scroll después de recibir respuesta
      setTimeout(() => {
        scrollToBottom();
      }, 300);
    } catch (error: any) {
      console.error("❌ Error completo:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Disculpe, hubo un problema técnico al procesar su consulta. Por favor, verifique su conexión a internet e intente nuevamente.",
        isUser: false,
        timestamp: new Date(),
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      actualizarConversacionActual(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const detenerIA = () => {
    setIsLoading(false);
  };

  const renderCarouselItem = ({ item }: { item: any }) => (
    <View style={styles.carouselItem}>
      <View style={styles.carouselIconContainer}>
        <Ionicons name={item.icon as any} size={40} color="#fff" />
      </View>
      <Text style={styles.carouselText}>{item.text}</Text>
    </View>
  );

  if (!fontsLoaded || checkingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Iniciando Giulia AI...</Text>
      </View>
    );
  }

  if (!isLogged) {
    return (
      <Animated.View
        style={[
          styles.notLoggedContainer,
          { opacity: fadeAnim, transform: [{ translateY: translateAnim }] },
        ]}
      >
        <Video
          ref={videoRef}
          source={require("../../../assets/images/giulia.mp4")}
          style={styles.videoBackground}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted
          useNativeControls={false}
        />

        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.8)"]}
          style={styles.videoOverlay}
        />

        <View style={styles.notLoggedContent}>
          <View style={styles.aiIconContainer}>
            <Ionicons name="sparkles" size={60} color="#fff" />
          </View>

          <Text style={styles.notLoggedTitle}>Conoce a Giulia AI</Text>
          <Text style={styles.notLoggedSubtitle}>
            Tu asesora personal de fragancias de lujo
          </Text>

          <View style={styles.carouselContainer}>
            <FlatList
              data={FEATURES}
              renderItem={renderCarouselItem}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
              scrollEventThrottle={16}
            />
            <View style={styles.paginationContainer}>
              {FEATURES.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    activeSlide === index
                      ? styles.paginationDotActive
                      : styles.paginationDotInactive,
                  ]}
                />
              ))}
            </View>
          </View>

          <Text style={styles.loginPrompt}>
            Por favor inicia sesión para acceder a la experiencia completa
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Giulia</Text>
          <Text style={styles.headerSubtitle}>
            Asesora de fragancias de lujo
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={cargarProductos}
            style={styles.refreshButton}
            activeOpacity={0.7}
            disabled={loadingProducts}
          >
            {loadingProducts ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Ionicons name="refresh" size={22} color="#000" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={crearNuevaConversacion}
            style={styles.newChatButton}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setModalHistorial(true)}
            style={styles.historyButton}
            activeOpacity={0.7}
          >
            <Ionicons name="time-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

<ScrollView
  ref={scrollViewRef}
  style={styles.messagesContainer}
  contentContainerStyle={{
    padding: 16,
    // ✅ REDUCIR el padding cuando el teclado está abierto
    paddingBottom: keyboardHeight > 0
      ? 200  // Solo 80px de espacio con teclado (ajústalo a tu gusto)
      : tabBarHeight + CONFIG.paddingBottom
  }}
  showsVerticalScrollIndicator={false}
  keyboardShouldPersistTaps="handled"
  keyboardDismissMode="interactive"
  onScroll={handleScroll}
  scrollEventThrottle={400}
>

        {messages.map((item) => (
          <View
            key={item.id}
            style={[
              styles.messageContainer,
              item.isUser
                ? styles.userMessageContainer
                : styles.aiMessageContainer,
            ]}
          >
            {!item.isUser && (
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={18} color="#fff" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <View
                style={[
                  styles.messageBubble,
                  item.isUser ? styles.userBubble : styles.aiBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    item.isUser
                      ? styles.userMessageText
                      : styles.aiMessageText,
                  ]}
                >
                  {item.text}
                </Text>
              </View>

              {!item.isUser &&
                item.productos &&
                item.productos.length > 0 && (
                  <View style={styles.productosContainer}>
                    {item.productos.map((producto, index) => (
                      <ProductCard
                        key={`${item.id}-${index}`}
                        producto={producto}
                        onPress={() => navegarAProducto(producto)}
                      />
                    ))}
                  </View>
                )}
            </View>
          </View>
        ))}

        {isLoading && <TypingIndicator />}
      </ScrollView>

      {/* ✅ NUEVO: Botón flotante para ir al final */}
      {showScrollButton && messages.length > 3 && (
        <TouchableOpacity
          style={styles.scrollToBottomButton}
          onPress={scrollToBottom}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-down" size={20} color="#fff" />
        </TouchableOpacity>
      )}

      {/* ✅ CAMBIO: Input con transform en lugar de bottom */}
      <Animated.View
        style={[
          styles.inputContainer,
          {
            transform: [{ translateY: inputTranslateY }],
            bottom: tabBarHeight,
            left: 0,
            right: 0,
            width: width,
          }
        ]}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="¿Qué fragancia buscas hoy?..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          {isLoading ? (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={detenerIA}
              activeOpacity={0.7}
            >
              <Ionicons name="stop" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={enviarMensaje}
              disabled={!inputText.trim()}
              activeOpacity={0.7}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      <Modal
        visible={modalHistorial}
        animationType="slide"
        transparent
        onRequestClose={() => setModalHistorial(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Historial</Text>
              <TouchableOpacity
                onPress={() => setModalHistorial(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.conversationsList}
              showsVerticalScrollIndicator={false}
            >
              {conversaciones.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Ionicons
                    name="chatbubbles-outline"
                    size={60}
                    color="#ddd"
                  />
                  <Text style={styles.emptyHistoryText}>
                    No hay conversaciones guardadas
                  </Text>
                  <Text style={styles.emptyHistorySubtext}>
                    Tus consultas con Giulia aparecerán aquí
                  </Text>
                </View>
              ) : (
                conversaciones.map((conv, index) => (
                  <SwipeableConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conversacionActual === conv.id}
                    onPress={() => {
                      cargarMensajesConversacion(conv.id);
                      setModalHistorial(false);
                    }}
                    onDelete={() => eliminarConversacion(conv.id)}
                    showTutorial={index === 0 && conversaciones.length === 1}
                  />
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: "PlayfairDisplay_400Regular",
    color: "#666",
  },
  notLoggedContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  videoBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: height,
  },
  videoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  notLoggedContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
    paddingTop: 80,
  },
  aiIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  notLoggedTitle: {
    fontSize: 32,
    fontFamily: "PlayfairDisplay_700Bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  notLoggedSubtitle: {
    fontSize: 16,
    fontFamily: "PlayfairDisplay_400Regular",
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginBottom: 40,
    letterSpacing: 0.5,
  },
  carouselContainer: {
    height: 160,
    width: "100%",
    marginBottom: 20,
  },
  carouselItem: {
    width: width,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  carouselIconContainer: {
    marginBottom: 15,
  },
  carouselText: {
    fontSize: 18,
    fontFamily: "PlayfairDisplay_400Regular",
    color: "#fff",
    textAlign: "center",
    lineHeight: 26,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#fff",
    width: 10,
    height: 10,
  },
  paginationDotInactive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  loginPrompt: {
    fontSize: 12,
    fontFamily: "PlayfairDisplay_400Regular",
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 70 : 40,
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "PlayfairDisplay_700Bold",
    color: "#000",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: "PlayfairDisplay_400Regular",
    color: "#666",
    marginTop: 2,
    letterSpacing: 0.3,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 6,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  newChatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  historyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  messagesContainer: {
    flex: 1,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  aiMessageContainer: {
    justifyContent: "flex-start",
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  messageBubble: {
    maxWidth: "85%",
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: "#000",
    borderBottomRightRadius: 4,
    alignSelf: "flex-end",
  },
  aiBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: "PlayfairDisplay_400Regular",
  },
  userMessageText: {
    color: "#fff",
  },
  aiMessageText: {
    color: "#1a1a1a",
  },
  productosContainer: {
    marginTop: 16,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 10,
    alignItems: "center",
  },
  productImage: {
    width: 90,
    height: 90,
    backgroundColor: "#f5f5f5",
  },
  productInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  productBrand: {
    fontSize: 11,
    fontFamily: "PlayfairDisplay_600SemiBold",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 14,
    fontFamily: "PlayfairDisplay_600SemiBold",
    color: "#000",
    marginTop: 2,
    marginBottom: 6,
  },
  productDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  productPrice: {
    fontSize: 16,
    fontFamily: "PlayfairDisplay_700Bold",
    color: "#000",
  },
  productType: {
    fontSize: 10,
    fontFamily: "PlayfairDisplay_400Regular",
    color: "#999",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  productArrow: {
    paddingRight: 12,
  },
  // ✅ CAMBIO: Input ahora con position absolute
  inputContainer: {
    position: "absolute",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 12 : 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#FAFAFA",
    borderRadius: 28,
    paddingLeft: 18,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "PlayfairDisplay_400Regular",
    color: "#000",
    maxHeight: 100,
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  stopButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  // ✅ NUEVO: Botón flotante scroll to bottom
  scrollToBottomButton: {
  position: "absolute",
  right: width / 2 - 16,  // ✅ Centrado
  bottom: 150,
  width: 32,              // ✅ Muy pequeño
  height: 32,
  borderRadius: 16,
  backgroundColor: "#000",
  justifyContent: "center",
  alignItems: "center",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 4,
  zIndex: 999,
},

  typingContainer: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "flex-start",
  },
  typingBubble: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#666",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: "PlayfairDisplay_700Bold",
    color: "#000",
  },
  conversationsList: {
    maxHeight: height * 0.6,
  },
  emptyHistory: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyHistoryText: {
    fontSize: 16,
    fontFamily: "PlayfairDisplay_600SemiBold",
    color: "#999",
    marginTop: 16,
  },
  emptyHistorySubtext: {
    fontSize: 13,
    fontFamily: "PlayfairDisplay_400Regular",
    color: "#ccc",
    marginTop: 8,
  },
  swipeableConversationContainer: {
    marginBottom: 12,
    position: "relative",
  },
  deleteBackground: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  conversationItemAnimated: {
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  conversationItemActive: {
    backgroundColor: "#f0fdf4",
    borderColor: "#10B981",
  },
  conversationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationName: {
    fontSize: 16,
    fontFamily: "PlayfairDisplay_600SemiBold",
    color: "#000",
    marginBottom: 4,
  },
  conversationDate: {
    fontSize: 12,
    fontFamily: "PlayfairDisplay_400Regular",
    color: "#666",
  },
});
