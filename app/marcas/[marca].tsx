// app/marcas/[marca].tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  PanResponder,
  Platform,
  RefreshControl,
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
const CARD_WIDTH = (width - 60) / 2;

// ✅ CONFIGURACIÓN DEL MODAL
const MODAL_TOP_MARGIN = Platform.OS === 'ios' ? 45: 35;
const MODAL_IMAGE_HEIGHT = height * 0.50;
const FOOTER_PADDING_BOTTOM = Platform.OS === 'ios' ? 90 : 70;

const FONT_TITLE = Platform.OS === 'ios' ? 'Didot' : 'serif';
const FONT_BODY = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const FONT_MODERN = Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif';

// TOAST
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

// ESTADO VACÍO
const EmptyState = ({ searchText, filterType, filterGender }: { searchText: string; filterType: string; filterGender: string }) => (
  <View style={styles.emptyState}>
    <Ionicons name="flask-outline" size={64} color="#ccc" />
    <Text style={styles.emptyTitle}>No se encontraron perfumes</Text>
    <Text style={styles.emptySubtitle}>
      {searchText ? `No hay resultados para "${searchText}"` : 
       filterType !== "Todos" || filterGender !== "Todos" ? 
       "No hay perfumes con estos filtros" : 
       "Mantente informado de nuestras nuevas fragancias"}
    </Text>
  </View>
);

// TARJETA GRID MEMOIZADA
const ProductCardGrid = React.memo(({ item, onPress, onToggleFavorite, isFavorite, marca }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 5 }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5 }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: CARD_WIDTH, marginBottom: 32 }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1} style={styles.productCard}>
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
          <Text style={styles.productBrand} numberOfLines={1}>{marca}</Text>
          <Text style={styles.productName} numberOfLines={2}>{item.nombre}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>${item.precio}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// TARJETA COLUMNA MEMOIZADA
const ProductCardColumn = React.memo(({ item, onPress, onToggleFavorite, isFavorite, marca }: any) => {
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
            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={19} color={isFavorite ? "#DC2626" : "#1a1a1a"} />
          </TouchableOpacity>
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productBrand} numberOfLines={1}>{marca}</Text>
          <Text style={styles.productName} numberOfLines={2}>{item.nombre}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>${item.precio}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function MarcaScreen() {
  const router = useRouter();
  const apiUrl = useApi();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { marca, marcaId, returnTo, returnToModal } = params;
  
  const [refreshing, setRefreshing] = useState(false);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState("Todos");
  const [filterGender, setFilterGender] = useState("Todos");
  const [showFilterTypeModal, setShowFilterTypeModal] = useState(false);
  const [showFilterGenderModal, setShowFilterGenderModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'column'>('grid');
  const [expandedDesc, setExpandedDesc] = useState(false);

  const heartScale = useRef(new Animated.Value(1)).current;
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const modalFlatListRef = useRef<FlatList>(null);
  const listRef = useRef<FlatList>(null);

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

  useEffect(() => {
    if (!marca || !apiUrl) return;
    
    const fetchData = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/productos/`);
        const allProducts = await res.json();
        
        const normalize = (str: string) => 
          str.replace(/-/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
        
        const marcaNormalizada = normalize(typeof marca === 'string' ? marca : String(marca));
        
        const marcaProducts = allProducts.filter((p: any) => {
          const marcaProducto = normalize(p.marca_nombre || '');
          return marcaProducto === marcaNormalizada;
        });
        
        setProductos(marcaProducts);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    const loadStorage = async () => {
      setFavoritos(await getFavorites());
      setCartCount((await getCart()).length);
    };

    fetchData();
    loadStorage();
  }, [marca, apiUrl]);

  const filteredPerfumes = useMemo(() => {
    const searchLower = searchText.toLowerCase().trim();
    
    return productos.filter((p) => {
      const matchesSearch = searchLower === "" || 
        p.nombre.toLowerCase().includes(searchLower);
      
      if (searchLower !== "") {
        return matchesSearch;
      }
      
      const matchesType = filterType === "Todos" || tipoEquivalencias[p.tipo] === filterType;
      
      const genero = (p.genero || '').toLowerCase().trim();
      let matchesGender = true;
      
      if (filterGender === "Mujeres") {
        matchesGender = genero === 'femenino' || genero === 'mujer' || genero === 'f';
      } else if (filterGender === "Hombres") {
        matchesGender = genero === 'masculino' || genero === 'hombre' || genero === 'm';
      }
      
      return matchesType && matchesGender;
    });
  }, [productos, filterType, filterGender, searchText]);

  useEffect(() => {
    if (returnToModal && filteredPerfumes.length > 0 && !loading) {
      const modalIndex = parseInt(returnToModal as string);
      if (!isNaN(modalIndex) && modalIndex >= 0 && modalIndex < filteredPerfumes.length) {
        setTimeout(() => openModal(modalIndex), 300);
      }
    }
  }, [returnToModal, loading]);

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

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const handleBack = () => {
    if (returnTo && returnToModal) {
      if (returnTo === 'mujeres') {
        router.push({
          pathname: '../mujeres',
          params: { returnToModal }
        });
      } else if (returnTo === 'favoritos') {
        router.push({
          pathname: '../(tabs)/favoritos',
          params: { returnToModal }
        });
      } else if (returnTo === 'hombres') {
        router.push({
          pathname: '../hombres',
          params: { returnToModal }
        });
      } else {
        router.back();
      }
    } else {
      router.back();
    }
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
        setCartCount(prev => prev + 1);
        showToast("Añadido al cesto", "success");
      }
    } catch {
      showToast("Error al añadir", "error");
    }
  };

  const displayMarca = typeof marca === 'string' ? marca.replace(/-/g, ' ') : marca;

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

        <FlatList
          data={[item]}
          keyExtractor={() => 'modal-content'}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          bounces={true}
          renderItem={() => (
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1, marginRight: 16 }}>
                  <Text style={styles.modalBrand}>{displayMarca}</Text>
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
            </View>
          )}
        />

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

  const renderProduct = ({ item, index }: { item: any; index: number }) => {
    if (viewMode === 'grid') {
      return (
        <ProductCardGrid
          item={item}
          marca={displayMarca}
          onPress={() => openModal(index)}
          onToggleFavorite={() => toggleFavorite(item)}
          isFavorite={isFavorite(item.id)}
        />
      );
    } else {
      return (
        <ProductCardColumn
          item={item}
          marca={displayMarca}
          onPress={() => openModal(index)}
          onToggleFavorite={() => toggleFavorite(item)}
          isFavorite={isFavorite(item.id)}
        />
      );
    }
  };

  if (loading) return <View style={{ flex: 1, backgroundColor: '#fff' }} />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Image source={require("../../assets/images/logomaison.png")} style={styles.logo} resizeMode="contain" />
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        ref={listRef}
        data={filteredPerfumes}
        key={viewMode}
        keyExtractor={(item) => item.id.toString()}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
        contentContainerStyle={styles.listContent}
        renderItem={renderProduct}
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        windowSize={7}
        initialNumToRender={8}
        ListHeaderComponent={
          <>
            <View style={styles.titleSection}>
              <Text style={styles.sectionTitle}>{displayMarca}</Text>
              <View style={styles.sectionLine} />
              <Text style={styles.sectionSub}>Colección exclusiva</Text>
            </View>

            <View style={styles.controlsRow}>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" style={{ marginRight: 12 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={`Buscar perfume...`}
                  placeholderTextColor="#999"
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>

              <TouchableOpacity 
                style={styles.filterIconBtn} 
                onPress={() => setShowFilterGenderModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="people-outline" size={24} color="#1a1a1a" />
                {filterGender !== "Todos" && <View style={styles.filterDot} />}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.filterIconBtn} 
                onPress={() => setShowFilterTypeModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="options-outline" size={24} color="#1a1a1a" />
                {filterType !== "Todos" && <View style={styles.filterDot} />}
              </TouchableOpacity>
            </View>

            <View style={styles.viewToggleWrapper}>
              <Text style={styles.viewLabel}>Ver como</Text>
              <View style={styles.viewToggle}>
                <TouchableOpacity
                  style={styles.toggleBtn}
                  onPress={() => setViewMode('grid')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="grid-outline" size={24} color="#1a1a1a" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.toggleBtn}
                  onPress={() => setViewMode('column')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="albums-outline" size={24} color="#1a1a1a" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={<EmptyState searchText={searchText} filterType={filterType} filterGender={filterGender} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} tintColor="#1a1a1a" />}
        showsVerticalScrollIndicator={false}
      />

      {showFilterGenderModal && (
        <Modal visible transparent animationType="fade">
          <View style={styles.filterModalBackdrop} pointerEvents="box-none">
            <TouchableOpacity 
              style={StyleSheet.absoluteFill} 
              onPress={() => setShowFilterGenderModal(false)}
              activeOpacity={1}
            />
            <View style={styles.filterModal}>
              <View style={styles.filterModalHeader}>
                <Text style={styles.filterModalTitle}>Género</Text>
                <TouchableOpacity onPress={() => setShowFilterGenderModal(false)} activeOpacity={0.7}>
                  <Ionicons name="close" size={26} color="#1a1a1a" />
                </TouchableOpacity>
              </View>

              {["Todos", "Mujeres", "Hombres"].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={styles.filterModalOption}
                  onPress={() => {
                    setFilterGender(gender);
                    setShowFilterGenderModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterModalText, filterGender === gender && styles.filterModalTextActive]}>
                    {gender}
                  </Text>
                  {filterGender === gender && <Ionicons name="checkmark" size={24} color="#1a1a1a" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
      )}

      {showFilterTypeModal && (
        <Modal visible transparent animationType="fade">
          <View style={styles.filterModalBackdrop} pointerEvents="box-none">
            <TouchableOpacity 
              style={StyleSheet.absoluteFill} 
              onPress={() => setShowFilterTypeModal(false)}
              activeOpacity={1}
            />
            <View style={styles.filterModal}>
              <View style={styles.filterModalHeader}>
                <Text style={styles.filterModalTitle}>Tipo de fragancia</Text>
                <TouchableOpacity onPress={() => setShowFilterTypeModal(false)} activeOpacity={0.7}>
                  <Ionicons name="close" size={26} color="#1a1a1a" />
                </TouchableOpacity>
              </View>

              {["Todos", "Perfume", "Eau de Parfum", "Eau de Toilette", "Eau de Cologne", "Eau Fraîche"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.filterModalOption}
                  onPress={() => {
                    setFilterType(type);
                    setShowFilterTypeModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterModalText, filterType === type && styles.filterModalTextActive]}>
                    {type}
                  </Text>
                  {filterType === type && <Ionicons name="checkmark" size={24} color="#1a1a1a" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
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
              data={filteredPerfumes}
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
  logo: { width: 60, height: 60 },

  listContent: { paddingHorizontal: 22, paddingTop: HEADER_HEIGHT + 30, paddingBottom: 100 },
  gridRow: { justifyContent: 'space-between' },

  titleSection: { alignItems: 'center', marginBottom: 25 },
  sectionTitle: { fontSize: 24, textAlign: 'center', color: '#1a1a1a', letterSpacing: 1.5, fontFamily: FONT_TITLE, fontWeight: '400', textTransform: 'uppercase' },
  sectionLine: { width: 55, height: 1, backgroundColor: '#1a1a1a', marginVertical: 12 },
  sectionSub: { fontSize: 12, textAlign: 'center', color: '#666', fontFamily: FONT_BODY, fontStyle: 'italic', letterSpacing: 0.5 },

  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fafafa', borderRadius: 30, paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1, borderColor: '#f0f0f0' },
  searchInput: { flex: 1, fontSize: 14, color: '#1a1a1a', fontFamily: FONT_BODY },
  filterIconBtn: { width: 50, height: 50, backgroundColor: '#fafafa', borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f0f0f0' },
  filterDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, backgroundColor: '#DC2626', borderRadius: 4 },

  viewToggleWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 12, marginBottom: 28 },
  viewLabel: { fontSize: 14, color: '#1a1a1a', fontFamily: FONT_MODERN, fontWeight: '600', letterSpacing: 0.5 },
  viewToggle: { flexDirection: 'row', gap: 10 },
  toggleBtn: { padding: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderRadius: 0 },

  productCard: { width: '100%', backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 6, borderWidth: 1, borderColor: '#f5f5f5' },
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

  productCardColumn: { width: '100%', backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 6, borderWidth: 1, borderColor: '#f5f5f5', marginBottom: 20 },
  productImgBoxColumn: { width: '100%', height: width * 0.75, position: 'relative' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 40, minHeight: height * 0.4 },
  emptyTitle: { fontSize: 18, color: '#1a1a1a', marginTop: 20, marginBottom: 10, fontFamily: FONT_TITLE, fontWeight: '600', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#999', fontFamily: FONT_BODY, textAlign: 'center', lineHeight: 22 },

  filterModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  filterModal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  filterModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
  filterModalTitle: { fontSize: 20, color: '#1a1a1a', fontFamily: FONT_TITLE, fontWeight: '600' },
  filterModalOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#f5f5f5' },
  filterModalText: { fontSize: 16, color: '#666', fontFamily: FONT_BODY },
  filterModalTextActive: { color: '#1a1a1a', fontWeight: '600' },

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
  
  modalContent: { padding: 28, paddingTop: MODAL_TOP_MARGIN + MODAL_IMAGE_HEIGHT + 20 },
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
