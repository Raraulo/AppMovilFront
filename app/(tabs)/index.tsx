// app/(tabs)/index.tsx
import {
  Hahmlet_600SemiBold,
  useFonts as useHahmletFonts,
} from "@expo-google-fonts/hahmlet";
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  useFonts as usePlayfairFonts,
} from "@expo-google-fonts/playfair-display";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View
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

const { height, width } = Dimensions.get("window");

// ✨ COMPONENTE TOAST MEJORADO
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

// ✨ TARJETA DE MARCA MEJORADA
const AnimatedBrandCard = ({ item, index, onPress }: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 80,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: index * 80,
        useNativeDriver: true,
        friction: 8,
        tension: 50,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
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
        styles.brandLogoWrapper, 
        { 
          opacity: fadeAnim, 
          transform: [{ scale: scaleAnim }] 
        }
      ]}
    >
      <TouchableOpacity 
        onPress={onPress} 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.85} 
        style={styles.brandCard}
      >
        <View style={styles.brandLogoContainer}>
          <Image
            source={{ uri: item.logo }}
            style={styles.brandLogo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.brandName} numberOfLines={2}>
          {item.name.replace(/-/g, ' ')}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ✨ TARJETA DE PRODUCTO MEJORADA
const AnimatedCard = ({ item, index, onPress, onToggleFavorite, isFavorite }: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: index * 120,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        delay: index * 120,
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
        activeOpacity={1}
      >
        <View style={styles.card}>
          <View style={styles.cardImageContainer}>
            <Image 
              source={{ uri: item.url_imagen }} 
              style={styles.recoImage}
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

          <View style={styles.cardContent}>
            <Text style={styles.cardBrand} numberOfLines={1}>
              {item.marca_nombre}
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
  const apiUrl = useApi();
  const scrollViewRef = useRef<ScrollView>(null);
  const searchContainerRef = useRef<View>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recomendados, setRecomendados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredBrands, setFilteredBrands] = useState(brands);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const flatListRef = useRef<FlatList>(null);
  const modalFlatListRef = useRef<FlatList>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const [playfairFontsLoaded] = usePlayfairFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });
  const [hahmletFontsLoaded] = useHahmletFonts({
    Hahmlet_600SemiBold,
  });
  const hahmletSemiBold = hahmletFontsLoaded ? "Hahmlet_600SemiBold" : "serif";

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

  const goToMujeres = () => router.push("../mujeres");
  const goToHombres = () => router.push("../hombres");
  const goToMarca = (brand: any) =>
    router.push({ pathname: `../marcas/${brand.name}`, params: { marcaId: brand.id } });

  const carouselImages = [
    { 
      uri: "https://editorialtelevisa.brightspotcdn.com/dims4/default/7759517/2147483647/strip/false/crop/1280x883+0+0/resize/1280x883!/quality/90/?url=https%3A%2F%2Fk2-prod-editorial-televisa.s3.us-east-1.amazonaws.com%2Fbrightspot%2Fwp-content%2Fuploads%2F2021%2F02%2Fperfumes-para-parejas-paco-rabbane-build-love.jpg", 
      text: "Tu sello olfativo.",
      subtitle: "Sofisticación única"
    },
    { 
      uri: "https://images2.alphacoders.com/576/thumb-1920-576334.jpg", 
      text: "Exclusivo por naturaleza.",
      subtitle: "Descubre tu esencia" 
    },
    { 
      uri: "https://hips.hearstapps.com/hmg-prod/images/devotion-man-dolce-and-gabanna-perfume-hombre-italiano-678fcdc0c1611.jpg?crop=0.802xw:1.00xh;0.0897xw,0&resize=1200:*", 
      text: "Más que perfume, presencia.",
      subtitle: "Elegancia atemporal"
    },
    
  ];

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredBrands([]);
    } else {
      const filtered = brands.filter((brand) =>
        brand.name.toLowerCase().replace(/-/g, ' ').includes(searchQuery.toLowerCase())
      );
      setFilteredBrands(filtered);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % carouselImages.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, 6000);
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
        console.log('📡 Conectando a:', apiUrl);
        const resProd = await fetch(`${apiUrl}/api/productos/`);
        const resMarcas = await fetch(`${apiUrl}/api/marcas/`);
        const productos = await resProd.json();
        const marcas = await resMarcas.json();
        const marcaMap: Record<number, string> = {};
        marcas.forEach((m: any) => (marcaMap[m.id] = m.nombre));
        const dataMap = productos.map((p: any) => ({
          ...p,
          marca_nombre: marcaMap[p.marca] || "Maison Parfum",
        }));

        const productosConStock = dataMap.filter((p: any) => p.stock >= 11);
        setRecomendados(productosConStock.sort(() => 0.5 - Math.random()).slice(0, 10));

        console.log(`✅ Productos cargados: ${productosConStock.length} con stock >= 11`);
      } catch (e) {
        console.error('Error cargando productos:', e);
      } finally {
        setLoading(false);

        setTimeout(async () => {
          try {
            const showWelcome = await AsyncStorage.getItem("showWelcome");
            const username = await AsyncStorage.getItem("username");

            if (showWelcome === "true" && username) {
              showToast(`Bienvenido ${username}`);
              await AsyncStorage.removeItem("showWelcome");
              await AsyncStorage.removeItem("username");
            }
          } catch (error) {
            console.error("Error showing welcome:", error);
          }
        }, 500);
      }
    };
    const loadStorage = async () => {
      const cart = await getCart();
      const favs = await getFavorites();
      setFavoritos(favs);
      setCartCount(cart.length);
    };

    if (apiUrl) {
      fetchData();
      loadStorage();
    }
  }, [apiUrl]);

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

  const openModal = (index: number) => {
    setSelectedIndex(index);
    setIsModalVisible(true);
    slideAnim.setValue(height);
    
    Animated.spring(slideAnim, { 
      toValue: 0, 
      useNativeDriver: true, 
      friction: 7,
      tension: 50
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
      easing: Easing.in(Easing.cubic)
    }).start(
      () => setIsModalVisible(false)
    );
  };

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
          activeOpacity={0.6}
          delayPressIn={50}
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
              {item.marca_nombre || "Maison Parfum"}
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
          activeOpacity={0.6}
          delayPressIn={80}
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

  const clearSearch = () => {
    setSearchQuery("");
    setFilteredBrands([]);
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: height * 0.62,
        animated: true
      });
    }, 150);
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
  };

  const SkeletonLoader = () => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(shimmerAnim, {
              toValue: 1,
              duration: 1800,
              useNativeDriver: true,
              easing: Easing.bezier(0.4, 0.0, 0.2, 1),
            }),
            Animated.timing(shimmerAnim, {
              toValue: 0,
              duration: 1800,
              useNativeDriver: true,
              easing: Easing.bezier(0.4, 0.0, 0.2, 1),
            }),
          ]),
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 0.95,
              duration: 900,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 900,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    }, []);

    const shimmerTranslate = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-width * 1.5, width * 1.5],
    });

    return (
      <View style={styles.skeletonContainer}>
        <Animated.View style={[styles.skeletonHero, { opacity: pulseAnim }]}>
          <Animated.View
            style={[
              styles.shimmer,
              { transform: [{ translateX: shimmerTranslate }] },
            ]}
          />
        </Animated.View>
        <View style={styles.skeletonContent}>
          {[1, 2, 3, 4].map((i) => (
            <Animated.View key={i} style={[styles.skeletonCard, { opacity: pulseAnim }]}>
              <Animated.View
                style={[
                  styles.shimmer,
                  { transform: [{ translateX: shimmerTranslate }] },
                ]}
              />
            </Animated.View>
          ))}
        </View>
      </View>
    );
  };

  if (!playfairFontsLoaded || loading) return <SkeletonLoader />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      {/* ✨ HEADER BLANCO FIJO CON LOGO */}
      <View style={styles.headerContainer}>
        <Image
          source={require("../../assets/images/logomaison.png")}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <View style={styles.headerSpacer} />
      </View>

      <Animated.ScrollView
        ref={scrollViewRef as any}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => setRefreshing(false)}
            tintColor="#000"
            colors={["#000"]}
          />
        }
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* CARRUSEL HERO */}
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
                <Image 
                  source={{ uri: item.uri }} 
                  style={styles.heroImage} 
                  resizeMode="cover" 
                />
                
                <LinearGradient
                  colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.heroGradient}
                />

                <View style={styles.carouselTextContainer}>
                  <Animated.Text 
                    style={[
                      styles.carouselText, 
                      { fontFamily: hahmletSemiBold }
                    ]}
                  >
                    {item.text}
                  </Animated.Text>
                  <Text style={styles.carouselSubtitle}>
                    {item.subtitle}
                  </Text>
                </View>
              </View>
            )}
          />
          
          <TouchableOpacity 
            style={styles.playPauseButton} 
            onPress={() => setIsPlaying(!isPlaying)}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={16} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>

        {/* BUSCADOR */}
        <View
          ref={searchContainerRef as any}
          style={styles.searchContainer}
          collapsable={false}
        >
          <View style={[
            styles.searchInputWrapper, 
            isSearchFocused && styles.searchInputFocused
          ]}>
            <Ionicons 
              name="search" 
              size={22} 
              color={isSearchFocused ? "#000" : "#999"} 
              style={styles.searchIcon} 
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar marca de lujo..."
              placeholderTextColor="#aaa"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={clearSearch} 
                style={styles.clearButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={22} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          {searchQuery.trim() !== "" && (
            <View style={styles.searchResults}>
              {filteredBrands.length > 0 ? (
                <View style={styles.brandGrid}>
                  {filteredBrands.map((brand, index) => (
                    <AnimatedBrandCard
                      key={brand.id}
                      item={brand}
                      index={index}
                      onPress={() => {
                        goToMarca(brand);
                        setSearchQuery("");
                      }}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="search-outline" size={56} color="#ddd" />
                  <Text style={styles.noResultsText}>Marca no encontrada</Text>
                  <Text style={styles.noResultsSubtext}>
                    Prueba con otro nombre o revisa la ortografía
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* SECCIONES MUJERES/HOMBRES */}
        <View style={styles.sectionWrapper}>
          <TouchableOpacity 
            style={styles.fullSection} 
            onPress={goToMujeres}
            activeOpacity={0.95}
          >
            <Image
              source={{ uri: "https://www.xtrafondos.com/wallpapers/ana-de-armas-l-officiel-usa-10888.jpg" }}
              style={styles.fullImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'transparent', 'rgba(0,0,0,0.85)']}
              style={styles.sectionGradient}
            />
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>MUJERES</Text>
              <View style={styles.overlayDivider} />
              <Text style={styles.overlayButton}>EXPLORAR COLECCIÓN</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionSpacer} />

        <View style={styles.sectionWrapper}>
          <TouchableOpacity 
            style={styles.fullSection} 
            onPress={goToHombres}
            activeOpacity={0.95}
          >
            <Image
              source={{ uri: "https://agenciapura.com/wp-content/uploads/2025/02/german-gomez-768x1152.webp" }}
              style={styles.fullImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'transparent', 'rgba(0,0,0,0.85)']}
              style={styles.sectionGradient}
            />
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>HOMBRES</Text>
              <View style={styles.overlayDivider} />
              <Text style={styles.overlayButton}>EXPLORAR COLECCIÓN</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* SELECCIÓN EXCLUSIVA */}
        <View style={styles.recoContainer}>
          <View style={styles.recoHeader}>
            <Text style={styles.recoTitle}>SELECCIÓN EXCLUSIVA</Text>
            <View style={styles.recoSeparator} />
            <Text style={styles.recoSubtitle}>Curado especialmente para ti</Text>
          </View>
          
          <FlatList
            data={recomendados}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ 
              paddingHorizontal: 20,
              paddingBottom: 20
            }}
            snapToInterval={170}
            decelerationRate="fast"
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
      </Animated.ScrollView>

      {/* MODAL */}
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
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                activeOpacity={0.7}
              >
                <View style={styles.backArrowContainer}>
                  <Ionicons name="close" size={24} color="#fff" />
                </View>
              </TouchableOpacity>

              <FlatList
                ref={modalFlatListRef}
                data={recomendados}
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
            if (routeName === "index") router.back();
            else router.push(`/(tabs)/${routeName.replace("/index", "")}`);
          },
          emit: () => ({ defaultPrevented: false }),
        }}
      />
    </View>
  );
}

// ✨ ESTILOS COMPLETOS
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff" 
  },

  // ✅ HEADER BLANCO FIJO
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 140 : 120,
    backgroundColor: '#fff',
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 5,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  headerLogo: {
    width: 80,
    height: 70,
    marginLeft: -10,
  },
  headerSpacer: {
    flex: 1,
  },

  // HERO SECTION
  heroSection: { 
    width: "100%", 
    height: height * 0.60,
    marginTop: Platform.OS === 'ios' ? 145 : 120, // ← Espacio para el header
  },
  heroSlide: { 
    width, 
    height: "100%", 
    justifyContent: 'flex-end', 
    alignItems: 'center' 
  },
  heroImage: { 
    width, 
    height: "100%", 
    position: 'absolute' 
  },
  heroGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  carouselTextContainer: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  carouselText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 15,
    marginBottom: 8,
  },
  carouselSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontFamily: 'PlayfairDisplay_400Regular',
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  playPauseButton: {
    position: "absolute",
    bottom: 18,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 24,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  // BUSCADOR
  searchContainer: {
    marginHorizontal: 20,
    marginTop: 35,
    marginBottom: 45,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 14,
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
    fontSize: 15,
    fontFamily: "PlayfairDisplay_400Regular",
    color: "#000",
    letterSpacing: 0.3,
  },
  clearButton: {
    padding: 4,
  },
  searchResults: {
    marginTop: 25,
  },
  brandGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  brandLogoWrapper: {
    width: (width - 60) / 2,
    marginBottom: 18,
  },
  brandCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  brandLogoContainer: {
    width: '100%',
    height: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandLogo: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 12,
    color: "#111",
    textAlign: "center",
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  noResultsText: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 20,
    color: "#555",
    marginTop: 20,
    letterSpacing: 0.3,
  },
  noResultsSubtext: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 14,
    color: "#999",
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },

  // SECCIONES
  sectionWrapper: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
    marginVertical: 18,
  },
  fullSection: {
    width: "100%",
    height: height * 0.60,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
  sectionGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  sectionSpacer: {
    height: 30,
    backgroundColor: "#fff",
  },
  overlay: { 
    position: "absolute", 
    bottom: 40, 
    left: 30 
  },
  overlayTitle: {
    color: "#fff",
    fontSize: 28,
    fontFamily: "PlayfairDisplay_700Bold",
    letterSpacing: 3,
    fontWeight: "700",
    marginBottom: 8,
  },
  overlayDivider: {
    width: 50,
    height: 2,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  overlayButton: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "PlayfairDisplay_600SemiBold",
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // RECOMENDADOS
  recoContainer: {
    marginTop: 70,
    marginBottom: 180,
    paddingTop: 20,
  },
  recoHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  recoTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 24,
    textAlign: "center",
    color: "#111",
    letterSpacing: 2,
    marginBottom: 15,
  },
  recoSeparator: {
    width: 80,
    height: 3,
    backgroundColor: "#000",
    marginBottom: 12,
  },
  recoSubtitle: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 13,
    color: "#666",
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // TARJETAS
  card: {
    width: 165,
    height: 340,
    marginRight: 15,
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
  recoImage: { 
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
  cardContent: {
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

  // MODAL
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
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
  modalTextBoxFull: {
    height: height * 0.52,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 25,
    paddingTop: 28,
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
    minHeight: 56,
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

  // TOAST
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

  // SKELETON
  skeletonContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  skeletonHero: {
    width: "100%",
    height: height * 0.75,
    backgroundColor: "#f0f0f0",
    overflow: "hidden",
  },
  skeletonContent: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 30,
    gap: 15,
  },
  skeletonCard: {
    width: 165,
    height: 280,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    overflow: "hidden",
  },
  shimmer: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.5)",
  },
});
