import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  addToCart,
  addToFavorites,
  getCart,
} from '../../utils/storage'; // ✅ helper local

export default function MarcaScreen() {
  const router = useRouter();
  const { marca, marcaId } = useLocalSearchParams();

  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('Todos');
  const [selectedPerfume, setSelectedPerfume] = useState<any | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [cartCount, setCartCount] = useState(0); // 🧩 cantidad carrito

  const animCart = useRef(new Animated.Value(0)).current;
  const animBadge = useRef(new Animated.Value(1)).current;

  const tipoEquivalencias: Record<number, string> = {
    1: 'Eau Fraîche',
    2: 'Eau de Cologne',
    3: 'Eau de Toilette',
    4: 'Eau de Parfum',
    5: 'Parfum',
  };

  // Cargar perfumes
  useEffect(() => {
    if (!marcaId) return;
    const fetchProductos = async () => {
      try {
        const res = await fetch(`http://192.168.1.5:8000/api/productos/marca/${marcaId}/`);
        const data = await res.json();
        setProductos(data);
      } catch (error) {
        console.error('Error al obtener productos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductos();

    // cargar cantidad carrito inicial
    const loadCartCount = async () => {
      const cart = await getCart();
      setCartCount(cart.length);
    };
    loadCartCount();
  }, [marcaId]);

  const filteredPerfumes = productos.filter(
    (p) =>
      (filterType === 'Todos' || tipoEquivalencias[p.tipo] === filterType) &&
      p.nombre.toLowerCase().includes(searchText.toLowerCase())
  );

  const openModal = (perfume: any) => {
    setSelectedPerfume(perfume);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setSelectedPerfume(null);
    setIsModalVisible(false);
  };

  // 🛒 Añadir al carrito con animaciones
  const handleAddToCart = async () => {
    if (!selectedPerfume) return;
    try {
      const updated = await addToCart(selectedPerfume);
      setCartCount(updated.length);

      // animación pop del carrito
      Animated.sequence([
        Animated.timing(animCart, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(animCart, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();

      // animación badge
      Animated.sequence([
        Animated.timing(animBadge, { toValue: 1.5, duration: 150, useNativeDriver: true }),
        Animated.timing(animBadge, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();

      Alert.alert('Carrito', 'Perfume añadido ');
    } catch (e) {
      Alert.alert('Error', 'No se pudo añadir al carrito.');
    }
  };

  // ❤️ Añadir a favoritos
  const handleAddToFavorites = async () => {
    if (!selectedPerfume) return;
    try {
      await addToFavorites(selectedPerfume);
      Alert.alert('Favoritos', 'Guardado en favoritos ');
    } catch (e) {
      Alert.alert('Error', 'No se pudo añadir a favoritos.');
    }
  };

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#121212" />
      </View>
    );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/logomaison.png')}
            style={[styles.logo, { marginLeft: -60 }]}
            resizeMode="contain"
          />
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('../favoritos')}
            >
              <Ionicons name="heart-outline" size={26} color="#121212" />
            </TouchableOpacity>

            {/* 🔹 Carrito con badge y animación */}
            <Animated.View
              style={{
                transform: [
                  {
                    scale: animCart.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.5],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push('../carrito')}
              >
                <Ionicons name="cart-outline" size={26} color="#121212" />
                {cartCount > 0 && (
                  <Animated.View
                    style={[
                      styles.cartBadge,
                      { transform: [{ scale: animBadge }] },
                    ]}
                  >
                    <Text style={styles.cartBadgeText}>
                      {cartCount > 9 ? '9+' : cartCount}
                    </Text>
                  </Animated.View>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* (opcional) GIF decorativo de marca */}
        <Image source={{ uri: '' }} style={{ width: '100%', height: 100 }} resizeMode="contain" />

        {/* back minimal */}
        <View style={styles.backButtonMinimalContainer}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#121212" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, { marginTop: 60 }]}>Parfums - {marca}</Text>

        {/* Buscador */}
        <TextInput
          placeholder={`Buscar en ${marca}...`}
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
        />

        {/* Filtros */}
        <View style={styles.filtersContainer}>
          {['Todos', 'Eau Fraîche', 'Eau de Cologne', 'Eau de Toilette', 'Eau de Parfum', 'Parfum'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterButton, filterType === type && styles.filterButtonActive]}
              onPress={() => setFilterType(type)}
            >
              <Text style={[styles.filterText, filterType === type && styles.filterTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lista de perfumes */}
        <View style={styles.productsContainer}>
          {filteredPerfumes.map((perfume) => (
            <TouchableOpacity
              key={perfume.id}
              style={styles.productCard}
              onPress={() => openModal(perfume)}
            >
              <Image source={{ uri: perfume.url_imagen }} style={styles.productImage} resizeMode="cover" />
              <Text style={styles.productName}>{perfume.nombre}</Text>
              <Text style={styles.productPrice}>${perfume.precio}</Text>
            </TouchableOpacity>
          ))}

          {filteredPerfumes.length === 0 && (
            <Text style={styles.noResultsText}>No se encontraron perfumes.</Text>
          )}
        </View>
      </ScrollView>

      {/* Modal Detalles */}
      <Modal visible={isModalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPerfume && (
              <>
                <Image source={{ uri: selectedPerfume.url_imagen }} style={styles.modalImage} resizeMode="cover" />
                <Text style={styles.modalName}>{selectedPerfume.nombre}</Text>
                <Text style={styles.modalDetails}>{selectedPerfume.descripcion}</Text>
                <Text style={styles.modalInfo}>Precio: ${selectedPerfume.precio}</Text>
                <Text style={styles.modalInfo}>
                  Tipo: {tipoEquivalencias[selectedPerfume.tipo] || 'Desconocido'}
                </Text>

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
                    <Ionicons name="cart-outline" size={20} color="#fff" />
                    <Text style={styles.addButtonText}>Añadir al carrito</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.favoriteButton} onPress={handleAddToFavorites}>
                    <Ionicons name="heart-outline" size={20} color="#fff" />
                    <Text style={styles.addButtonText}>Favorito</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <Ionicons name="close" size={28} color="#121212" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  logo: { width: 180, height: 60 },
  headerIcons: { flexDirection: 'row' },
  iconButton: { marginLeft: 15, position: 'relative' },
  title: { fontSize: 20, fontWeight: 'bold', margin: 20, color: '#121212' },
  searchInput: {
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: '#121212',
    marginBottom: 10,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f1f1',
    margin: 5,
  },
  filterButtonActive: { backgroundColor: '#121212' },
  filterText: { fontSize: 14, color: '#121212' },
  filterTextActive: { color: '#fff' },
  productsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 20,
  },
  productCard: {
    backgroundColor: '#f8f8f8',
    width: '47%',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
  },
  productImage: { width: '100%', height: 120 },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#121212',
    textAlign: 'center',
    marginTop: 5,
  },
  productPrice: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    marginBottom: 5,
  },
  noResultsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  modalImage: { width: 150, height: 150, borderRadius: 10, marginBottom: 15 },
  modalName: { fontSize: 20, fontWeight: '700', marginBottom: 5 },
  modalDetails: { fontSize: 14, textAlign: 'center', color: '#555', marginBottom: 10 },
  modalInfo: { fontSize: 13, color: '#333', marginBottom: 5 },
  modalButtons: { flexDirection: 'row', marginTop: 10 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4B5C',
    padding: 8,
    borderRadius: 8,
  },
  addButtonText: { color: '#fff', marginLeft: 5, fontSize: 13 },
  closeButton: { position: 'absolute', top: 10, right: 10 },

  // back minimal
  backButtonMinimalContainer: {
    alignItems: 'flex-start',
    marginTop: -80,
    marginLeft: 20,
    zIndex: 1,
  },

  // 🔴 Badge del carrito
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
