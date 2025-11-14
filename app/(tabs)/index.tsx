import {
  Hahmlet_600SemiBold,
  useFonts as useHahmletFonts,
} from "@expo-google-fonts/hahmlet";
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  useFonts as usePlayfairFonts,
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
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { FancyTabBar } from "../(tabs)/_layout";
import {
  addToCart,
  addToFavorites,
  getCart,
  getFavorites,
  removeFromFavorites,
  storageEvents,
} from "../../utils/storage";

const { height, width } = Dimensions.get("window");

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

// Animación para cada marca
const AnimatedBrandCard = ({ item, index, onPress }: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.brandLogoWrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.brandLogoTouchable}>
        <Image
          source={{ uri: item.logo }}
          style={styles.brandLogo}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Componente de tarjeta animada para recomendados
const AnimatedCard = ({ item, index, onPress, onToggleFavorite, isFavorite }: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <TouchableOpacity onPress={onPress}>
        <View style={styles.card}>
          <Image source={{ uri: item.url_imagen }} style={styles.recoImage} />
          <TouchableOpacity style={styles.heartButton} onPress={onToggleFavorite}>
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={20}
              color={isFavorite ? "#FF4B5C" : "#fff"}
            />
          </TouchableOpacity>
          <Text style={styles.cardName}>{item.nombre}</Text>
          <Text style={styles.cardBrand}>{item.marca_nombre}</Text>
          <Text style={styles.cardPrice}>${item.precio}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const brands = [
  { id: 2, name: "Yves-Saint-Laurent", logo: "https://brandlogos.net/wp-content/uploads/2012/10/yves-saint-laurent-logo-vector.png" },
  { id: 3, name: "Dolce-Gabbana", logo: "https://brandslogos.com/wp-content/uploads/images/large/dolce-gabbana-logo.png" },
  { id: 4, name: "Armani", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSCN5XKMYCRed7Yleq5OSt49lXS5vLli1yMgg&s" },
  { id: 5, name: "Carolina-Herrera", logo: "https://i.pinimg.com/736x/41/41/f7/4141f7f7182700e702977e8210e85b37.jpg" },
  { id: 6, name: "Jean-Paul-Gaultier", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSix78CiM7Xu3HkwI94p_zj8Sxl9sAkfoxPgw&s" },
  { id: 7, name: "Lancome", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJYjCDxlMk4xr5q9EOmM5ldlebjJJOI4--rw&s" },
  { id: 8, name: "Dior", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRD2EGiH4UUxm5BmO7btUPmPP_JFVugLMotjw&s" },
  { id: 9, name: "Givenchy", logo: "https://i.pinimg.com/736x/12/5c/84/125c84bafd71927494498c4d59e746af.jpg" },
  { id: 10, name: "Valentino", logo: "https://1000logos.net/wp-content/uploads/2021/06/Valentino-logo.png" },
  { id: 11, name: "Prada", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_4R5kwTmlWDLAU1ZuHFClw4fOTEy7VlTk6g&s" },
  { id: 12, name: "Bvlgari", logo: "https://1000logos.net/wp-content/uploads/2018/10/Bvlgari-Logo.png" },
  { id: 13, name: "Versace", logo: "https://i.pinimg.com/564x/23/77/40/2377408021dd0c2fca98e0eabf98d6d4.jpg" },
  { id: 14, name: "Chanel", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQahc9-wbC0L-AZYjOFVlWbGNPJlUPL45X4PQ&s" },
  { id: 15, name: "Tom-Ford", logo: "https://1000logos.net/wp-content/uploads/2020/06/Tom-Ford-Logo.jpg" },
  { id: 16, name: "Brunello-Cucinelli", logo: "https://i.pinimg.com/564x/85/1b/ef/851bef0805d5088fd2ccc4d77d44812b.jpg" },
  { id: 17, name: "Moschino", logo: "https://1000marcas.net/wp-content/uploads/2020/03/Moschino-logo-1.png" },
];

export default function HomeScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null); 
  const brandsSectionRef = useRef<View>(null); 
  const [refreshing, setRefreshing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recomendados, setRecomendados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showBrands, setShowBrands] = useState(false);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  // Estado para el toast
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const flatListRef = useRef<FlatList>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const [playfairFontsLoaded] = usePlayfairFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
  });
  const [hahmletFontsLoaded] = useHahmletFonts({
    Hahmlet_600SemiBold,
  });
  const hahmletSemiBold = hahmletFontsLoaded ? "Hahmlet_600SemiBold" : "serif";

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

  const goToMujeres = () => router.push("../mujeres");
  const goToHombres = () => router.push("../hombres");
  const goToMarca = (brand: any) =>
    router.push({ pathname: `../marcas/${brand.name}`, params: { marcaId: brand.id } });

  const carouselImages = [
    { uri: "https://hips.hearstapps.com/hmg-prod/images/dua-lipa-1-1663181804.png?resize=1200:*", text: "Tu sello olfativo." },
    { uri: "https://images2.alphacoders.com/576/thumb-1920-576334.jpg", text: "Exclusivo por naturaleza." },
    { uri: "https://i.pinimg.com/736x/f5/8b/ab/f58babd08dac8465db89003bed737b48.jpg", text: "Más que perfume, presencia." },
  ];

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % carouselImages.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentIndex, isPlaying]);

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / width);
    setCurrentIndex(newIndex);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resProd = await fetch("http://172.22.19.248:8000/api/productos/");
        const resMarcas = await fetch("http://172.22.19.248:8000/api/marcas/");
        const productos = await resProd.json();
        const marcas = await resMarcas.json();
        const marcaMap: Record<number, string> = {};
        marcas.forEach((m: any) => (marcaMap[m.id] = m.nombre));
        const dataMap = productos.map((p: any) => ({
          ...p,
          marca_nombre: marcaMap[p.marca] || "Maison Parfum",
        }));
        setRecomendados(dataMap.sort(() => 0.5 - Math.random()).slice(0, 10));
      } catch (e) {
        console.error(e);
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

  useEffect(() => {
    const handleFavChange = async () => {
      const updated = await getFavorites();
      setFavoritos(updated);
    };
    storageEvents.on("favoritesChanged", handleFavChange);
    return () => storageEvents.off("favoritesChanged", handleFavChange);
  }, []);

  const toggleFavorite = async (perfume: any) => {
    const isFavNow = favoritos.some((f) => f.id === perfume.id);
    try {
      const updated = isFavNow
        ? await removeFromFavorites(perfume.id)
        : await addToFavorites(perfume);
      setFavoritos(updated);

      Animated.sequence([
        Animated.timing(heartScale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 1.08, duration: 120, useNativeDriver: true }),
        Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, friction: 4 }),
      ]).start();
    } catch {
      // Acción silenciosa
    }
  };

  const handleAddToCart = async () => {
    const perfume = recomendados[selectedIndex];
    try {
      const updated = await addToCart(perfume);
      setCartCount(updated.length);
      showToast("Perfume añadido al cesto", "success");
    } catch {
      showToast("No se pudo añadir al cesto", "error");
    }
  };

  const isFavorite = (id: number) => favoritos.some((f) => f.id === id);

  const openModal = (index: number) => {
    setSelectedIndex(index);
    setIsModalVisible(true);
    slideAnim.setValue(height);
    swipeAnim.setValue(0);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 6 }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }).start(
      () => setIsModalVisible(false)
    );
  };

  const changeProduct = (direction: 'next' | 'prev') => {
    const newIndex = direction === 'next' ? selectedIndex + 1 : selectedIndex - 1;
    
    if (newIndex >= 0 && newIndex < recomendados.length) {
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
        
        if (gestureState.dx < -swipeThreshold && selectedIndex < recomendados.length - 1) {
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

  const handleToggleBrands = () => {
    const newState = !showBrands;
    setShowBrands(newState);
    if (newState && brandsSectionRef.current && scrollViewRef.current) {
      brandsSectionRef.current.measureLayout(
        scrollViewRef.current as any,
        (x, y) => {
          scrollViewRef.current?.scrollTo({ y: y, animated: true });
        },
        () => console.log("Measure failed")
      );
    }
  };

  if (!playfairFontsLoaded || loading)
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#121212" />
      </View>
    );

  const logoOpacity = scrollY.interpolate({
    inputRange: [0, height * 0.4],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      <Animated.Image
        source={require("../../assets/images/logomaison.png")}
        style={[styles.logo, { opacity: logoOpacity }]}
        resizeMode="contain"
      />

      <Animated.ScrollView
        ref={scrollViewRef as any}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} />}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <View style={styles.heroSection}>
          <FlatList
            ref={flatListRef}
            data={carouselImages}
            horizontal
            pagingEnabled
            onMomentumScrollEnd={onMomentumScrollEnd}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <View style={styles.heroSlide}>
                <Image source={{ uri: item.uri }} style={styles.heroImage} resizeMode="cover" />
                <View style={styles.carouselTextContainer}>
                    <Text style={[styles.carouselText, { fontFamily: hahmletSemiBold }]}>
                        {item.text}
                    </Text>
                </View>
              </View>
            )}
          />
          <TouchableOpacity style={styles.playPauseButton} onPress={() => setIsPlaying(!isPlaying)}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={14} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.fullSection} onPress={goToMujeres}>
          <Image
            source={{ uri: "https://www.xtrafondos.com/wallpapers/ana-de-armas-l-officiel-usa-10888.jpg" }}
            style={styles.fullImage}
          />
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>MUJERES</Text>
            <Text style={styles.overlayButton}>VER MÁS</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.fullSection} onPress={goToHombres}>
          <Image
            source={{ uri: "https://agenciapura.com/wp-content/uploads/2025/02/german-gomez-768x1152.webp" }}
            style={styles.fullImage}
          />
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>HOMBRES</Text>
            <Text style={styles.overlayButton}>VER MÁS</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.recoContainer}>
          <Text style={styles.recoTitle}>RECOMENDADOS PARA TI</Text>
          <Text style={styles.recoTitle}></Text>
          <FlatList
            data={recomendados}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingHorizontal: 15 }}
            renderItem={({ item, index }) => (
              <AnimatedCard
                item={item}
                index={index}
                onPress={() => openModal(index)}
                onToggleFavorite={() => toggleFavorite(item)}
                isFavorite={isFavorite(item.id)}
              />
            )}
          />
        </View>

        <View style={styles.brandsContainer} ref={brandsSectionRef as any}>
          <TouchableOpacity style={styles.brandsToggle} onPress={handleToggleBrands}>
            <Text style={styles.brandsTitle}>BUSCAR POR MARCAS</Text>
            <Ionicons name={showBrands ? "chevron-up" : "add"} size={18} color="#121212" />
          </TouchableOpacity>

          {showBrands && (
            <View style={styles.brandGrid}>
              {brands.map((brand, index) => (
                <AnimatedBrandCard key={brand.id} item={brand} index={index} onPress={() => goToMarca(brand)} />
              ))}
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {isModalVisible && (
        <Modal visible transparent>
          <View style={styles.modalBackdrop}>
            <Animated.View style={[styles.modalOverlay, { transform: [{ translateY: slideAnim }] }]}>
              <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast({ ...toast, visible: false })}
              />

              <TouchableOpacity onPress={closeModal} style={styles.backArrow} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
              {selectedIndex < recomendados.length - 1 && (
                <TouchableOpacity
                  style={[styles.arrowButton, { right: 20 }]}
                  onPress={() => changeProduct('next')}
                >
                  <Ionicons name="chevron-forward" size={18} color="#000" />
                </TouchableOpacity>
              )}

              {recomendados[selectedIndex] && (
                <Animated.View style={[styles.modalFull, { transform: [{ translateX: swipeAnim }] }]} {...panResponder.panHandlers}>
                  <View style={styles.modalImageBox}>
                    <Image source={{ uri: recomendados[selectedIndex].url_imagen }} style={styles.modalFullImage} />

                    <TouchableOpacity
                      style={styles.modalHeartButton}
                      onPress={() => toggleFavorite(recomendados[selectedIndex])}
                      activeOpacity={0.9}
                    >
                      <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                        <Ionicons
                          name={isFavorite(recomendados[selectedIndex].id) ? "heart" : "heart-outline"}
                          size={30}
                          color={isFavorite(recomendados[selectedIndex].id) ? "red" : "#000"}
                        />
                      </Animated.View>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalTextBoxFull}>
                    <View style={styles.namePriceRow}>
                      <Text style={styles.modalName}>{recomendados[selectedIndex].nombre}</Text>
                      <Text style={styles.modalPrice}>${recomendados[selectedIndex].precio}</Text>
                    </View>

                    <Text style={styles.modalBrand}>{recomendados[selectedIndex].marca_nombre || "Maison Parfum"}</Text>

                    <Text style={styles.modalLabel}>Descripción:</Text>
                    <ScrollView>
                      <Text style={styles.modalDescription}>
                        {recomendados[selectedIndex].descripcion || "Sin descripción disponible."}
                      </Text>
                    </ScrollView>

                    <Text style={styles.modalInfo}>
                      Tipo: {tipoEquivalencias[recomendados[selectedIndex].tipo] || "Desconocido"}
                    </Text>

                    <TouchableOpacity style={styles.fullWidthAddButton} onPress={handleAddToCart}>
                      <Ionicons name="cart-outline" size={18} color="#000" />
                      <Text style={styles.actionText}>Añadir al cesto</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}
            </Animated.View>
          </View>
        </Modal>
      )}
      
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
            if (routeName === "index") router.back();
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
  logo: {
    width: 150,
    height: 100,
    position: "absolute",
    top: 40,
    left: -25,
    zIndex: 10,
  },
  heroSection: { width: "100%", height: height * 0.7, marginTop: 0 },
  heroSlide: { width, height: "100%", justifyContent: 'center', alignItems: 'center' },
  heroImage: { width, height: "100%", position: 'absolute' },
  carouselTextContainer: { 
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  carouselText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  playPauseButton: {
    position: "absolute",
    bottom: 12,
    right: 15,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 6,
  },
  fullSection: { width: "100%", height: height * 0.55 },
  fullImage: { width: "100%", height: "100%" },
  overlay: { position: "absolute", bottom: 35, left: 20 },
  overlayTitle: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "serif",
    letterSpacing: 1,
    fontWeight: "600",
  },
  overlayButton: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
    textDecorationLine: "underline",
  },
  recoContainer: { marginTop: 40, marginBottom: 60 },
  recoTitle: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 18,
    textAlign: "center",
    color: "#111",
    marginBottom: 14,
  },
  card: {
    width: 150,
    marginRight: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
  },
  recoImage: { width: "100%", height: 200 },
  cardName: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 12,
    textAlign: "center",
    color: "#111",
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
    textAlign: "center",
    marginVertical: 4,
  },
  heartButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: 6,
    borderRadius: 30,
  },
  brandsContainer: { marginHorizontal: 15, marginBottom: 80 },
  brandsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 10,
  },
  brandsTitle: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 16,
    color: "#121212",
  },
  brandGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 15,
  },
  brandLogoWrapper: {
    width: (width - 60) / 3,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoTouchable: {
    padding: 5,
    borderRadius: 10,
  },
  brandLogo: {
    width: (width - 60) / 3 - 20, 
    height: (width - 60) / 3 - 20, 
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.6)",
    justifyContent: "flex-end",
  },
  modalOverlay: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    maxHeight: height,
  },
  modalFull: { width: "100%", height: height },
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
  modalHeartButton: {
    position: "absolute",
    bottom: 15,
    right: 15,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 50,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.8,
    elevation: 6,
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
