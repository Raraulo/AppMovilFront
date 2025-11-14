import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  useFonts,
} from "@expo-google-fonts/playfair-display";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { FancyTabBar } from "../(tabs)/_layout";
import {
  addToCart,
  addToFavorites,
  getCart,
  getFavorites,
  removeFromFavorites,
} from "../../utils/storage";

const { width, height } = Dimensions.get("window");
const CARD_MARGIN = 10;
const CARD_WIDTH = (width - CARD_MARGIN * 3) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.8;

// Componente Toast flotante
const Toast = ({ visible, message, type = "success", onHide }: any) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
        }),
        Animated.delay(2000),
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onHide) onHide();
      });
    }
  }, [visible]);

  if (!visible) return null;

  const backgroundColor = type === "error" ? "#EF4444" : "#121212";
  const icon = type === "success" ? "checkmark-circle" : type === "error" ? "close-circle" : "information-circle";

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { backgroundColor, transform: [{ translateY }] },
      ]}
    >
      <Ionicons name={icon} size={20} color="#fff" />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

export default function MujeresScreen() {
  const router = useRouter();
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState("Todos");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const swipeAnim = useRef(new Animated.Value(0)).current;

  // Estado para el toast (solo para cesto)
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
  });

  const tipoEquivalencias: Record<number, string> = {
    1: "Eau Fraîche",
    2: "Eau de Cologne",
    3: "Eau de Toilette",
    4: "Eau de Parfum",
    5: "Parfum",
  };

  const showToast = (message: string, type = "success") => {
    setToast({ visible: true, message, type });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resProd, resMarcas] = await Promise.all([
          fetch("http://172.22.19.248:8000/api/productos/"),
          fetch("http://172.22.19.248:8000/api/marcas/"),
        ]);
        const productosData = await resProd.json();
        const marcasData = await resMarcas.json();

        const marcaMap: Record<number, string> = {};
        marcasData.forEach((m: any) => (marcaMap[m.id] = m.nombre));

        const mujeres = productosData
          .filter((p: any) => p.genero === "Mujer")
          .map((p: any) => ({
            ...p,
            marca_nombre: marcaMap[p.marca] || "Maison Parfum",
          }));

        setProductos(mujeres);
      } catch {
      } finally {
        setLoading(false);
      }
    };

    const loadStorage = async () => {
      const cart = await getCart();
      const favs = await getFavorites();
      setFavoritos(favs);
      setCartCount(cart.length);
    };

    fetchData();
    loadStorage();
  }, []);

  const filteredPerfumes = productos.filter(
    (p) =>
      (filterType === "Todos" || tipoEquivalencias[p.tipo] === filterType) &&
      p.nombre.toLowerCase().includes(searchText.toLowerCase())
  );

  const openModal = (index: number) => {
    setSelectedIndex(index);
    setIsModalVisible(true);
    slideAnim.setValue(height);
    swipeAnim.setValue(0);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 6,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setIsModalVisible(false));
  };

  const handleAddToCart = async () => {
    const perfume = filteredPerfumes[selectedIndex];
    try {
      const updated = await addToCart(perfume);
      setCartCount(updated.length);
      showToast("Perfume añadido al cesto", "success");
    } catch {
      showToast("No se pudo añadir al cesto", "error");
    }
  };

  const toggleFavorite = async (perfume: any) => {
    const isFav = favoritos.some((f) => f.id === perfume.id);
    try {
      if (isFav) {
        const updated = await removeFromFavorites(perfume.id);
        setFavoritos(updated);
      } else {
        const updated = await addToFavorites(perfume);
        setFavoritos(updated);
      }
    } catch {
      // Acción silenciosa
    }
  };

  const isFavorite = (id: number) => favoritos.some((f) => f.id === id);

  const changeProduct = (direction: 'next' | 'prev') => {
    const newIndex = direction === 'next' ? selectedIndex + 1 : selectedIndex - 1;
    
    if (newIndex >= 0 && newIndex < filteredPerfumes.length) {
      const swipeValue = direction === 'next' ? -width : width;
      
      Animated.sequence([
        Animated.timing(swipeAnim, {
          toValue: swipeValue,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(swipeAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]).start();
      
      setSelectedIndex(newIndex);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
          swipeAnim.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const swipeThreshold = width * 0.25;
        
        if (gestureState.dx < -swipeThreshold && selectedIndex < filteredPerfumes.length - 1) {
          changeProduct('next');
        } else if (gestureState.dx > swipeThreshold && selectedIndex > 0) {
          changeProduct('prev');
        } else {
          Animated.spring(swipeAnim, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  if (loading || !fontsLoaded)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#121212" />
      </View>
    );

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      {!isModalVisible && (
        <FlatList
          data={filteredPerfumes}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListHeaderComponent={
            <>
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.push("/")}
                >
                  <Ionicons name="arrow-back" size={22} color="#121212" />
                </TouchableOpacity>
                <Image
                  source={require("../../assets/images/logomaison.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.title}>Perfumes para mujeres</Text>

              <TextInput
                placeholder="Buscar perfume..."
                placeholderTextColor="#888"
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
              />

              <View style={styles.filtersContainer}>
                {[
                  "Todos",
                  "Eau Fraîche",
                  "Eau de Cologne",
                  "Eau de Toilette",
                  "Eau de Parfum",
                  "Parfum",
                ].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterButton,
                      filterType === type && styles.filterButtonActive,
                    ]}
                    onPress={() => setFilterType(type)}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        filterType === type && styles.filterTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          }
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => openModal(index)}
              style={styles.card}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: item.url_imagen }}
                style={styles.image}
                resizeMode="cover"
              />
              <View style={styles.infoBox}>
                <Text style={styles.cardName}>{item.nombre}</Text>
                <Text style={styles.cardBrand}>{item.marca_nombre}</Text>
                <Text style={styles.cardPrice}>${item.precio}</Text>
              </View>
              <TouchableOpacity
                style={styles.heartButton}
                onPress={() => toggleFavorite(item)}
              >
                <Ionicons
                  name={isFavorite(item.id) ? "heart" : "heart-outline"}
                  size={18}
                  color={isFavorite(item.id) ? "red" : "#fff"}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={isModalVisible} transparent>
        <Animated.View
          style={[styles.modalOverlay, { transform: [{ translateY: slideAnim }] }]}
        >
          <Toast
            visible={toast.visible}
            message={toast.message}
            type={toast.type}
            onHide={() => setToast({ ...toast, visible: false })}
          />

          <TouchableOpacity onPress={closeModal} style={styles.backArrow}>
            <Ionicons name="arrow-back" size={26} color="#000" />
          </TouchableOpacity>

          {selectedIndex > 0 && (
            <TouchableOpacity
              style={[styles.arrowButton, { left: 20 }]}
              onPress={() => changeProduct('prev')}
            >
              <Ionicons name="chevron-back" size={18} color="#000" />
            </TouchableOpacity>
          )}
          {selectedIndex < filteredPerfumes.length - 1 && (
            <TouchableOpacity
              style={[styles.arrowButton, { right: 20 }]}
              onPress={() => changeProduct('next')}
            >
              <Ionicons name="chevron-forward" size={18} color="#000" />
            </TouchableOpacity>
          )}

          {filteredPerfumes[selectedIndex] && (
            <Animated.View
              style={[styles.modalFull, { transform: [{ translateX: swipeAnim }] }]}
              {...panResponder.panHandlers}
            >
              <View style={styles.modalImageBox}>
                <Image
                  source={{ uri: filteredPerfumes[selectedIndex].url_imagen }}
                  style={styles.modalFullImage}
                />
                <TouchableOpacity
                  style={styles.heartButtonModal}
                  onPress={() => toggleFavorite(filteredPerfumes[selectedIndex])}
                >
                  <Ionicons
                    name={
                      isFavorite(filteredPerfumes[selectedIndex].id)
                        ? "heart"
                        : "heart-outline"
                    }
                    size={26}
                    color={
                      isFavorite(filteredPerfumes[selectedIndex].id)
                        ? "red"
                        : "#000"
                    }
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.modalTextBoxFull}>
                <View style={styles.namePriceRow}>
                  <Text style={styles.modalName}>
                    {filteredPerfumes[selectedIndex].nombre}
                  </Text>
                  <Text style={styles.modalPrice}>
                    ${filteredPerfumes[selectedIndex].precio}
                  </Text>
                </View>

                <Text style={styles.modalBrand}>
                  {filteredPerfumes[selectedIndex].marca_nombre}
                </Text>

                <Text style={styles.modalLabel}>Descripción:</Text>
                <ScrollView>
                  <Text style={styles.modalDescription}>
                    {filteredPerfumes[selectedIndex].descripcion ||
                      "Sin descripción disponible."}
                  </Text>
                </ScrollView>

                <Text style={styles.modalInfo}>
                  Tipo:{" "}
                  {tipoEquivalencias[filteredPerfumes[selectedIndex].tipo] ||
                    "Desconocido"}
                </Text>

                <TouchableOpacity
                  style={styles.fullWidthAddButton}
                  onPress={handleAddToCart}
                >
                  <Ionicons name="cart-outline" size={18} color="#000" />
                  <Text style={styles.actionText}>Añadir al cesto</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </Animated.View>
      </Modal>

      <FancyTabBar
        cartCount={cartCount}
        state={{
          index: 0,
          routes: [
            { key: "index", name: "index" },
            { key: "favoritos/index", name: "favoritos/index" },
            { key: "carrito/index", name: "carrito/index" },
            { key: "top", name: "top" },
            { key: "profile", name: "profile" },
          ],
        }}
        descriptors={{}}
        navigation={{
          navigate: (routeName: string) => {
            if (routeName === "index") router.push("/");
            else router.push(`/(tabs)/${routeName.replace("/index", "")}`);
          },
          emit: () => ({ defaultPrevented: false }),
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
    marginBottom: 10,
  },
  backButton: { position: "absolute", left: 20, padding: 5 },
  logo: { width: 200, height: 80 },
  title: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 16,
    color: "#111",
  },
  searchInput: {
    backgroundColor: "#f3f3f3",
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#111",
    fontFamily: "PlayfairDisplay_400Regular",
  },
  filtersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginVertical: 6,
  },
  filterButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#f1f1f1",
    margin: 3,
  },
  filterButtonActive: { backgroundColor: "#111" },
  filterText: { fontSize: 11, color: "#111" },
  filterTextActive: { color: "#fff" },
  row: { justifyContent: "space-between", paddingHorizontal: CARD_MARGIN },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginBottom: CARD_MARGIN,
    backgroundColor: "#fff",
    borderColor: "#ffffffff",
    borderWidth: 0.5,
  },
  image: { width: "100%", height: "70%", backgroundColor: "#f9f9f9" },
  infoBox: { alignItems: "center", flex: 1, paddingVertical: 6 },
  cardName: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 12,
    color: "#111",
    textAlign: "center",
  },
  cardBrand: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 10,
    color: "#666",
    textAlign: "center",
  },
  cardPrice: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 12,
    color: "#000",
    marginTop: 2,
    textAlign: "center",
  },
  heartButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: 5,
    borderRadius: 30,
  },
  heartButtonModal: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 10,
    borderRadius: 30,
    shadowColor: "#6b6b6bff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 6,
  },
  modalOverlay: { flex: 1, backgroundColor: "#fff" },
  modalFull: { flex: 1 },
  modalImageBox: {
    height: height * 0.5,
    width: "100%",
    overflow: "hidden",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    position: "relative",
  },
  modalFullImage: { width: "100%", height: "100%", resizeMode: "cover" },
  modalTextBoxFull: {
    height: height * 0.5,
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
  },
  namePriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalName: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 18,
    color: "#000",
  },
  modalPrice: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 18,
    color: "#000",
  },
  modalBrand: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 12,
    color: "#000",
    marginTop: 6,
  },
  modalLabel: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 13,
    color: "#000",
    marginTop: 10,
  },
  modalDescription: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 11,
    color: "#000",
    marginTop: 4,
    textAlign: "justify",
    lineHeight: 18,
  },
  modalInfo: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 10,
    color: "#000",
    marginTop: 8,
  },
  backArrow: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 20,
  },
  arrowButton: {
    position: "absolute",
    top: "30%",
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fullWidthAddButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 5,
    paddingVertical: 14,
    width: "100%",
  },
  actionText: {
    color: "#000",
    fontSize: 12,
    marginLeft: 6,
    fontFamily: "PlayfairDisplay_600SemiBold",
  },
  toastContainer: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "PlayfairDisplay_600SemiBold",
    marginLeft: 10,
    flex: 1,
  },
});
