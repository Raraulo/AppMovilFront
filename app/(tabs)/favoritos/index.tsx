// app/(tabs)/favoritos/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import {
  addToCart,
  getCart,
  getFavorites,
  removeFromFavorites,
  storageEvents,
} from "../../../utils/storage";
import { FancyTabBar } from "../_layout";

const { width, height } = Dimensions.get("window");
const HEADER_HEIGHT = Platform.OS === 'ios' ? 130 : 115;
const CARD_WIDTH = (width - 60) / 2;

// 🎨 TIPOGRAFÍA PREMIUM
const FONT_TITLE = Platform.OS === 'ios' ? 'Didot' : 'serif';
const FONT_BODY = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const FONT_MODERN = Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif';

// ✨ TOAST PROFESIONAL ULTRA RÁPIDO
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

  React.useEffect(() => {
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

// ✨ TARJETA GRID ULTRA RÁPIDA
const ProductCardGrid = ({ item, onPress, onToggleFavorite }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 5 }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5 }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1} style={[styles.productCard, { width: CARD_WIDTH }]}>
        <View style={[styles.productImgBox, { height: CARD_WIDTH * 1.3 }]}>
          <Image source={{ uri: item.url_imagen }} style={styles.productImg} resizeMode="cover" />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.05)']} style={StyleSheet.absoluteFill} />
          
          {item.stock === 0 && (
            <View style={styles.soldOut}>
              <Text style={styles.soldOutText}>AGOTADO</Text>
            </View>
          )}

          <TouchableOpacity style={styles.favBtn} onPress={onToggleFavorite} activeOpacity={0.7}>
            <Ionicons name="heart" size={19} color="#DC2626" />
          </TouchableOpacity>
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productBrand} numberOfLines={1}>{item.marca_nombre || "Maison Parfum"}</Text>
          <Text style={styles.productName} numberOfLines={2}>{item.nombre}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>${item.precio}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ✨ TARJETA COLUMNA ULTRA RÁPIDA
const ProductCardColumn = ({ item, onPress, onToggleFavorite }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 5 }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5 }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1} style={styles.productCardColumn}>
        <View style={styles.productImgBoxColumn}>
          <Image source={{ uri: item.url_imagen }} style={styles.productImg} resizeMode="cover" />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.05)']} style={StyleSheet.absoluteFill} />
          
          {item.stock === 0 && (
            <View style={styles.soldOut}>
              <Text style={styles.soldOutText}>AGOTADO</Text>
            </View>
          )}

          <TouchableOpacity style={styles.favBtn} onPress={onToggleFavorite} activeOpacity={0.7}>
            <Ionicons name="heart" size={19} color="#DC2626" />
          </TouchableOpacity>
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productBrand} numberOfLines={1}>{item.marca_nombre || "Maison Parfum"}</Text>
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
  { id: 2, name: "Yves-Saint-Laurent" },
  { id: 3, name: "Dolce-Gabbana" },
  { id: 4, name: "Armani" },
  { id: 5, name: "Carolina-Herrera" },
  { id: 6, name: "Jean-Paul-Gaultier" },
  { id: 7, name: "Lancome" },
  { id: 8, name: "Dior" },
  { id: 9, name: "Givenchy" },
  { id: 10, name: "Valentino" },
  { id: 11, name: "Prada" },
  { id: 12, name: "Bvlgari" },
  { id: 13, name: "Versace" },
  { id: 14, name: "Chanel" },
  { id: 15, name: "Tom-Ford" },
  { id: 16, name: "Brunello-Cucinelli" },
  { id: 17, name: "Moschino" },
];

export default function FavoritosScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'column'>('grid');
  const [expandedDesc, setExpandedDesc] = useState(false);

  const heartScale = useRef(new Animated.Value(1)).current;
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const modalFlatListRef = useRef<FlatList>(null);

  const tipoEquivalencias: Record<number, string> = {
    1: "Perfume",
    2: "Eau de Parfum",
    3: "Eau de Toilette",
    4: "Eau de Cologne",
    5: "Eau Fraîche",
  };

  const showToast = (message: string, type = "success") => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') Vibration.vibrate(type === "error" ? [0, 80, 40, 80] : [0, 40, 20]);
    setToast({ visible: true, message, type });
  };

  const goToMarca = (brand: any) => router.push({ pathname: `../../marcas/${brand.name}`, params: { marcaId: brand.id } });

  const loadFavorites = async () => {
    setLoading(true);
    const data = await getFavorites();
    setFavorites(data);
    setLoading(false);
  };

  const loadCartCount = async () => {
    const cart = await getCart();
    setCartCount(cart.length);
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
      loadCartCount();

      const handleCartChange = () => loadCartCount();
      const handleFavChange = () => loadFavorites();

      storageEvents.on("cartChanged", handleCartChange);
      storageEvents.on("favoritesChanged", handleFavChange);

      return () => {
        storageEvents.off("cartChanged", handleCartChange);
        storageEvents.off("favoritesChanged", handleFavChange);
      };
    }, [])
  );

  const handleToggleFavorite = async (id: number) => {
    try {
      await removeFromFavorites(id);
      const updated = await getFavorites();

      Animated.sequence([
        Animated.timing(heartScale, { toValue: 0.8, duration: 80, useNativeDriver: true }),
        Animated.spring(heartScale, { toValue: 1.15, useNativeDriver: true, friction: 3, tension: 100 }),
        Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, friction: 4 }),
      ]).start();

      if (updated.length === 0) {
        setFavorites([]);
        closeModal();
        return;
      }

      let newIndex = selectedIndex;
      if (selectedIndex >= updated.length) {
        newIndex = updated.length - 1;
      }

      setSelectedIndex(newIndex);
      setFavorites(updated);
    } catch {
      showToast("Error al actualizar", "error");
    }
  };

  const openModal = (index: number) => {
    setSelectedIndex(index);
    setIsModalVisible(true);
    setExpandedDesc(false);
    setTimeout(() => modalFlatListRef.current?.scrollToIndex({ index, animated: false }), 50);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

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
        setCartCount((await getCart()).length);
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

          <TouchableOpacity style={styles.modalFav} onPress={() => handleToggleFavorite(item.id)} activeOpacity={0.7}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons name="heart" size={26} color="#DC2626" />
            </Animated.View>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalScrollContent}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={styles.modalBrand}>{item.marca_nombre || "Maison Parfum"}</Text>
                <Text style={styles.modalTitle} numberOfLines={3}>{item.nombre}</Text>
              </View>
              <View style={styles.modalPriceBox}>
                <Text style={styles.modalPrice}>${item.precio}</Text>
              </View>
            </View>

            <View style={styles.modalDivider} />

            {/* ✅ DESCRIPCIÓN CON LEER MÁS */}
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

            {/* ✅ VER TODA LA COLECCIÓN */}
            <TouchableOpacity 
              style={styles.brandLinkButton} 
              onPress={() => { 
                closeModal(); 
                const brand = brands.find(b => b.name.toLowerCase().includes((item.marca_nombre || '').toLowerCase().split(' ')[0]));
                if (brand) goToMarca(brand);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.brandLinkText}>Ver toda la colección {item.marca_nombre || "Maison Parfum"}</Text>
              
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
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

  if (loading) return <View style={{ flex: 1, backgroundColor: '#fff' }} />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#ffffffff" />
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>FAVORITOS</Text>
        <View style={{ width: 40 }} />
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="heart-outline" size={80} color="#ddd" />
          </View>
          <Text style={styles.emptyTitle}>Tu lista está vacía</Text>
          <Text style={styles.emptySubtitle}>Explora nuestro catálogo y guarda tus fragancias favoritas</Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push("/(tabs)")}
            activeOpacity={0.85}
          >
            <Text style={styles.exploreButtonText}>Explorar catálogo</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, viewMode === 'grid' && styles.toggleBtnActive]}
                onPress={() => setViewMode('grid')}
                activeOpacity={0.8}
              >
                <Ionicons name="grid-outline" size={22} color={viewMode === 'grid' ? "#fff" : "#666"} />
                <Text style={[styles.toggleText, viewMode === 'grid' && styles.toggleTextActive]}>Cuadrícula</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, viewMode === 'column' && styles.toggleBtnActive]}
                onPress={() => setViewMode('column')}
                activeOpacity={0.8}
              >
                <Ionicons name="reorder-four-outline" size={22} color={viewMode === 'column' ? "#fff" : "#666"} />
                <Text style={[styles.toggleText, viewMode === 'column' && styles.toggleTextActive]}>Columna</Text>
              </TouchableOpacity>
            </View>

            {viewMode === 'grid' ? (
              <View style={styles.grid}>
                {favorites.map((item, index) => (
                  <ProductCardGrid
                    key={item.id}
                    item={item}
                    onPress={() => openModal(index)}
                    onToggleFavorite={() => handleToggleFavorite(item.id)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.columnContainer}>
                {favorites.map((item, index) => (
                  <ProductCardColumn
                    key={item.id}
                    item={item}
                    onPress={() => openModal(index)}
                    onToggleFavorite={() => handleToggleFavorite(item.id)}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {isModalVisible && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />

            <TouchableOpacity style={styles.closeBtn} onPress={closeModal} activeOpacity={0.8}>
              <View style={styles.closeBtnInner}>
                <Ionicons name="close" size={28} color="#1a1a1a" />
              </View>
            </TouchableOpacity>

            <FlatList
              ref={modalFlatListRef}
              data={favorites}
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

      <FancyTabBar
        cartCount={cartCount}
        state={{
          index: 1,
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
          navigate: (n: string) => n === "index" ? router.push("/(tabs)") : router.push(`/(tabs)/${n.replace("/index", "")}`),
          emit: () => ({ defaultPrevented: false }),
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: { position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_HEIGHT, backgroundColor: '#fff', zIndex: 100, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 14, paddingHorizontal: 22, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 5 },
  backButton: { padding: 10 },
  sectionTitle: { fontSize: 20, textAlign: 'center', color: '#1a1a1a', letterSpacing: 2, fontFamily: FONT_TITLE, fontWeight: '700' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: HEADER_HEIGHT + 60 },
  emptyIconContainer: { marginBottom: 30 },
  emptyTitle: { fontFamily: FONT_TITLE, fontSize: 28, color: '#111', marginBottom: 15, textAlign: 'center', letterSpacing: 1 },
  emptySubtitle: { fontFamily: FONT_BODY, fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  exploreButton: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#000', paddingHorizontal: 30, paddingVertical: 16, borderRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  exploreButtonText: { fontFamily: FONT_MODERN, fontSize: 14, color: '#fff', letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600' },

  section: { paddingHorizontal: 22, paddingTop: HEADER_HEIGHT + 20, paddingBottom: 100 },
  
  viewToggle: { flexDirection: 'row', gap: 14, marginBottom: 28 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'transparent', borderRadius: 12, paddingVertical: 16 },
  toggleBtnActive: { backgroundColor: '#1a1a1a' },
  toggleText: { fontSize: 13, color: '#666', fontFamily: FONT_MODERN, fontWeight: '600', letterSpacing: 0.5 },
  toggleTextActive: { color: '#fff' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  productCard: { marginBottom: 32, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 6, borderWidth: 1, borderColor: '#f5f5f5' },
  productImgBox: { width: '100%', position: 'relative' },
  productImg: { width: '100%', height: '100%' },
  soldOut: { position: 'absolute', top: '45%', left: 0, right: 0, backgroundColor: '#DC2626', paddingVertical: 12, alignItems: 'center' },
  soldOutText: { color: '#fff', fontSize: 10, letterSpacing: 2.5, fontFamily: FONT_MODERN, fontWeight: '700' },
  favBtn: { position: 'absolute', top: 14, right: 14, backgroundColor: 'rgba(255,255,255,0.95)', padding: 8, borderRadius: 22, shadowColor: '#DC2626', shadowOpacity: 0.3, shadowRadius: 6 },
  productInfo: { padding: 16 },
  productBrand: { fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6, fontFamily: FONT_MODERN, fontWeight: '700' },
  productName: { fontSize: 13, color: '#1a1a1a', lineHeight: 18, marginBottom: 12, height: 36, fontFamily: FONT_BODY, fontWeight: '400' },
  priceContainer: { alignItems: 'flex-start' },
  productPrice: { fontSize: 17, color: '#1a1a1a', fontFamily: FONT_TITLE, fontWeight: '600' },

  columnContainer: { gap: 20 },
  productCardColumn: { width: '100%', backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 6, borderWidth: 1, borderColor: '#f5f5f5', marginBottom: 20 },
  productImgBoxColumn: { width: '100%', height: width * 0.75, position: 'relative' },

  modalBackdrop: { flex: 1, backgroundColor: '#fff' },
  closeBtn: { position: 'absolute', top: 55, right: 22, zIndex: 10 },
  closeBtnInner: { backgroundColor: '#fff', borderRadius: 24, padding: 11, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, elevation: 8, borderWidth: 1, borderColor: '#f0f0f0' },
  modalImageFixed: { position: 'absolute', top: 50, left: 0, right: 0, height: height * 0.5, zIndex: 1 },
  modalImage: { width: '100%', height: '100%' },
  modalSoldOut: { position: 'absolute', top: '45%', left: 0, right: 0, backgroundColor: '#DC2626', paddingVertical: 14, alignItems: 'center' },
  modalSoldOutText: { color: '#fff', fontSize: 11, letterSpacing: 3, fontFamily: FONT_MODERN, fontWeight: '700' },
  modalFav: { position: 'absolute', bottom: 18, right: 18, backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 28, padding: 12, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12 },
  modalScrollContent: { flex: 1, marginTop: height * 0.5 + 50 },
  modalContent: { padding: 28, paddingTop: 24 },
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

  modalFooter: { position: 'absolute', bottom: -70, left: 0, right: 0, backgroundColor: '#fff', paddingHorizontal: 24, paddingTop: 22, paddingBottom: 0, borderTopWidth: 1, borderTopColor: '#f0f0f0', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15, zIndex: 2 },

  addBtn: { backgroundColor: '#1a1a1a', borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 19, gap: 12, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 14, elevation: 10, marginBottom: Platform.OS === 'ios' ? 64 : 40 },
  addBtnDisabled: { backgroundColor: '#f0f0f0' },
  addBtnText: { color: '#fff', fontSize: 13, letterSpacing: 2.2, fontFamily: FONT_MODERN, fontWeight: '700' },

  toast: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 50, left: 20, right: 20, borderRadius: 18, zIndex: 99999, flexDirection: 'row', alignItems: 'center', padding: 20, paddingVertical: 18, gap: 14, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 20 },
  toastText: { color: '#fff', fontSize: 15, flex: 1, fontFamily: FONT_BODY, fontWeight: '600', letterSpacing: 0.3 },
  toastSwipeIndicator: { position: 'absolute', top: 8, left: '45%', width: 35, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 },
});
