// app/(tabs)/ia/giulia.tsx
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  useFonts,
} from "@expo-google-fonts/playfair-display";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
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

const ProductCard = ({ producto }: { producto: any }) => (
  <View style={styles.productCard}>
    {producto.url_imagen && (
      <Image 
        source={{ uri: producto.url_imagen }} 
        style={styles.productImage}
        resizeMode="cover"
      />
    )}
    <View style={styles.productInfo}>
      <Text style={styles.productBrand}>{producto.marca_nombre}</Text>
      <Text style={styles.productName} numberOfLines={2}>{producto.nombre}</Text>
      <Text style={styles.productPrice}>${producto.precio}</Text>
      {producto.stock > 0 && (
        <View style={styles.stockBadge}>
          <Text style={styles.stockText}>Disponible</Text>
        </View>
      )}
    </View>
  </View>
);

export default function GiuliaScreen() {
  const router = useRouter();
  const apiUrl = useApi();
  const scrollViewRef = useRef<ScrollView>(null);
  const videoRef = useRef<Video>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(40)).current;

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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [conversaciones, setConversaciones] = useState<Conversation[]>([]);
  const [conversacionActual, setConversacionActual] = useState<string | null>(null);
  const [modalHistorial, setModalHistorial] = useState(false);

  useEffect(() => {
    checkAuth();
    cargarProductos();
    cargarConversaciones();
  }, [apiUrl]);

  useEffect(() => {
    if (isLogged) {
      if (!conversacionActual) {
        crearNuevaConversacion();
      } else {
        cargarMensajesConversacion(conversacionActual);
      }
      
      const keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        (e) => {
          setKeyboardHeight(e.endCoordinates.height);
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      );

      const keyboardDidHideListener = Keyboard.addListener(
        'keyboardDidHide',
        () => {
          setKeyboardHeight(0);
        }
      );

      return () => {
        keyboardDidShowListener.remove();
        keyboardDidHideListener.remove();
      };
    }
  }, [isLogged, conversacionActual]);

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
          useNativeDriver: true 
        }),
      ]).start();
    }
  }, [checkingAuth]);

  const checkAuth = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      const access = (await AsyncStorage.getItem("access")) || (await AsyncStorage.getItem("token"));
      
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
    try {
      if (!apiUrl) return;
      const res = await fetch(`${apiUrl}/api/productos/`);
      const data = await res.json();
      setProductos(data);
      console.log("✅ Productos cargados:", data.length);
    } catch (error) {
      console.error("❌ Error cargando productos:", error);
    }
  };

  const cargarConversaciones = async () => {
    try {
      const saved = await AsyncStorage.getItem("giulia_conversaciones");
      if (saved) {
        const parsed = JSON.parse(saved);
        setConversaciones(parsed.map((c: any) => ({
          ...c,
          fecha: new Date(c.fecha),
          mensajes: c.mensajes.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        })));
      }
    } catch (error) {
      console.error("Error cargando conversaciones:", error);
    }
  };

  const guardarConversaciones = async (convs: Conversation[]) => {
    try {
      await AsyncStorage.setItem("giulia_conversaciones", JSON.stringify(convs));
    } catch (error) {
      console.error("Error guardando conversaciones:", error);
    }
  };

  const crearNuevaConversacion = () => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: "Bienvenido a Maison Des Senteurs ✨\n\nSoy Giulia, su asistente personal de fragancias de lujo. Estoy aquí para ayudarle a descubrir el perfume perfecto que complemente su estilo y personalidad.\n\n¿Qué tipo de fragancia está buscando hoy?",
      isUser: false,
      timestamp: new Date(),
    };

    const nuevaConv: Conversation = {
      id: Date.now().toString(),
      nombre: "Nueva conversación",
      fecha: new Date(),
      mensajes: [welcomeMessage]
    };

    const nuevasConvs = [nuevaConv, ...conversaciones];
    setConversaciones(nuevasConvs);
    setConversacionActual(nuevaConv.id);
    setMessages([welcomeMessage]);
    guardarConversaciones(nuevasConvs);
  };

  const cargarMensajesConversacion = (convId: string) => {
    const conv = conversaciones.find(c => c.id === convId);
    if (conv) {
      setMessages(conv.mensajes);
      setConversacionActual(convId);
    }
  };

  const actualizarConversacionActual = (nuevosMensajes: Message[]) => {
    if (!conversacionActual) return;

    const nuevasConvs = conversaciones.map(c => {
      if (c.id === conversacionActual) {
        let nuevoNombre = c.nombre;
        if (c.nombre === "Nueva conversación") {
          const primerMensajeUsuario = nuevosMensajes.find(m => m.isUser);
          if (primerMensajeUsuario) {
            const palabras = primerMensajeUsuario.text.trim().split(/\s+/).slice(0, 4);
            nuevoNombre = palabras.join(' ') + '...';
          }
        }
        return { ...c, nombre: nuevoNombre, mensajes: nuevosMensajes, fecha: new Date() };
      }
      return c;
    });

    setConversaciones(nuevasConvs);
    guardarConversaciones(nuevasConvs);
  };

  const extraerProductosRecomendados = (respuesta: string, productosDisponibles: any[]): any[] => {
    const productosEncontrados: any[] = [];
    
    productosDisponibles.forEach(producto => {
      if (respuesta.toLowerCase().includes(producto.nombre.toLowerCase())) {
        productosEncontrados.push(producto);
      }
    });
    
    return productosEncontrados.slice(0, 3);
  };

// app/(tabs)/ia/giulia.tsx
// ... (mantén todo el código anterior hasta la función enviarMensaje)

const enviarMensaje = async () => {
  if (!inputText.trim() || isLoading) return;

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

  setTimeout(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, 100);

  try {
    const consultaLower = consultaUsuario.toLowerCase();
    const esMasculino = /hombre|masculino|caballero|él|para él/i.test(consultaLower);
    const esFemenino = /mujer|femenino|dama|ella|para ella/i.test(consultaLower);
    
    let productosRelevantes = productos.filter(p => p.stock > 0);
    
    if (esMasculino) {
      productosRelevantes = productosRelevantes.filter(p => 
        p.genero === "Masculino" || p.genero === "Unisex"
      );
    } else if (esFemenino) {
      productosRelevantes = productosRelevantes.filter(p => 
        p.genero === "Femenino" || p.genero === "Unisex"
      );
    }
    
    productosRelevantes = productosRelevantes.slice(0, 20);

    const inventarioTexto = productosRelevantes
      .map((p) => `${p.nombre} de ${p.marca_nombre}: $${p.precio}. ${p.descripcion || ''}`)
      .join("\n");

    const prompt = `Eres Giulia, experta en fragancias de Maison Des Senteurs. Recomienda perfumes SOLO del siguiente inventario:

${inventarioTexto}

Consulta del cliente: ${consultaUsuario}

IMPORTANTE: 
- NO uses asteriscos, negritas ni formato markdown
- Escribe en texto plano y elegante
- Máximo 3 recomendaciones
- Menciona el nombre exacto del perfume y la marca
- Explica brevemente por qué es adecuado
- Usa emojis sutiles solo para dar elegancia (✨🌸💎)`;

    console.log("📤 Enviando a Perplexity...");

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer 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", // ✅ TU API KEY
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: "Eres Giulia, asesora de fragancias de lujo. Respondes en texto plano sin asteriscos ni formato markdown. Escribe de forma elegante y profesional.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    console.log("📥 Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error API:", errorText);
      throw new Error(`Error ${response.status}: No se pudo conectar con el servicio de IA`);
    }

    const data = await response.json();
    let aiResponse = data.choices[0]?.message?.content || "Disculpe, no pude procesar su solicitud.";
    
    aiResponse = aiResponse
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

    const productosRecomendados = extraerProductosRecomendados(aiResponse, productosRelevantes);

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

    console.log("✅ Respuesta exitosa");
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 200);
  } catch (error: any) {
    console.error("❌ Error:", error);
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: "Disculpe, hubo un problema técnico. Por favor verifique su conexión o intente más tarde.",
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

  if (!fontsLoaded || checkingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!isLogged) {
    return (
      <Animated.View
        style={[styles.notLoggedContainer, { opacity: fadeAnim, transform: [{ translateY: translateAnim }] }]}
      >
        <Video
          ref={videoRef}
          source={require('../../../assets/images/giulia.mp4')}
          style={styles.videoBackground}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted
          useNativeControls={false}
        />
        
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
          style={styles.videoOverlay}
        />

        <View style={styles.notLoggedContent}>
          <View style={styles.aiIconContainer}>
            <Ionicons name="sparkles" size={60} color="#fff" />
          </View>
          
          <Text style={styles.notLoggedTitle}>Conoce a Giulia AI</Text>
          <Text style={styles.notLoggedSubtitle}>
            Tu asistente personal de fragancias impulsada por inteligencia artificial
          </Text>
          
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="search" size={24} color="#fff" />
              <Text style={styles.featureText}>Recomendaciones personalizadas</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="chatbubbles" size={24} color="#fff" />
              <Text style={styles.featureText}>Conversación natural e intuitiva</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="star" size={24} color="#fff" />
              <Text style={styles.featureText}>Acceso exclusivo a nuestra colección</Text>
            </View>
          </View>

          <Text style={styles.loginPrompt}>
            Inicia sesión para experimentar el futuro de la perfumería de lujo
          </Text>

          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => router.replace("/(auth)/login")}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#fff', '#f5f5f5']}
              style={styles.loginButtonGradient}
            >
              <Ionicons name="log-in-outline" size={22} color="#000" style={{ marginRight: 10 }} />
              <Text style={styles.loginButtonText}>INICIAR SESIÓN</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.registerButton} 
            onPress={() => router.push("/(auth)/register")}
            activeOpacity={0.85}
          >
            <Ionicons name="person-add-outline" size={20} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.registerButtonText}>CREAR CUENTA</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ✅ HEADER CON BOTÓN HISTORIAL */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Giulia</Text>
          <Text style={styles.headerSubtitle}>Asesora de fragancias de lujo</Text>
        </View>
        <TouchableOpacity onPress={() => setModalHistorial(true)} style={styles.historyButton}>
          <Ionicons name="time-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={[styles.messagesList, { paddingBottom: keyboardHeight > 0 ? 20 : 100 }]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((item) => (
            <View
              key={item.id}
              style={[
                styles.messageContainer,
                item.isUser ? styles.userMessageContainer : styles.aiMessageContainer,
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
                      item.isUser ? styles.userMessageText : styles.aiMessageText,
                    ]}
                  >
                    {item.text}
                  </Text>
                  <Text
                    style={[
                      styles.timestamp,
                      item.isUser ? styles.userTimestamp : styles.aiTimestamp,
                    ]}
                  >
                    {item.timestamp.toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                
                {!item.isUser && item.productos && item.productos.length > 0 && (
                  <View style={styles.productosContainer}>
                    {item.productos.map((producto, index) => (
                      <ProductCard key={`${item.id}-${index}`} producto={producto} />
                    ))}
                  </View>
                )}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.inputContainer, Platform.OS === 'android' && keyboardHeight > 0 && { marginBottom: keyboardHeight }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="¿Qué buscas… o debería intuirlo?..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={(text) => {
                setInputText(text);
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 50);
              }}
              multiline
              maxLength={500}
              editable={!isLoading}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 300);
              }}
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
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                onPress={enviarMensaje}
                disabled={!inputText.trim()}
                activeOpacity={0.7}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ✅ MODAL HISTORIAL SIN BOTÓN ELIMINAR */}
      <Modal visible={modalHistorial} animationType="slide" transparent onRequestClose={() => setModalHistorial(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Historial</Text>
              <TouchableOpacity onPress={() => setModalHistorial(false)}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.conversationsList}>
              {conversaciones.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Ionicons name="chatbubbles-outline" size={60} color="#ddd" />
                  <Text style={styles.emptyHistoryText}>No hay conversaciones guardadas</Text>
                </View>
              ) : (
                conversaciones.map((conv) => (
                  <TouchableOpacity
                    key={conv.id}
                    style={[styles.conversationItem, conversacionActual === conv.id && styles.conversationItemActive]}
                    onPress={() => { cargarMensajesConversacion(conv.id); setModalHistorial(false); }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.conversationIcon}>
                      <Ionicons name="chatbubbles" size={20} color="#666" />
                    </View>
                    <View style={styles.conversationInfo}>
                      <Text style={styles.conversationName}>{conv.nombre}</Text>
                      <Text style={styles.conversationDate}>
                        {conv.fecha.toLocaleDateString("es-ES")} - {conv.mensajes.length} mensajes
                      </Text>
                    </View>
                    {conversacionActual === conv.id && <Ionicons name="checkmark-circle" size={24} color="#10B981" />}
                  </TouchableOpacity>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 20,
    paddingTop: 40,
  },
  aiIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  notLoggedTitle: {
    fontSize: 32,
    fontFamily: "PlayfairDisplay_700Bold",
    color: "#fff",
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  notLoggedSubtitle: {
    fontSize: 16,
    fontFamily: "PlayfairDisplay_400Regular",
    color: "#fff",
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    opacity: 0.9,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingLeft: 20,
  },
  featureText: {
    fontSize: 15,
    fontFamily: "PlayfairDisplay_400Regular",
    color: "#fff",
    marginLeft: 15,
    flex: 1,
  },
  loginPrompt: {
    fontSize: 14,
    fontFamily: "PlayfairDisplay_600SemiBold",
    color: "#fff",
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.95,
    lineHeight: 22,
  },
  loginButton: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  loginButtonText: {
    fontSize: 14,
    fontFamily: "PlayfairDisplay_700Bold",
    color: "#000",
    letterSpacing: 1.5,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  registerButtonText: {
    fontSize: 14,
    fontFamily: "PlayfairDisplay_700Bold",
    color: "#fff",
    letterSpacing: 1.5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 70 : 60,
    paddingBottom: 15,
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
    fontSize: 12,
    fontFamily: "PlayfairDisplay_400Regular",
    color: "#666",
    marginTop: 2,
    letterSpacing: 0.3,
  },
  historyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 20,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 20,
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
  timestamp: {
    fontSize: 10,
    marginTop: 8,
    fontFamily: "PlayfairDisplay_400Regular",
  },
  userTimestamp: {
    color: "rgba(255,255,255,0.6)",
    textAlign: "right",
  },
  aiTimestamp: {
    color: "#999",
    textAlign: "left",
  },
  productosContainer: {
    marginTop: 12,
    gap: 10,
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
  },
  productImage: {
    width: 80,
    height: 80,
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
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontFamily: "PlayfairDisplay_700Bold",
    color: "#000",
  },
  stockBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockText: {
    fontSize: 10,
    fontFamily: "PlayfairDisplay_600SemiBold",
    color: "#fff",
  },
  inputContainer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 100 : 80,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyHistoryText: {
    fontSize: 16,
    fontFamily: "PlayfairDisplay_400Regular",
    color: "#999",
    marginTop: 16,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f0f0f0",
    marginBottom: 12,
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
