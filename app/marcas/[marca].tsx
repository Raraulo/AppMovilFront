// app/marcas/[marca].tsx
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  useFonts,
} from "@expo-google-fonts/playfair-display";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
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
import { FancyTabBar } from "../(tabs)/_layout";
import { useApi } from "../../contexts/ApiContext";
import {
  addToCart,
  addToFavorites,
  getCart,
  getFavorites,
  removeFromFavorites,
  storageEvents,
} from "../../utils/storage";


const { width, height } = Dimensions.get("window");
const CARD_MARGIN = 10;
const CARD_WIDTH = (width - CARD_MARGIN * 3) / 2;
const CARD_HEIGHT = 340;


// ✨ TOAST MEJORADO
const Toast = ({ visible, message, type = "success", onHide }: any) => {
  const translateY = useRef(new Animated.Value(-120)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 7,
          tension: 65,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 6,
          tension: 50,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start();


      setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -120,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.in(Easing.cubic),
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (onHide) onHide();
        });
      }, 3000);
    }
  }, [visible]);


  if (!visible) return null;


  const backgroundColor = type === "error" 
    ? "rgba(239, 68, 68, 0.95)" 
    : type === "success"
    ? "rgba(0, 0, 0, 0.95)"
    : "rgba(18, 18, 18, 0.95)";
  
  const icon = type === "success" 
    ? "checkmark-circle" 
    : type === "error" 
    ? "close-circle" 
    : "information-circle";


  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { 
          backgroundColor,
          transform: [{ translateY }, { scale }],
          opacity
        },
      ]}
    >
      <View style={styles.toastContent}>
        <Ionicons name={icon} size={24} color="#fff" />
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
};


// ✨ TARJETA DE PRODUCTO ANIMADA
const AnimatedProductCard = ({ item, index, onPress, onToggleFavorite, isFavorite, marca }: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;


  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 50,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: index * 50,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, []);


  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };


  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };


  return (
    <Animated.View
      style={[
        { 
          opacity: fadeAnim, 
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }] 
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
        activeOpacity={1}
      >
        <View style={styles.cardImageContainer}>
          <Image
            source={{ uri: item.url_imagen }}
            style={styles.image}
            resizeMode="cover"
          />
          
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.15)']}
            style={styles.cardGradient}
          />


          {item.stock === 0 && (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>AGOTADO</Text>
            </View>
          )}


          <TouchableOpacity
            style={styles.heartButton}
            onPress={onToggleFavorite}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={20}
              color={isFavorite ? "#EF4444" : "#fff"}
            />
          </TouchableOpacity>
        </View>


        <View style={styles.infoBox}>
          <Text style={styles.cardBrand} numberOfLines={1}>
            {marca}
          </Text>
          <Text style={styles.cardName} numberOfLines={2}>
            {item.nombre}
          </Text>
          <View style={styles.cardPriceContainer}>
            <Text style={styles.cardPrice} numberOfLines={1}>
              ${item.precio}
            </Text>
            <View style={styles.cardDivider} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};


export default function MarcaScreen() {
  const router = useRouter();
  const apiUrl = useApi();
  const { marca, marcaId } = useLocalSearchParams();
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState("Todos");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(height)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const modalFlatListRef = useRef<FlatList>(null);


  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });


  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });

  const tipoEquivalencias: Record<number, string> = {
  1: "Perfume",          // ✅ Correcto
  2: "Eau de Parfum",    // ✅ Correcto
  3: "Eau de Toilette",  // ✅ Correcto
  4: "Eau de Cologne",   // ✅ Correcto
  5: "Eau Fraîche",      // ✅ Correcto
};



  const showToast = (message: string, type = "success") => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(50);
    }
    setToast({ visible: true, message, type });
  };

useEffect(() => {
  if (!marca || !apiUrl) return;
  
  const fetchData = async () => {
    try {
      console.log('📡 Conectando a:', apiUrl);
      
      const res = await fetch(`${apiUrl}/api/productos/`);
      const allProducts = await res.json();
      
      // ✅ Normalizar: quitar guiones y lowercase
      const normalize = (str: string) => 
        str.replace(/-/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
      
      const marcaNormalizada = normalize(typeof marca === 'string' ? marca : String(marca));
      
      console.log('🔍 Buscando marca:', marcaNormalizada);
      
      // ✅ Filtrar comparando ambos normalizados
      const marcaProducts = allProducts.filter((p: any) => {
        const marcaProducto = normalize(p.marca_nombre || '');
        return marcaProducto === marcaNormalizada;
      });
      
      setProductos(marcaProducts);
      console.log(`✅ Productos cargados: ${marcaProducts.length} de ${marca}`);
    } catch (error) {
      console.error('❌ Error cargando productos:', error);
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
}, [marca, apiUrl]);



  useEffect(() => {
    const handleFavChange = async () => {
      const updated = await getFavorites();
      setFavoritos(updated);
    };
    storageEvents.on("favoritesChanged", handleFavChange);
    return () => storageEvents.off("favoritesChanged", handleFavChange);
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
    
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 7,
      tension: 50,
    }).start();


    setTimeout(() => {
      modalFlatListRef.current?.scrollToIndex({ 
        index, 
        animated: false 
      });
    }, 100);
  };


  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 350,
      useNativeDriver: true,
      easing: Easing.in(Easing.cubic),
    }).start(() => setIsModalVisible(false));
  };


   const toggleFavorite = async (perfume: any) => {
  const isFavNow = favoritos.some((f) => f.id === perfume.id);


  try {
    const updated = isFavNow
      ? await removeFromFavorites(perfume.id)
      : await addToFavorites(perfume);
    
    setFavoritos(updated);


    // Solo animación del corazón (sin toast ni vibración)
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 0.88,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(heartScale, {
        toValue: 1.15,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
        tension: 50,
      }),
    ]).start();
    
  } catch {
    showToast("Error al actualizar favoritos", "error");
  }
};



  const isFavorite = (id: number) => favoritos.some((f) => f.id === id);


  const onModalViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setSelectedIndex(viewableItems[0].index);
    }
  }).current;


  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;


  const renderModalItem = ({ item }: any) => (
    <View style={styles.modalProductContainer}>
      <View style={styles.modalImageBox}>
        <Image
          source={{ uri: item.url_imagen }}
          style={styles.modalFullImage}
        />


        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.5)']}
          style={styles.modalImageGradient}
        />


        {item.stock === 0 && (
          <View style={styles.outOfStockBadgeModal}>
            <Text style={styles.outOfStockTextModal}>AGOTADO</Text>
          </View>
        )}


        <TouchableOpacity
          style={styles.modalHeartButton}
          onPress={() => toggleFavorite(item)}
          activeOpacity={0.85}
        >
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons
              name={isFavorite(item.id) ? "heart" : "heart-outline"}
              size={28}
              color={isFavorite(item.id) ? "#EF4444" : "#333333"}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>


      <View style={styles.modalTextBoxFull}>
        <View style={styles.namePriceRow}>
          <View style={styles.modalNameContainer}>
            <Text style={styles.modalName} numberOfLines={2}>
              {item.nombre}
            </Text>
            <Text style={styles.modalBrand}>
              {marca}
            </Text>
          </View>
          <View style={styles.modalPriceContainer}>
            <Text style={styles.modalPrice}>
              ${item.precio}
            </Text>
          </View>
        </View>


        <View style={styles.modalDivider} />


        <ScrollView 
          showsVerticalScrollIndicator={false}
          style={styles.modalScrollContent}
        >
          <Text style={styles.modalLabel}>Descripción</Text>
          <Text style={styles.modalDescription}>
            {item.descripcion || "Sin descripción disponible."}
          </Text>


          <View style={styles.modalInfoGrid}>
            <View style={styles.modalInfoItem}>
              <Ionicons name="water-outline" size={18} color="#666" />
              <Text style={styles.modalInfo}>
                {tipoEquivalencias[item.tipo] || "Desconocido"}
              </Text>
            </View>
            <View style={styles.modalInfoItem}>
              <Ionicons name="cube-outline" size={18} color="#666" />
              <Text style={styles.modalInfo}>
                {item.stock} unidades
              </Text>
            </View>
          </View>
        </ScrollView>


        <TouchableOpacity
          style={[
            styles.fullWidthAddButton,
            item.stock === 0 && styles.disabledButton
          ]}
          onPress={async () => {
            if (item.stock === 0) {
              showToast("Sin stock disponible", "error");
              return;
            }
            try {
              const currentCart = await getCart();
              const itemExists = currentCart.find((i: any) => i.id === item.id);
              if (itemExists) {
                showToast("Producto ya en el cesto", "error");
              } else {
                const updated = await addToCart(item);
                setCartCount(updated.length);
                showToast("Añadido al cesto", "success");
              }
            } catch (error) {
              showToast("Error al añadir", "error");
            }
          }}
          disabled={item.stock === 0}
          activeOpacity={0.85}
        >
          <Ionicons
            name="bag-handle-outline"
            size={20}
            color={item.stock === 0 ? "#999" : "#fff"}
          />
          <Text style={[
            styles.actionText,
            item.stock === 0 && styles.disabledText
          ]}>
            {item.stock === 0 ? "Sin stock" : "Añadir al cesto"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );


  if (loading || !fontsLoaded)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );


  const displayMarca = typeof marca === 'string' ? marca.replace(/-/g, ' ') : marca;


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
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                >
                  <View style={styles.backButtonContainer}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                  </View>
                </TouchableOpacity>
                <Image
                  source={require("../../assets/images/logomaison.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>


              <View style={styles.titleContainer}>
                <Text style={styles.title}>{displayMarca}</Text>
                <View style={styles.titleDivider} />
                <Text style={styles.subtitle}>Colección exclusiva</Text>
              </View>


              <View style={styles.searchContainer}>
                <View style={[
                  styles.searchInputWrapper,
                  isSearchFocused && styles.searchInputFocused
                ]}>
                  <Ionicons 
                    name="search" 
                    size={20} 
                    color={isSearchFocused ? "#000" : "#999"} 
                    style={styles.searchIcon}
                  />
                  <TextInput
                    placeholder={`Buscar en ${displayMarca}...`}
                    placeholderTextColor="#aaa"
                    style={styles.searchInput}
                    value={searchText}
                    onChangeText={setSearchText}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                  />
                  {searchText.length > 0 && (
                    <TouchableOpacity 
                      onPress={() => setSearchText("")}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={20} color="#666" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>


              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersContainer}
              >
                {[
                  "Todos",
  "Perfume",           // ✅ Cambiar de "Parfum" a "Perfume"
  "Eau de Parfum",
  "Eau de Toilette",
  "Eau de Cologne",
  "Eau Fraîche",
                ].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterButton,
                      filterType === type && styles.filterButtonActive,
                    ]}
                    onPress={() => setFilterType(type)}
                    activeOpacity={0.8}
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
              </ScrollView>


              <View style={styles.resultsContainer}>
                <Text style={styles.resultsText}>
                  {filteredPerfumes.length} {filteredPerfumes.length === 1 ? 'producto' : 'productos'}
                </Text>
              </View>
            </>
          }
          renderItem={({ item, index }) => (
            <AnimatedProductCard
              item={item}
              index={index}
              marca={displayMarca}
              onPress={() => openModal(index)}
              onToggleFavorite={() => toggleFavorite(item)}
              isFavorite={isFavorite(item.id)}
            />
          )}
        />
      )}


      {isModalVisible && (
        <Modal visible transparent animationType="none">
          <View style={styles.modalBackdrop}>
            <Animated.View 
              style={[
                styles.modalOverlay, 
                { transform: [{ translateY: slideAnim }] }
              ]}
            >
              <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast({ ...toast, visible: false })}
              />


              <TouchableOpacity 
                onPress={closeModal} 
                style={styles.backArrow}
                activeOpacity={0.7}
              >
                <View style={styles.backArrowContainer}>
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </View>
              </TouchableOpacity>


              <FlatList
                ref={modalFlatListRef}
                data={filteredPerfumes}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderModalItem}
                onViewableItemsChanged={onModalViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                getItemLayout={(data, index) => ({
                  length: width,
                  offset: width * index,
                  index,
                })}
                initialScrollIndex={selectedIndex}
                scrollEventThrottle={16}
                decelerationRate="fast"
                snapToInterval={width}
                snapToAlignment="center"
              />


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
            if (routeName === "index") router.push("/(tabs)");
            else router.push(`/(tabs)/${routeName.replace("/index", "")}`);
          },
          emit: () => ({ defaultPrevented: false }),
        }}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff" 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#fff"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: { 
    position: "absolute", 
    left: 20,
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
  logo: { 
    width: 160, 
    height: 70 
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  title: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 24,
    textAlign: "center",
    color: "#111",
    letterSpacing: 2,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  titleDivider: {
    width: 60,
    height: 3,
    backgroundColor: "#000",
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 13,
    color: "#666",
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  searchContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInputFocused: {
    borderColor: "#000",
    backgroundColor: "#fff",
    shadowOpacity: 0.1,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "PlayfairDisplay_400Regular",
    color: "#000",
    letterSpacing: 0.3,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  filterButtonActive: { 
    backgroundColor: "#000",
    borderColor: "#000",
  },
  filterText: { 
    fontSize: 12,
    color: "#666",
    fontFamily: "PlayfairDisplay_600SemiBold",
    letterSpacing: 0.5,
  },
  filterTextActive: { 
    color: "#fff" 
  },
  resultsContainer: {
    marginHorizontal: 20,
    marginBottom: 15,
  },
  resultsText: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 12,
    color: "#999",
    letterSpacing: 0.5,
  },
  row: { 
    justifyContent: "space-between", 
    paddingHorizontal: CARD_MARGIN,
    marginBottom: 15,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  cardImageContainer: {
    position: 'relative',
    width: '100%',
    height: 220,
  },
  image: { 
    width: "100%", 
    height: "100%" 
  },
  cardGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  outOfStockBadge: {
    position: "absolute",
    top: "42%",
    left: 0,
    right: 0,
    backgroundColor: "rgba(239, 68, 68, 0.96)",
    paddingVertical: 10,
    alignItems: "center",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  outOfStockText: {
    color: "#fff",
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 11,
    letterSpacing: 2,
  },
  heartButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  infoBox: { 
    height: 120,
    padding: 14,
    paddingBottom: 18,
    justifyContent: 'space-between',
  },
  cardBrand: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 11,
    color: "#888",
    textTransform: 'uppercase',
    letterSpacing: 1,
    height: 14,
  },
  cardName: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 14,
    color: "#111",
    lineHeight: 19,
    height: 38,
    marginBottom: 12,
  },
  cardPriceContainer: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
  },
  cardPrice: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 18,
    color: "#000",
    marginBottom: 8,
    height: 22,
    lineHeight: 22,
    textAlign: 'center',
  },
  cardDivider: {
    width: 30,
    height: 2,
    backgroundColor: '#000',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalOverlay: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    maxHeight: height,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
  },
  modalProductContainer: {
    width: width,
    height: height,
  },
  modalImageBox: {
    height: height * 0.48,
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  modalFullImage: { 
    width: "100%", 
    height: "100%", 
    resizeMode: "cover" 
  },
  modalImageGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  outOfStockBadgeModal: {
    position: "absolute",
    top: "44%",
    left: 0,
    right: 0,
    backgroundColor: "rgba(239, 68, 68, 0.97)",
    paddingVertical: 16,
    alignItems: "center",
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  outOfStockTextModal: {
    color: "#fff",
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 18,
    letterSpacing: 3,
  },
  backArrow: {
    position: "absolute",
    top: 50,
    left: 24,
    zIndex: 30,
  },
  backArrowContainer: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 24,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  modalHeartButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 28,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  modalTextBoxFull: {
    height: height * 0.52,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 25,
    paddingTop: 28,
  },
  namePriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  modalNameContainer: {
    flex: 1,
    marginRight: 15,
  },
  modalName: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
    color: "#000",
    lineHeight: 28,
    marginBottom: 6,
  },
  modalBrand: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 13,
    color: "#666",
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  modalPriceContainer: {
    alignItems: 'flex-end',
  },
  modalPrice: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 26,
    color: "#000",
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#e8e8e8',
    marginBottom: 20,
  },
  modalScrollContent: {
    flex: 1,
    marginBottom: 15,
  },
  modalLabel: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 14,
    color: "#000",
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalDescription: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 14,
    color: "#555",
    textAlign: "justify",
    lineHeight: 22,
    marginBottom: 20,
  },
  modalInfoGrid: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 10,
  },
  modalInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalInfo: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 13,
    color: "#666",
  },
  fullWidthAddButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    borderRadius: 30,
    paddingVertical: 16,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: "#f5f5f5",
    shadowOpacity: 0,
    elevation: 0,
  },
  actionText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 8,
    fontFamily: "PlayfairDisplay_600SemiBold",
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  disabledText: {
    color: "#999",
  },
  toastContainer: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    borderRadius: 16,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  toastText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "PlayfairDisplay_600SemiBold",
    marginLeft: 12,
    flex: 1,
    letterSpacing: 0.3,
  },
});
