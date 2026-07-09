// app/(tabs)/ia/giulia.tsx
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
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useApi } from "../../../contexts/ApiContext";

const { width, height } = Dimensions.get("window");

const GEMINI_API_KEY = "AIzaSyClDb-oeNphWQrY4qeqnbt9a7qLn4RhP4E";
const STORAGE_KEY = "giulia_conversations_v2";

// Mensaje amigable que se muestra en el chat cuando falla la IA (incluye cuota excedida / demo)
const DEMO_ERROR_MESSAGE =
  "Lo siento, esta es una version demo y en este momento no puedo responder. Por favor, intente mas tarde.";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

interface Conversation {
  id: string;
  title: string;
  date: string;
  messages: Message[];
}

// ─── Typing dots ──────────────────────────────────────────────────────────────
const TypingIndicator = () => {
  const d1 = useRef(new Animated.Value(0)).current;
  const d2 = useRef(new Animated.Value(0)).current;
  const d3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (d: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(d, { toValue: -5, duration: 350, easing: Easing.ease, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: 350, easing: Easing.ease, useNativeDriver: true }),
        ])
      );
    const a1 = anim(d1, 0);
    const a2 = anim(d2, 120);
    const a3 = anim(d3, 240);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={styles.typingRow}>
      <View style={styles.aiAvatar}>
        <Ionicons name="sparkles" size={14} color="#C9A84C" />
      </View>
      <View style={styles.typingBubble}>
        <Animated.View style={[styles.dot, { transform: [{ translateY: d1 }] }]} />
        <Animated.View style={[styles.dot, { transform: [{ translateY: d2 }] }]} />
        <Animated.View style={[styles.dot, { transform: [{ translateY: d3 }] }]} />
      </View>
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function GiuliaScreen() {
  const apiUrl = useApi();
  const tabBarHeight = useBottomTabBarHeight();
  const scrollRef = useRef<ScrollView>(null);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });

  const [isLogged, setIsLogged] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // ─── Auth check ─────────────────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      console.log("[Giulia] Verificando autenticacion...");
      try {
        const user = await AsyncStorage.getItem("user");
        const token =
          (await AsyncStorage.getItem("access")) ||
          (await AsyncStorage.getItem("token"));
        const logged = !!(user && token);
        console.log("[Giulia] isLogged:", logged);
        setIsLogged(logged);
      } catch (e) {
        console.log("[Giulia] Error auth:", e);
        setIsLogged(false);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  // ─── Load conversations from storage ────────────────────────────
  useEffect(() => {
    if (!isLogged) return;
    const loadConversations = async () => {
      console.log("[Giulia] Cargando conversaciones guardadas...");
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const convs: Conversation[] = JSON.parse(raw);
          console.log("[Giulia] Conversaciones encontradas:", convs.length);
          setConversations(convs);
          // Load last conversation
          if (convs.length > 0) {
            setCurrentConvId(convs[0].id);
            setMessages(convs[0].messages);
            console.log("[Giulia] Cargando conversacion:", convs[0].title);
          } else {
            startNewConversation([]);
          }
        } else {
          console.log("[Giulia] Sin conversaciones previas, creando nueva...");
          startNewConversation([]);
        }
      } catch (e) {
        console.log("[Giulia] Error cargando conversaciones:", e);
        startNewConversation([]);
      }
    };
    loadConversations();
  }, [isLogged]);

  // ─── Save conversations whenever they change ─────────────────────
  const saveConversations = async (convs: Conversation[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
      console.log("[Giulia] Conversaciones guardadas:", convs.length);
    } catch (e) {
      console.log("[Giulia] Error guardando conversaciones:", e);
    }
  };

  // ─── Start a new conversation ────────────────────────────────────
  const startNewConversation = (existingConvs: Conversation[]) => {
    const welcome: Message = {
      id: Date.now().toString(),
      text: "Bienvenido. Soy Giulia, consultora especializada en fragancias. ¿En qué puedo ayudarle?",
      isUser: false,
    };
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: "Nueva consulta",
      date: new Date().toLocaleDateString("es-ES"),
      messages: [welcome],
    };
    const updated = [newConv, ...existingConvs];
    setConversations(updated);
    setCurrentConvId(newConv.id);
    setMessages([welcome]);
    saveConversations(updated);
    console.log("[Giulia] Nueva conversacion creada:", newConv.id);
  };

  const handleNewConversation = () => {
    startNewConversation(conversations);
  };

  // ─── Delete conversation ─────────────────────────────────────────
  const deleteConversation = async (id: string) => {
    console.log("[Giulia] Eliminando conversacion:", id);
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    await saveConversations(updated);

    if (id === currentConvId) {
      if (updated.length > 0) {
        setCurrentConvId(updated[0].id);
        setMessages(updated[0].messages);
      } else {
        startNewConversation([]);
      }
    }
  };

  // ─── Update current conversation in list ─────────────────────────
  const updateConversation = (convId: string, newMessages: Message[], userText: string) => {
    setConversations((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== convId) return c;
        return {
          ...c,
          title: c.title === "Nueva consulta" ? userText.slice(0, 30) + "..." : c.title,
          messages: newMessages,
        };
      });
      saveConversations(updated);
      return updated;
    });
  };

  // ─── Send message to Gemini ──────────────────────────────────────
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now().toString(), text, isUser: true };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    console.log("[Giulia] Enviando mensaje a Gemini:", text.slice(0, 50));

    try {
      const systemText =
        "Eres Giulia, consultora experta en fragancias de lujo. " +
        "Responde exclusivamente sobre perfumes, notas olfativas, marcas, tipos de fragancia (EDT, EDP, etc.), " +
        "consejos de uso, conservacion y tendencias. " +
        "Tu tono es profesional, elegante y conciso. " +
        "No uses emojis. No uses asteriscos ni formato markdown. " +
        "Escribe en texto plano, oraciones cortas y directas. " +
        "Si el usuario pregunta algo que no sea sobre fragancias, indica amablemente que tu especialidad son los perfumes.";

      // Build contents: only messages that already exist (exclude welcome if only 1 message)
      const geminiContents = nextMessages
        .filter((m) => !(m.isUser === false && nextMessages.indexOf(m) === 0 && nextMessages.length <= 2))
        .map((m) => ({
          role: m.isUser ? "user" : "model",
          parts: [{ text: m.text }],
        }));

      // Ensure first message is from user
      const firstUserIdx = geminiContents.findIndex((c) => c.role === "user");
      const validContents = firstUserIdx >= 0 ? geminiContents.slice(firstUserIdx) : geminiContents;

      console.log("[Giulia] Contenidos para Gemini:", validContents.length, "turnos");

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
      console.log("[Giulia] Llamando a:", url.replace(GEMINI_API_KEY, "***"));

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: validContents,
          systemInstruction: {
            parts: [{ text: systemText }],
          },
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 500,
          },
        }),
      });

      console.log("[Giulia] HTTP status:", response.status);

      if (!response.ok) {
        const errText = await response.text();
        console.log("[Giulia] Error HTTP de Gemini:", errText);
        // Cualquier error HTTP (incluyendo 429 de cuota excedida) se maneja
        // de forma amigable en el catch de abajo.
        throw new Error(`Gemini HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("[Giulia] Respuesta recibida. Candidatos:", data.candidates?.length ?? 0);

      let aiText =
        data.candidates?.[0]?.content?.parts?.[0]?.text ??
        "";

      if (!aiText) {
        // No vino texto util en la respuesta: mostramos el mensaje de demo
        throw new Error("Respuesta vacia de Gemini");
      }

      // Clean any markdown that slipped through
      aiText = aiText
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/^#{1,6}\s+/gm, "")
        .trim();

      console.log("[Giulia] Respuesta limpia:", aiText.slice(0, 80));

      const aiMsg: Message = { id: (Date.now() + 1).toString(), text: aiText, isUser: false };
      const finalMessages = [...nextMessages, aiMsg];
      setMessages(finalMessages);
      updateConversation(currentConvId!, finalMessages, text);

      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    } catch (e: any) {
      console.log("[Giulia] Error enviando mensaje:", e?.message ?? e);
      // Mensaje amigable directo en el chat: version demo, intente mas tarde.
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: DEMO_ERROR_MESSAGE,
        isUser: false,
      };
      const finalMessages = [...nextMessages, errMsg];
      setMessages(finalMessages);
      updateConversation(currentConvId!, finalMessages, text);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    } finally {
      setLoading(false);
    }
  };

  // ─── Guards ──────────────────────────────────────────────────────
  if (!fontsLoaded || checkingAuth) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#C9A84C" />
      </View>
    );
  }

  if (!isLogged) {
    return (
      <View style={styles.videoContainer}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <Video
          source={require("../../../assets/images/giulia.mp4")}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted
          useNativeControls={false}
        />
        <LinearGradient
          colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.45)", "rgba(0,0,0,0.15)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.videoContent}>
          <Ionicons name="sparkles" size={48} color="#C9A84C" style={{ marginBottom: 18 }} />
          <Text style={styles.videoTitle}>Giulia</Text>
          <Text style={styles.videoSubtitle}>Consultora Personal de Fragancias</Text>
          <View style={styles.videoDivider} />
          <Text style={styles.videoHint}>Inicie sesion para acceder</Text>
        </View>
      </View>
    );
  }

  // ─── Main UI ─────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Giulia</Text>
          <Text style={styles.headerSub}>Consultora de fragancias</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowHistory(true)}>
            <Ionicons name="time-outline" size={22} color="#C9A84C" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtnPrimary} onPress={handleNewConversation}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat + Input */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={{ padding: 16, paddingBottom: tabBarHeight + 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.msgRow,
                msg.isUser ? styles.msgRowUser : styles.msgRowAi,
              ]}
            >
              {!msg.isUser && (
                <View style={styles.aiAvatar}>
                  <Ionicons name="sparkles" size={13} color="#C9A84C" />
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  msg.isUser ? styles.bubbleUser : styles.bubbleAi,
                ]}
              >
                <Text style={msg.isUser ? styles.textUser : styles.textAi}>
                  {msg.text}
                </Text>
              </View>
            </View>
          ))}
          {loading && <TypingIndicator />}
        </ScrollView>

        {/* Input bar */}
        <View style={[styles.inputBar, { paddingBottom: tabBarHeight + 10, marginBottom: 0 }]}>
          <TextInput
            style={styles.textInput}
            placeholder="Escriba su consulta..."
            placeholderTextColor="#BBBBBB"
            value={input}
            onChangeText={setInput}
            multiline
            editable={!loading}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={17} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* History Modal */}
      <Modal visible={showHistory} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Historial</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {conversations.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="chatbubbles-outline" size={44} color="#DDD" />
                  <Text style={styles.emptyText}>Sin conversaciones guardadas</Text>
                </View>
              ) : (
                conversations.map((conv) => (
                  <View key={conv.id} style={styles.convRow}>
                    <TouchableOpacity
                      style={[
                        styles.convItem,
                        conv.id === currentConvId && styles.convItemActive,
                      ]}
                      onPress={() => {
                        setMessages(conv.messages);
                        setCurrentConvId(conv.id);
                        setShowHistory(false);
                        console.log("[Giulia] Cargando conversacion:", conv.title);
                      }}
                    >
                      <Ionicons name="chatbubble-outline" size={18} color="#C9A84C" />
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={styles.convTitle} numberOfLines={1}>
                          {conv.title}
                        </Text>
                        <Text style={styles.convDate}>{conv.date}</Text>
                      </View>
                    </TouchableOpacity>
                    {/* Delete button */}
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => deleteConversation(conv.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { justifyContent: "center", alignItems: "center" },
  bigText: { fontSize: 22, fontFamily: "PlayfairDisplay_700Bold", color: "#1A1A1A" },
  subtleText: { fontSize: 14, color: "#999", marginTop: 6 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 32 : 28,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0EBE0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "PlayfairDisplay_700Bold",
    color: "#1A1A1A",
  },
  headerSub: {
    fontSize: 11,
    color: "#C9A84C",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerBtn: { padding: 6 },
  headerBtnPrimary: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#C9A84C",
    justifyContent: "center",
    alignItems: "center",
  },

  // Chat
  chatArea: { flex: 1, backgroundColor: "#FAFAF8" },
  msgRow: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
  },
  msgRowUser: { justifyContent: "flex-end" },
  msgRowAi: { justifyContent: "flex-start" },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF8EC",
    borderWidth: 1.5,
    borderColor: "#C9A84C",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 18,
  },
  bubbleUser: {
    backgroundColor: "#1A1A1A",
    borderBottomRightRadius: 4,
  },
  bubbleAi: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#EDE8DF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textUser: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "PlayfairDisplay_400Regular",
  },
  textAi: {
    color: "#1A1A1A",
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "PlayfairDisplay_400Regular",
  },

  // Typing
  typingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EDE8DF",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C9A84C",
  },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#EDE8DF",
    paddingHorizontal: 14,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 4,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#F5F0EB",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    fontFamily: "PlayfairDisplay_400Regular",
    color: "#1A1A1A",
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "#EDE8DF",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#C9A84C",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    shadowColor: "#C9A84C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: "#DDDDDD",
    shadowOpacity: 0,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    maxHeight: "75%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "PlayfairDisplay_700Bold",
    color: "#1A1A1A",
  },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyText: { color: "#BBB", marginTop: 10, fontSize: 14 },

  // Conversation row
  convRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  convItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  convItemActive: {
    backgroundColor: "#FFF8EC",
  },
  convTitle: {
    fontSize: 14,
    fontFamily: "PlayfairDisplay_600SemiBold",
    color: "#1A1A1A",
  },
  convDate: { fontSize: 11, color: "#BBB", marginTop: 2 },
  deleteBtn: {
    padding: 10,
  },

  // Video (not logged in) — todo el contenido centrado en la pantalla
  videoContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  videoContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  videoTitle: {
    fontSize: 42,
    fontFamily: "PlayfairDisplay_700Bold",
    color: "#FFFFFF",
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: "center",
  },
  videoSubtitle: {
    fontSize: 15,
    fontFamily: "PlayfairDisplay_400Regular",
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  videoDivider: {
    width: 40,
    height: 1,
    backgroundColor: "#C9A84C",
    marginTop: 24,
    marginBottom: 24,
  },
  videoHint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    textAlign: "center",
  },
});