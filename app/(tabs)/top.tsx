import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function TopScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fechaActual, setFechaActual] = useState('');
  const [selectedPerfume, setSelectedPerfume] = useState<any | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const hoy = new Date();
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    setFechaActual(hoy.toLocaleDateString('es-ES', opciones));
  }, []);

  const productosMasVendidos = [
    {
      id: 1,
      nombre: 'Dior Sauvage',
      imagen:
        'https://www.dior.com/dw/image/v2/BGXS_PRD/on/demandware.static/-/Sites-master_dior/default/dwb57d0b59/Y0685240/Y0685240_F068524009_E01_GHC.jpg?sw=1850&sh=1850',
      precio: 150,
      descripcion:
        'Un aroma fresco y audaz con notas de bergamota y ambroxan. Ideal para el hombre moderno.',
    },
    {
      id: 2,
      nombre: 'Chanel Coco Mademoiselle',
      imagen:
        'https://i5.walmartimages.com/seo/New-Coco-Mademoiselle-Eau-De-Parfum-Vaporisateur-Spray-100ml-3-4-oz_9f5d4724-2b85-4cba-b748-f28f54f58649.fd14fd5957894c147548a9b6f6e40f24.jpeg',
      precio: 170,
      descripcion:
        'Fragancia intensa con toques amaderados y cítricos. Atemporal, elegante y femenina.',
    },
    {
      id: 3,
      nombre: 'Good Girl - Carolina Herrera',
      imagen:
        'https://fontanapharmacy.com/product_images/u/856/Untitled_design_-_2024-11-20T153027.410__71518_zoom.png',
      precio: 180,
      descripcion:
        'Una fragancia femenina icónica que combina la dulzura del jazmín con la fuerza del cacao.',
    },
  ];

  const recienLlegados = [
    {
      id: 4,
      nombre: 'My Way - Giorgio Armani',
      imagen:
        'https://lasfragancias.vtexassets.com/arquivos/ids/160039-1200-auto?v=638001577982130000&width=1200&height=auto&aspect=true',
      precio: 135,
      descripcion:
        'Una combinación floral que representa la feminidad moderna y libre.',
    },
    {
      id: 5,
      nombre: 'Libre - Yves Saint Laurent',
      imagen: 'https://fimgs.net/mdimg/perfume-thumbs/375x500.56077.2x.avif',
      precio: 140,
      descripcion:
        'Una mezcla elegante de lavanda francesa y flor de naranjo marroquí.',
    },
    {
      id: 6,
      nombre: '1 Million - Paco Rabanne',
      imagen:
        'https://lasfragancias.vtexassets.com/arquivos/ids/160861-1200-auto?v=638174838826700000&width=1200&height=auto&aspect=true',
      precio: 150,
      descripcion:
        'Inspirado en la elegancia romana. Un perfume rebelde con notas de vainilla y jazmín.',
    },
  ];

  const openModal = (perfume: any) => {
    setSelectedPerfume(perfume);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setSelectedPerfume(null);
    setIsModalVisible(false);
  };

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#121212" />
      </View>
    );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('../carrito')}
            >
              <Ionicons name="cart-outline" size={26} color="#121212" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Fecha */}
        <Text style={styles.fecha}>{fechaActual}</Text>

        {/* Título */}
        <Text style={styles.mainTitle}>Top Parfums</Text>

        {/* Más vendidos */}
        <Text style={styles.sectionTitle}>Mas vendidos</Text>
        <View style={styles.productsContainer}>
          {productosMasVendidos.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.productCard}
              onPress={() => openModal(p)}
            >
              <Image source={{ uri: p.imagen }} style={styles.productImage} resizeMode="cover" />
              <Text style={styles.productName}>{p.nombre}</Text>
              <Text style={styles.productPrice}>${p.precio}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Imagen decorativa */}
        <Image
          source={{ uri: 'https://media1.tenor.com/m/z7F1pPEBLK8AAAAd/tronsmart-uruguay.gif' }}
          style={styles.decorativeGif}
          resizeMode="contain"
        />

        {/* Recién llegados */}
        <Text style={styles.sectionTitle}>Nuevos</Text>
        <View style={styles.productsContainer}>
          {recienLlegados.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.productCard}
              onPress={() => openModal(p)}
            >
              <Image source={{ uri: p.imagen }} style={styles.productImage} resizeMode="cover" />
              <Text style={styles.productName}>{p.nombre}</Text>
              <Text style={styles.productPrice}>${p.precio}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Modal Detalles */}
      <Modal visible={isModalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPerfume && (
              <>
                <Image source={{ uri: selectedPerfume.imagen }} style={styles.modalImage} resizeMode="cover" />
                <Text style={styles.modalName}>{selectedPerfume.nombre}</Text>
                <Text style={styles.modalDetails}>{selectedPerfume.descripcion}</Text>
                <Text style={styles.modalInfo}>Precio: ${selectedPerfume.precio}</Text>

                {/* 🔸 Botones desactivados (comentados) */}
                {/*
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
                */}

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
  scrollContent: { paddingBottom: 120 },
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
  iconButton: { marginLeft: 15 },

  fecha: {
    textAlign: 'center',
    color: '#777',
    fontStyle: 'italic',
    marginTop: 5,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 15,
    color: '#121212',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 10,
    color: '#121212',
  },
  productsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 20,
  },
  productCard: {
    width: '47%',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
    alignItems: 'center',
  },
  productImage: { width: '100%', height: 150 },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#121212',
    textAlign: 'center',
    marginTop: 8,
  },
  productPrice: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    marginBottom: 8,
  },
  decorativeGif: {
    width: '100%',
    height: 110,
    marginTop: 10,
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
    position: 'relative',
  },
  modalImage: { width: 150, height: 150, borderRadius: 10, marginBottom: 15 },
  modalName: { fontSize: 20, fontWeight: '700', marginBottom: 5 },
  modalDetails: { fontSize: 14, textAlign: 'center', color: '#555', marginBottom: 10 },
  modalInfo: { fontSize: 13, color: '#333', marginBottom: 10 },
  modalButtons: { flexDirection: 'row', marginTop: 10 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4B5C',
    padding: 10,
    borderRadius: 8,
  },
  addButtonText: { color: '#fff', marginLeft: 5, fontSize: 13 },
  closeButton: { position: 'absolute', top: 10, right: 10 },
});
