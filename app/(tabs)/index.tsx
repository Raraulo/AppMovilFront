// app/(tabs)/index.tsx
import { Ionicons } from "@expo/vector-icons";
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
  PanResponder,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FancyTabBar } from "../(tabs)/_layout";
import { useApi } from "../../contexts/ApiContext";
import {
  addToCart,
  addToFavorites,
  getCart,
  getFavorites,
  removeFromFavorites
} from "../../utils/storage";

const { height, width } = Dimensions.get("window");
const HEADER_HEIGHT = Platform.OS === 'ios' ? 150 : 120;

const CARD_WIDTH_CAROUSEL = (width - 48) / 2.5;
const CARD_WIDTH = (width - 60) / 2;
const CARD_SPACING = 12;

// ✅ CONFIGURACIÓN DEL MODAL
const MODAL_TOP_MARGIN = Platform.OS === 'ios' ? 45: 35;
const MODAL_IMAGE_HEIGHT = height * 0.50;
const FOOTER_PADDING_BOTTOM = Platform.OS === 'ios' ? 90 : 70;

const FONT_TITLE = Platform.OS === 'ios' ? 'Didot' : 'serif';
const FONT_BODY = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const FONT_MODERN = Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif';

// ✅ SKELETON SIMPLIFICADO Y SEGURO
const SkeletonShimmer = ({ width: w, height: h, borderRadius = 0, style = {} }: any) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: w,
          height: h,
          backgroundColor: '#f0f0f0',
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

const HeroSkeleton = () => (
  <View style={styles.hero}>
    <SkeletonShimmer width={width} height={height * 0.58} />
  </View>
);

const ProductCardSkeleton = () => (
  <View style={[styles.productCard, { width: CARD_WIDTH, marginBottom: 32 }]}>
    <SkeletonShimmer width={CARD_WIDTH} height={CARD_WIDTH * 1.3} borderRadius={14} />
    <View style={{ padding: 16 }}>
      <SkeletonShimmer width={80} height={10} borderRadius={4} style={{ marginBottom: 8 }} />
      <SkeletonShimmer width={CARD_WIDTH - 40} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
      <SkeletonShimmer width={CARD_WIDTH - 60} height={14} borderRadius={4} style={{ marginBottom: 12 }} />
      <SkeletonShimmer width={60} height={18} borderRadius={4} />
    </View>
  </View>
);

const BannerSkeleton = () => (
  <View style={styles.banner}>
    <SkeletonShimmer width="100%" height={height * 0.55} />
  </View>
);

const LoadingSkeleton = () => (
  <View style={{ flex: 1, backgroundColor: '#fff' }}>
    <HeroSkeleton />
    
    <View style={styles.section}>
      <SkeletonShimmer width={200} height={24} borderRadius={4} style={{ alignSelf: 'center', marginBottom: 12 }} />
      <SkeletonShimmer width={55} height={1} style={{ alignSelf: 'center', marginBottom: 12 }} />
      <SkeletonShimmer width={180} height={16} borderRadius={4} style={{ alignSelf: 'center', marginBottom: 26 }} />
      
      <View style={styles.grid}>
        <ProductCardSkeleton />
        <ProductCardSkeleton />
        <ProductCardSkeleton />
        <ProductCardSkeleton />
      </View>
    </View>

    <View style={styles.bannersSection}>
      <BannerSkeleton />
      <View style={styles.bannerSpacer} />
      <BannerSkeleton />
    </View>
  </View>
);

const Toast = ({ visible, message, type = "success", onHide }: any) => {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -50) {
          Animated.parallel([
            Animated.timing(translateY, { toValue: -120, duration: 180, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
          ]).start(onHide);
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 6 }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 7, tension: 100 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -120, duration: 250, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        ]).start(onHide);
      }, 2800);
    }
  }, [visible]);

  if (!visible) return null;

  const bgColor = type === "error" ? "#DC2626" : type === "warning" ? "#F59E0B" : "#000";
  const icon = type === "error" ? "close-circle" : type === "warning" ? "alert-circle" : "checkmark-circle";

  return (
    <Animated.View 
      {...panResponder.panHandlers}
      style={[
        styles.toast, 
        { 
          backgroundColor: bgColor, 
          transform: [{ translateY }], 
          opacity,
          zIndex: 99999
        }
      ]}
    >
      <Ionicons name={icon} size={24} color="#fff" />
      <Text style={styles.toastText}>{message}</Text>
      <View style={styles.toastSwipeIndicator} />
    </Animated.View>
  );
};

const SectionDivider = () => (
  <View style={styles.sectionDivider}>
    <View style={styles.dividerLine} />
  </View>
);

const BrandCard = ({ item, onPress }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity 
        onPress={onPress} 
        style={styles.brandCard} 
        activeOpacity={0.8}
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, friction: 4 }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 4 }).start()}
      >
        <View style={styles.brandImgBox}>
          <Image source={{ uri: item.logo }} style={styles.brandImg} resizeMode="contain" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const EmptySearchState = () => (
  <View style={styles.emptyState}>
    <Ionicons name="flask-outline" size={64} color="#ccc" />
    <Text style={styles.emptyTitle}>Marca no encontrada</Text>
    <Text style={styles.emptySubtitle}>Mantente informado de nuestras nuevas marcas</Text>
  </View>
);

const ProductCardGrid = ({ item, onPress, onToggleFavorite, isFavorite }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 5 }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5 }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1} style={[styles.productCard, { width: CARD_WIDTH }]}>
        <View style={[styles.productImgBox, { height: CARD_WIDTH * 1.3 }]}>
          <Image source={{ uri: item.url_imagen }} style={styles.productImg} resizeMode="contain" />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.05)']} style={StyleSheet.absoluteFill} />
          
          {item.stock === 0 && (
            <View style={styles.soldOut}>
              <Text style={styles.soldOutText}>AGOTADO</Text>
            </View>
          )}

          <TouchableOpacity style={styles.favBtn} onPress={onToggleFavorite} activeOpacity={0.7}>
            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={19} color={isFavorite ? "#DC2626" : "#1a1a1a"} />
          </TouchableOpacity>
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productBrand} numberOfLines={1}>{item.marca_nombre}</Text>
          <Text style={styles.productName} numberOfLines={2}>{item.nombre}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>${item.precio}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ProductCardCarousel = ({ item, onPress, onToggleFavorite, isFavorite }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 5 }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5 }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1} style={styles.productCardCarousel}>
        <View style={styles.productImgBoxCarousel}>
          <Image source={{ uri: item.url_imagen }} style={styles.productImg} resizeMode="cover" />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.05)']} style={StyleSheet.absoluteFill} />
          
          {item.stock === 0 && (
            <View style={styles.soldOut}>
              <Text style={styles.soldOutText}>AGOTADO</Text>
            </View>
          )}

          <TouchableOpacity style={styles.favBtn} onPress={onToggleFavorite} activeOpacity={0.7}>
            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={19} color={isFavorite ? "#DC2626" : "#1a1a1a"} />
          </TouchableOpacity>
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productBrand} numberOfLines={1}>{item.marca_nombre}</Text>
          <Text style={styles.productName} numberOfLines={2}>{item.nombre}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>${item.precio}</Text>
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
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recomendados, setRecomendados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredBrands, setFilteredBrands] = useState(brands);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'carousel'>('carousel');

  const menuSlideAnim = useRef(new Animated.Value(-width)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const flatListRef = useRef<FlatList>(null);
  const modalFlatListRef = useRef<FlatList>(null);

  const tipoEquivalencias: Record<number, string> = {
    1: "Perfume", 2: "Eau de Parfum", 3: "Eau de Toilette", 4: "Eau de Cologne", 5: "Eau Fraîche",
  };

  const toggleMenu = () => {
    if (isMenuOpen) {
      Animated.timing(menuSlideAnim, { 
        toValue: -width, 
        duration: 450,
        useNativeDriver: true, 
        easing: Easing.bezier(0.4, 0.0, 0.2, 1)
      }).start(() => setIsMenuOpen(false));
    } else {
      setIsMenuOpen(true);
      Animated.timing(menuSlideAnim, { 
        toValue: 0, 
        duration: 500,
        useNativeDriver: true, 
        easing: Easing.bezier(0.0, 0.0, 0.2, 1)
      }).start();
    }
  };

  const showToast = (message: string, type = "success") => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') Vibration.vibrate(type === "error" ? [0, 80, 40, 80] : [0, 40, 20]);
    setToast({ visible: true, message, type });
  };

  const goToMujeres = () => router.push("../mujeres");
  const goToHombres = () => router.push("../hombres");
  const goToMarca = (brand: any) => router.push({ pathname: `../marcas/${brand.name}`, params: { marcaId: brand.id } });

  const carouselImages = [
    { uri: "https://editorialtelevisa.brightspotcdn.com/dims4/default/7759517/2147483647/strip/false/crop/1280x883+0+0/resize/1280x883!/quality/90/?url=https%3A%2F%2Fk2-prod-editorial-televisa.s3.us-east-1.amazonaws.com%2Fbrightspot%2Fwp-content%2Fuploads%2F2021%2F02%2Fperfumes-para-parejas-paco-rabbane-build-love.jpg", text: "Exclusivo por naturaleza.", subtitle: "Descubre tu esencia" },
    { uri: "https://wallpapers.com/images/hd/pink-bloom-perfume-gucci-4k-jncnu583h0ou7083.jpg", text: "Tu sello olfativo.", subtitle: "Sofisticación única" },
    { uri: "https://images.ecestaticos.com/1FCAH4Eh_3M1B3TDYA81fXMvcmU=/38x7:2049x1515/1200x899/filters:fill(white):format(jpg)/f.elconfidencial.com%2Foriginal%2Fac0%2F34f%2F50e%2Fac034f50ed80fc6a5042fab968d68372.jpg", text: "Más que perfume, presencia.", subtitle: "Elegancia atemporal" },
  ];

  useEffect(() => {
    if (searchQuery.trim() === "") setFilteredBrands([]);
    else setFilteredBrands(brands.filter(b => b.name.toLowerCase().replace(/-/g, ' ').includes(searchQuery.toLowerCase())));
  }, [searchQuery]);

  useEffect(() => {
    const interval = setInterval(() => {
      const next = (currentIndex + 1) % carouselImages.length;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
    }, 4500);
    return () => clearInterval(interval);
  }, [currentIndex]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        const [resProd, resMarcas] = await Promise.all([fetch(`${apiUrl}/api/productos/`), fetch(`${apiUrl}/api/marcas/`)]);
        const productos = await resProd.json();
        const marcas = await resMarcas.json();
        const marcaMap: Record<number, string> = {};
        marcas.forEach((m: any) => (marcaMap[m.id] = m.nombre));
        const dataMap = productos.map((p: any) => ({ ...p, marca_nombre: marcaMap[p.marca] || "Maison Parfum" }));
        setRecomendados(dataMap.filter((p: any) => p.stock >= 11).sort(() => 0.5 - Math.random()).slice(0, 10));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    const loadStorage = async () => {
      setFavoritos(await getFavorites());
      setCartCount((await getCart()).length);
    };
    if (apiUrl) { fetchData(); loadStorage(); }
  }, [apiUrl]);

  const toggleFavorite = async (item: any) => {
    const isFav = favoritos.some(f => f.id === item.id);
    const updated = isFav ? await removeFromFavorites(item.id) : await addToFavorites(item);
    setFavoritos(updated);
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 0.8, duration: 80, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1.15, useNativeDriver: true, friction: 3, tension: 100 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
  };

  const isFavorite = (id: number) => favoritos.some(f => f.id === id);
  const openModal = (index: number) => { 
    setSelectedIndex(index); 
    setIsModalVisible(true); 
    setExpandedDesc(false); 
    setTimeout(() => modalFlatListRef.current?.scrollToIndex({ index, animated: false }), 50);
  };
  const closeModal = () => { setIsModalVisible(false); };

  const handleAddToCart = async (item: any) => {
    if (item.stock === 0) { 
      showToast("Sin stock disponible", "error"); 
      return; 
    }
    
    try {
      const cart = await getCart();
      const exists = cart.find((i: any) => i.id === item.id);
      
      if (exists) { 
        showToast("Este producto ya está en el cesto", "warning"); 
      } else { 
        await addToCart(item); 
        setCartCount(prev => prev + 1); 
        showToast("Añadido al cesto", "success"); 
      }
    } catch { 
      showToast("Error al añadir", "error"); 
    }
  };

  const renderModalItem = ({ item }: any) => {
    const descText = item.descripcion || "Sin descripción disponible.";
    const descLines = descText.split('\n').length;
    const needsExpand = descLines > 3 || descText.length > 220;

    return (
      <View style={{ width, height, backgroundColor: '#fff' }}>
        <View style={styles.modalImageFixed}>
          <Image source={{ uri: item.url_imagen }} style={styles.modalImage} resizeMode="cover" />
          <LinearGradient colors={['rgba(0,0,0,0.1)', 'transparent', 'rgba(0,0,0,0.4)']} style={StyleSheet.absoluteFill} />
          
          {item.stock === 0 && (
            <View style={styles.modalSoldOut}>
              <Text style={styles.modalSoldOutText}>AGOTADO</Text>
            </View>
          )}

          <TouchableOpacity style={styles.modalFav} onPress={() => toggleFavorite(item)} activeOpacity={0.7}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons name={isFavorite(item.id) ? "heart" : "heart-outline"} size={26} color={isFavorite(item.id) ? "#DC2626" : "#fff"} />
            </Animated.View>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalScrollContent}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={styles.modalBrand}>{item.marca_nombre}</Text>
                <Text style={styles.modalTitle} numberOfLines={3}>{item.nombre}</Text>
              </View>
              <View style={styles.modalPriceBox}>
                <Text style={styles.modalPrice}>${item.precio}</Text>
              </View>
            </View>

            <View style={styles.modalDivider} />

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionLabel}>Descripción</Text>
              <Text style={styles.modalDesc} numberOfLines={expandedDesc ? undefined : 4}>
                {descText}
              </Text>
              {needsExpand && (
                <TouchableOpacity onPress={() => setExpandedDesc(!expandedDesc)} activeOpacity={0.7} style={{ marginTop: 8 }}>
                  <Text style={styles.readMore}>
                    {expandedDesc ? "Leer menos" : "Leer más"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionLabel}>Detalles</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoBox}>
                  <Ionicons name="water-outline" size={22} color="#1a1a1a" />
                  <Text style={styles.infoLabel}>Tipo</Text>
                  <Text style={styles.infoValue}>{tipoEquivalencias[item.tipo] || "N/A"}</Text>
                </View>
                <View style={styles.infoBox}>
                  <Ionicons name="cube-outline" size={22} color="#1a1a1a" />
                  <Text style={styles.infoLabel}>Stock</Text>
                  <Text style={styles.infoValue}>{item.stock} unidades</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.brandLinkButton} 
              onPress={() => { 
                closeModal(); 
                const brand = brands.find(b => b.name.toLowerCase().includes(item.marca_nombre.toLowerCase().split(' ')[0]));
                if (brand) goToMarca(brand);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.brandLinkText}>Ver toda la colección {item.marca_nombre}</Text>
              <Ionicons name="arrow-forward" size={20} color="#1a1a1a" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom, 24) + 20 }]}>
          <TouchableOpacity
            style={[styles.addBtn, item.stock === 0 && styles.addBtnDisabled]}
            onPress={() => handleAddToCart(item)}
            disabled={item.stock === 0}
            activeOpacity={0.85}
          >
            <Ionicons name="bag-handle-outline" size={24} color={item.stock === 0 ? "#999" : "#fff"} />
            <Text style={[styles.addBtnText, item.stock === 0 && { color: "#999" }]}>
              {item.stock === 0 ? "SIN STOCK" : "AÑADIR AL CESTO"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      
      <View style={styles.header}>
        <Image source={require("../../assets/images/logomaison.png")} style={styles.logo} resizeMode="contain" />
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={toggleMenu} style={styles.menuBtn} activeOpacity={0.7}>
          <Ionicons name="menu-outline" size={30} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <LoadingSkeleton />
      </ScrollView>

      <FancyTabBar cartCount={0} state={{ index: 0, routes: [{ key: "index", name: "index" }, { key: "favoritos/index", name: "favoritos/index" }, { key: "carrito/index", name: "carrito/index" }, { key: "top", name: "top" }, { key: "profile", name: "profile" }] }} descriptors={{}} navigation={{ navigate: (n: string) => n === "index" ? router.back() : router.push(`/(tabs)/${n.replace("/index", "")}`), emit: () => ({ defaultPrevented: false }) }} />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />

      <View style={styles.header}>
        <Image source={require("../../assets/images/logomaison.png")} style={styles.logo} resizeMode="contain" />
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={toggleMenu} style={styles.menuBtn} activeOpacity={0.7}>
          <Ionicons name="menu-outline" size={30} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollViewRef as any} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} tintColor="#1a1a1a" />} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <FlatList
            ref={flatListRef}
            data={carouselImages}
            horizontal
            pagingEnabled
            onMomentumScrollEnd={(e) => setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <View style={styles.heroSlide}>
                <Image source={{ uri: item.uri }} style={styles.heroImg} resizeMode="cover" />
                <LinearGradient colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.85)']} style={StyleSheet.absoluteFill} />
                <View style={styles.heroText}>
                  <Text style={styles.heroTitle}>{item.text}</Text>
                  <View style={styles.heroLine} />
                  <Text style={styles.heroSub}>{item.subtitle}</Text>
                </View>
              </View>
            )}
          />
        </View>

        <SectionDivider />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SELECCIÓN EXCLUSIVA</Text>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionSub}>Revisa alguno de nuestros productos</Text>
          
          <View style={styles.viewToggleWrapper}>
            <Text style={styles.viewLabel}>Ver como</Text>
            <View style={styles.viewToggle}>
              <TouchableOpacity 
                style={[styles.toggleBtn, viewMode === 'grid' && styles.toggleBtnActive]} 
                onPress={() => setViewMode('grid')}
                activeOpacity={0.8}
              >
                <Ionicons name="grid-outline" size={24} color="#1a1a1a" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleBtn, viewMode === 'carousel' && styles.toggleBtnActive]} 
                onPress={() => setViewMode('carousel')}
                activeOpacity={0.8}
              >
                <View style={{ transform: [{ rotate: '90deg' }] }}>
                  <Ionicons name="albums-outline" size={24} color="#1a1a1a" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
          
          {viewMode === 'grid' ? (
            <View style={styles.grid}>
              {recomendados.map((item, index) => (
                <ProductCardGrid
                  key={item.id}
                  item={item}
                  onPress={() => openModal(index)}
                  onToggleFavorite={() => toggleFavorite(item)}
                  isFavorite={isFavorite(item.id)}
                />
              ))}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ 
                paddingLeft: 2, 
                paddingRight: 20, 
                paddingBottom: 20 
              }}
            >
              {recomendados.map((item, index) => (
                <View key={item.id} style={{ marginRight: CARD_SPACING }}>
                  <ProductCardCarousel
                    item={item}
                    onPress={() => openModal(index)}
                    onToggleFavorite={() => toggleFavorite(item)}
                    isFavorite={isFavorite(item.id)}
                  />
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <SectionDivider />

        <View style={styles.bannersSection}>
          <TouchableOpacity style={styles.banner} onPress={goToMujeres} activeOpacity={0.93}>
            <Image source={{ uri: "https://pbs.twimg.com/media/F1Z1ChsXgAAA_Nb.jpg" }} style={styles.bannerImg} resizeMode="cover" />
            <LinearGradient colors={['transparent', 'transparent', 'rgba(0,0,0,0.88)']} style={StyleSheet.absoluteFill} />
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>MUJERES</Text>
              <View style={styles.bannerLine} />
              <Text style={styles.bannerBtn}>EXPLORAR COLECCIÓN →</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.bannerSpacer} />

          <TouchableOpacity style={styles.banner} onPress={goToHombres} activeOpacity={0.93}>
            <Image source={{ uri: "https://agenciapura.com/wp-content/uploads/2025/02/german-gomez-768x1152.webp" }} style={styles.bannerImg} resizeMode="cover" />
            <LinearGradient colors={['transparent', 'transparent', 'rgba(0,0,0,0.88)']} style={StyleSheet.absoluteFill} />
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>HOMBRES</Text>
              <View style={styles.bannerLine} />
              <Text style={styles.bannerBtn}>EXPLORAR COLECCIÓN →</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {isMenuOpen && (
        <View style={styles.menuBackdrop} pointerEvents="box-none">
          <Animated.View 
            style={[styles.menu, { transform: [{ translateX: menuSlideAnim }] }]}
            pointerEvents="box-none"
          >
            <View style={styles.menuHeader}>
              <Image source={require("../../assets/images/logomaison.png")} style={styles.menuLogo} resizeMode="contain" />
              <TouchableOpacity onPress={toggleMenu} activeOpacity={0.7}>
                <Ionicons name="close" size={30} color="#1a1a1a" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
              <Ionicons name="search" size={22} color="#666" style={{ marginRight: 12 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar marca de lujo..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 70 }}>
              {searchQuery.trim() !== "" && filteredBrands.length === 0 ? (
                <EmptySearchState />
              ) : (
                <View style={styles.brandsGrid}>
                  {(searchQuery.trim() !== "" ? filteredBrands : brands).map(brand => (
                    <BrandCard key={brand.id} item={brand} onPress={() => { goToMarca(brand); toggleMenu(); setSearchQuery(""); }} />
                  ))}
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      )}

      {isModalVisible && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
            
            <TouchableOpacity style={[styles.closeBtn, { top: MODAL_TOP_MARGIN + 5 }]} onPress={closeModal} activeOpacity={0.8}>
              <View style={styles.closeBtnInner}>
                <Ionicons name="close" size={28} color="#1a1a1a" />
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
              initialScrollIndex={selectedIndex}
              getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
            />
          </View>
        </Modal>
      )}

      <FancyTabBar cartCount={cartCount} state={{ index: 0, routes: [{ key: "index", name: "index" }, { key: "favoritos/index", name: "favoritos/index" }, { key: "carrito/index", name: "carrito/index" }, { key: "top", name: "top" }, { key: "profile", name: "profile" }] }} descriptors={{}} navigation={{ navigate: (n: string) => n === "index" ? router.back() : router.push(`/(tabs)/${n.replace("/index", "")}`), emit: () => ({ defaultPrevented: false }) }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  
  header: { position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_HEIGHT, backgroundColor: '#fff', zIndex: 100, flexDirection: 'row', alignItems: 'flex-end', paddingBottom: 14, paddingHorizontal: 22, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 5 },
  logo: { width: 60, height: 60 },
  menuBtn: { padding: 10 },

  hero: { width: "100%", height: height * 0.58, marginTop: HEADER_HEIGHT },
  heroSlide: { width, height: "100%", justifyContent: 'center', alignItems: 'center' },
  heroImg: { width, height: "100%", position: 'absolute' },
  heroText: { alignItems: 'center', paddingHorizontal: 45 },
  heroTitle: { color: "#fff", fontSize: 38, letterSpacing: 0.8, marginBottom: 12, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.7)', textShadowRadius: 15, fontFamily: FONT_TITLE, fontWeight: '400' },
  heroLine: { width: 60, height: 1, backgroundColor: '#fff', marginBottom: 12, opacity: 0.8 },
  heroSub: { color: "rgba(255,255,255,0.95)", fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', textAlign: 'center', fontFamily: FONT_MODERN, fontWeight: '500' },

  sectionDivider: { paddingVertical: 0, alignItems: 'center' },
  dividerLine: { width: 80, height: 1, backgroundColor: '#f0f0f0' },

  section: { paddingVertical: 35, paddingBottom: 50, paddingHorizontal: 22, backgroundColor: '#fff' },
  sectionTitle: { fontSize: 24, textAlign: 'center', color: '#1a1a1a', letterSpacing: 1.5, fontFamily: FONT_TITLE, fontWeight: '400' },
  sectionLine: { width: 55, height: 1, backgroundColor: '#1a1a1a', alignSelf: 'center', marginVertical: 12 },
  sectionSub: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 26, fontFamily: FONT_BODY, fontWeight: '500', letterSpacing: 0.5 },
  
  viewToggleWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 12, marginBottom: 28 },
  viewLabel: { fontSize: 14, color: '#1a1a1a', fontFamily: FONT_MODERN, fontWeight: '600', letterSpacing: 0.5 },
  viewToggle: { flexDirection: 'row', gap: 10 },
  toggleBtn: { padding: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderRadius: 0 },
  toggleBtnActive: { backgroundColor: 'transparent' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  productCard: { marginBottom: 32, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 6, borderWidth: 1, borderColor: '#f5f5f5' },
  productImgBox: { width: '100%', position: 'relative' },
  productImg: { width: '100%', height: '100%' },
  soldOut: { position: 'absolute', top: '45%', left: 0, right: 0, backgroundColor: '#DC2626', paddingVertical: 12, alignItems: 'center' },
  soldOutText: { color: '#fff', fontSize: 10, letterSpacing: 2.5, fontFamily: FONT_MODERN, fontWeight: '700' },
  favBtn: { position: 'absolute', top: 14, right: 14, backgroundColor: 'rgba(255,255,255,0.95)', padding: 8, borderRadius: 22, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6 },
  productInfo: { padding: 16 },
  productBrand: { fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6, fontFamily: FONT_MODERN, fontWeight: '700' },
  productName: { fontSize: 13, color: '#1a1a1a', lineHeight: 18, marginBottom: 12, height: 36, fontFamily: FONT_BODY, fontWeight: '400' },
  priceContainer: { alignItems: 'flex-start' },
  productPrice: { fontSize: 17, color: '#1a1a1a', fontFamily: FONT_TITLE, fontWeight: '600' },

  productCardCarousel: { 
    width: CARD_WIDTH_CAROUSEL, 
    backgroundColor: '#fff', 
    borderRadius: 14, 
    overflow: 'hidden', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 12, 
    elevation: 6, 
    borderWidth: 1, 
    borderColor: '#f5f5f5' 
  },
  productImgBoxCarousel: { width: '100%', height: CARD_WIDTH_CAROUSEL * 1.3, position: 'relative' },

  bannersSection: { paddingBottom: 100, paddingHorizontal: 30 },
  banner: { width: '100%', height: height * 0.65, position: 'relative', borderRadius: 0, overflow: 'hidden' },
  bannerSpacer: { height: 20 },
  bannerImg: { width: '100%', height: '100%' },
  bannerContent: { position: 'absolute', bottom: 45, left: 32 },
  bannerTitle: { color: '#fff', fontSize: 34, letterSpacing: 3, marginBottom: 12, fontFamily: FONT_TITLE, fontWeight: '400' },
  bannerLine: { width: 45, height: 1.5, backgroundColor: '#fff', marginBottom: 14, opacity: 0.9 },
  bannerBtn: { color: '#fff', fontSize: 11, letterSpacing: 2.5, fontFamily: FONT_MODERN, fontWeight: '700' },

  menuBackdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 999 },
  menu: { width: width * 0.88, height: '100%', backgroundColor: '#fff', paddingTop: 58, paddingHorizontal: 24 },
  menuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  menuLogo: { width: 78, height: 62 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f8f8', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14, marginBottom: 28, borderWidth: 1, borderColor: '#f0f0f0' },
  searchInput: { flex: 1, fontSize: 15, color: '#1a1a1a', fontFamily: FONT_BODY },
  brandsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 2 },
  brandCard: { width: (width * 0.88 - 68) / 2, aspectRatio: 1.15, backgroundColor: '#fff', borderRadius: 16, marginBottom: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 5, borderWidth: 1, borderColor: '#f5f5f5' },
  brandImgBox: { width: '70%', height: '70%', justifyContent: 'center', alignItems: 'center' },
  brandImg: { width: '100%', height: '100%' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 18, color: '#1a1a1a', marginTop: 20, marginBottom: 10, fontFamily: FONT_TITLE, fontWeight: '600', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#999', fontFamily: FONT_BODY, textAlign: 'center', lineHeight: 22 },

  modalBackdrop: { flex: 1, backgroundColor: '#fff' },
  closeBtn: { position: 'absolute', right: 22, zIndex: 10 },
  closeBtnInner: { backgroundColor: '#fff', borderRadius: 24, padding: 11, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, elevation: 8, borderWidth: 1, borderColor: '#f0f0f0' },
  
  modalImageFixed: { 
    position: 'absolute', 
    top: MODAL_TOP_MARGIN, 
    left: 0, 
    right: 0, 
    height: MODAL_IMAGE_HEIGHT, 
    zIndex: 1,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden'
  },
  modalImage: { width: '100%', height: '100%' },
  modalSoldOut: { position: 'absolute', top: '45%', left: 0, right: 0, backgroundColor: '#DC2626', paddingVertical: 14, alignItems: 'center' },
  modalSoldOutText: { color: '#fff', fontSize: 11, letterSpacing: 3, fontFamily: FONT_MODERN, fontWeight: '700' },
  modalFav: { position: 'absolute', bottom: 18, right: 18, backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 28, padding: 12, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12 },
  
  modalScrollContent: { marginTop: MODAL_TOP_MARGIN + MODAL_IMAGE_HEIGHT },
  modalContent: { padding: 28, paddingTop: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  modalBrand: { fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 1.8, marginBottom: 8, fontFamily: FONT_MODERN, fontWeight: '700' },
  modalTitle: { fontSize: 24, color: '#1a1a1a', lineHeight: 32, fontFamily: FONT_TITLE, fontWeight: '400', letterSpacing: 0.2 },
  modalPriceBox: { alignItems: 'flex-end', justifyContent: 'center' },
  modalPrice: { fontSize: 28, color: '#1a1a1a', fontFamily: FONT_TITLE, fontWeight: '600', letterSpacing: 0.5 },
  modalDivider: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 24 },
  modalSection: { marginBottom: 24 },
  modalSectionLabel: { fontSize: 12, color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14, fontFamily: FONT_MODERN, fontWeight: '700' },
  modalDesc: { fontSize: 15, color: '#555', lineHeight: 27, fontFamily: FONT_BODY, letterSpacing: 0.3 },
  readMore: { fontSize: 13, color: '#1a1a1a', fontFamily: FONT_MODERN, fontWeight: '700', letterSpacing: 0.5, textDecorationLine: 'underline' },
  infoGrid: { flexDirection: 'row', gap: 16 },
  infoBox: { flex: 1, backgroundColor: '#fafafa', borderRadius: 12, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#f0f0f0' },
  infoLabel: { fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 10, marginBottom: 4, fontFamily: FONT_MODERN, fontWeight: '700' },
  infoValue: { fontSize: 13, color: '#1a1a1a', fontFamily: FONT_BODY, fontWeight: '600', textAlign: 'center' },
  brandLinkButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fafafa', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#f0f0f0', marginTop: 4 },
  brandLinkText: { fontSize: 14, color: '#1a1a1a', fontFamily: FONT_BODY, fontWeight: '600', letterSpacing: 0.2, flex: 1 },

  modalFooter: { 
    position: 'absolute', 
    bottom: -70, 
    left: 0, 
    right: 0, 
    backgroundColor: '#fff', 
    paddingHorizontal: 24, 
    paddingTop: 22, 
    borderTopWidth: 1, 
    borderTopColor: '#f0f0f0', 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 15, 
    zIndex: 2 
  },

  addBtn: { backgroundColor: '#1a1a1a', borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 19, gap: 12, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 14, elevation: 10 },
  addBtnDisabled: { backgroundColor: '#f0f0f0' },
  addBtnText: { color: '#fff', fontSize: 13, letterSpacing: 2.2, fontFamily: FONT_MODERN, fontWeight: '700' },

  toast: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 50, left: 20, right: 20, borderRadius: 18, zIndex: 99999, flexDirection: 'row', alignItems: 'center', padding: 20, paddingVertical: 18, gap: 14, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 20 },
  toastText: { color: '#fff', fontSize: 15, flex: 1, fontFamily: FONT_BODY, fontWeight: '600', letterSpacing: 0.3 },
  toastSwipeIndicator: { position: 'absolute', top: 8, left: '45%', width: 35, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 },
});
