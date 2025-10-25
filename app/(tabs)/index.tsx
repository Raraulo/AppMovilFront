import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getCart } from '../../utils/storage';

export default function HomeScreen() {
  const router = useRouter();

  const [cartCount, setCartCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false); // ✅ estado de refresh

  const animCart = useRef(new Animated.Value(0)).current;
  const animBadge = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const goToMujeres = () => router.push('../mujeres');
  const goToHombres = () => router.push('../hombres');
  const goToMarca = (brand: any) =>
    router.push({ pathname: `../marcas/${brand.name}`, params: { marcaId: brand.id } });

  const goToFavoritos = () => router.push('../favoritos');
  const goToCarrito = () => router.push('../carrito');

  // 🔹 Actualiza el contador del carrito
  const loadCartCount = async () => {
    const cart = await getCart();
    setCartCount(cart.length);
  };

  // 🔹 Simulación de “recarga completa”
  const onRefresh = async () => {
    setRefreshing(true);
    await loadCartCount();
    // podrías agregar más datos si luego los traes dinámicos (como banners o marcas)
    setTimeout(() => setRefreshing(false), 1000);
  };

  useEffect(() => {
    loadCartCount();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // 🔹 Agrupar marcas por país
  const groupedBrands = brands.reduce((acc, brand) => {
    if (!acc[brand.country]) acc[brand.country] = [];
    acc[brand.country].push(brand);
    return acc;
  }, {} as Record<string, typeof brands>);

  const flagColors: Record<string, string[]> = {
    Francia: ['#0055A4', '#FFFFFF', '#EF4135'],
    Italia: ['#009246', '#FFFFFF', '#CE2B37'],
    'Estados Unidos': ['#B22234', '#FFFFFF', '#3C3B6E'],
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#121212']} />
      } // ✅ control de refresh nativo
    >
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/logomaison.png')}
          style={[styles.logo, { marginLeft: -60 }]}
          resizeMode="contain"
        />
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={goToFavoritos}>
            <Ionicons name="heart-outline" size={26} color="#121212" />
          </TouchableOpacity>

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
            <TouchableOpacity style={styles.iconButton} onPress={goToCarrito}>
              <Ionicons name="cart-outline" size={26} color="#121212" />
              {cartCount > 0 && (
                <Animated.View
                  style={[styles.cartBadge, { transform: [{ scale: animBadge }] }]}
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

      {/* Imagen principal */}
      <View style={styles.mainImageContainer}>
        <Image
          source={{
            uri: 'https://irfe.com/wp-content/uploads/2025/06/photo-of-a-variety-Different-luxury-perfumes-for-ads-display-in-the-style-of-professioanal-fashion-magazine-1200x675.jpg',
          }}
          style={styles.mainImage}
          resizeMode="cover"
        />
        <View style={styles.textOverlay}>
          <Text style={styles.title}>Maison des Senteurs</Text>
          <Text style={styles.subtitle}>Bienvenue à la parfumerie</Text>
        </View>
      </View>

      {/* Secciones Mujeres y Hombres */}
      <View style={styles.sections}>
        <TouchableOpacity style={styles.section} onPress={goToMujeres}>
          <Image
            source={{
              uri: 'https://img.freepik.com/fotos-premium/mujer-bonita-estilo-pin-up-mujer-vestido-rojo-vintage_113913-374.jpg',
            }}
            style={styles.sectionImage}
            resizeMode="cover"
          />
          <Text style={styles.sectionLabel}>Mesdames</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.section} onPress={goToHombres}>
          <Image
            source={{
              uri: 'https://i.pinimg.com/474x/05/f2/9c/05f29c3304f291891fe06be236299f15.jpg',
            }}
            style={styles.sectionImage}
            resizeMode="cover"
          />
          <Text style={styles.sectionLabel}>Messieurs</Text>
        </TouchableOpacity>
      </View>

      {/* Marcas por país */}
      <Text style={styles.brandsTitle}>Marques Disponibles</Text>

      {Object.entries(groupedBrands).map(([country, brandList]) => (
        <View key={country} style={styles.countrySection}>
          <Animated.View style={[styles.countryHeader, { opacity: fadeAnim }]}>
            {/* Bandera superior */}
            <View style={styles.flagTightLine}>
              {flagColors[country].map((color, index) => (
                <View key={index} style={[styles.flagSegment, { backgroundColor: color }]} />
              ))}
            </View>

            <Text style={styles.countryName}>{country}</Text>

            {/* Bandera inferior */}
            <View style={styles.flagTightLine}>
              {flagColors[country].map((color, index) => (
                <View key={index} style={[styles.flagSegment, { backgroundColor: color }]} />
              ))}
            </View>
          </Animated.View>

          {/* Lista de marcas */}
          <View style={styles.brandsContainer}>
            {brandList.map((brand) => (
              <TouchableOpacity key={brand.id} style={styles.brand} onPress={() => goToMarca(brand)}>
                <Image source={{ uri: brand.logo }} style={styles.brandLogo} resizeMode="contain" />
                <Text style={styles.brandName}>{brand.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ✅ Lista de marcas
const brands = [
  { id: 2, name: 'Yves-Saint-Laurent', logo: 'https://brandlogos.net/wp-content/uploads/2012/10/yves-saint-laurent-logo-vector.png', country: 'Francia' },
  { id: 3, name: 'Dolce-Gabbana', logo: 'https://brandslogos.com/wp-content/uploads/images/large/dolce-gabbana-logo.png', country: 'Italia' },
  { id: 4, name: 'Armani', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSCN5XKMYCRed7Yleq5OSt49lXS5vLli1yMgg&s', country: 'Italia' },
  { id: 5, name: 'Carolina-Herrera', logo: 'https://i.pinimg.com/736x/41/41/f7/4141f7f7182700e702977e8210e85b37.jpg', country: 'Estados Unidos' },
  { id: 6, name: 'Jean-Paul-Gaultier', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Jean_Paul_Gaultier_logo.svg/2560px-Jean_Paul_Gaultier_logo.svg.png', country: 'Francia' },
  { id: 7, name: 'Lancome', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJYjCDxlMk4xr5q9EOmM5ldlebjJJOI4--rw&s', country: 'Francia' },
  { id: 8, name: 'Dior', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRD2EGiH4UUxm5BmO7btUPmPP_JFVugLMotjw&s', country: 'Francia' },
  { id: 9, name: 'Givenchy', logo: 'https://i.pinimg.com/736x/12/5c/84/125c84bafd71927494498c4d59e746af.jpg', country: 'Francia' },
  { id: 10, name: 'Valentino', logo: 'https://1000logos.net/wp-content/uploads/2021/06/Valentino-logo.png', country: 'Italia' },
  { id: 11, name: 'Prada', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_4R5kwTmlWDLAU1ZuHFClw4fOTEy7VlTk6g&s', country: 'Italia' },
  { id: 12, name: 'Bvlgari', logo: 'https://1000logos.net/wp-content/uploads/2018/10/Bvlgari-Logo.png', country: 'Italia' },
  { id: 13, name: 'Versace', logo: 'https://i.pinimg.com/564x/23/77/40/2377408021dd0c2fca98e0eabf98d6d4.jpg', country: 'Italia' },
  { id: 14, name: 'Chanel', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQahc9-wbC0L-AZYjOFVlWbGNPJlUPL45X4PQ&s', country: 'Francia' },
  { id: 15, name: 'Tom-Ford', logo: 'https://1000logos.net/wp-content/uploads/2020/06/Tom-Ford-Logo.jpg', country: 'Estados Unidos' },
  { id: 16, name: 'Brunello-Cucinelli', logo: 'https://i.pinimg.com/564x/85/1b/ef/851bef0805d5088fd2ccc4d77d44812b.jpg', country: 'Italia' },
  { id: 17, name: 'Moschino', logo: 'https://1000marcas.net/wp-content/uploads/2020/03/Moschino-logo-1.png', country: 'Italia' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingBottom: 40 },
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
  cartBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  mainImageContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  mainImage: { width: '100%', aspectRatio: 1 },
  textOverlay: { position: 'absolute', alignItems: 'center' },
  title: { fontSize: 28, color: '#FFFFFF', fontWeight: 'bold', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#FFFFFF' },
  sections: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 20,
  },
  section: { flex: 1, marginHorizontal: 5, alignItems: 'center' },
  sectionImage: { width: '100%', aspectRatio: 1, borderRadius: 10 },
  sectionLabel: { marginTop: 8, fontSize: 16, color: '#121212', fontWeight: '600' },
  brandsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 10,
    marginLeft: 20,
    color: '#121212',
  },
  countrySection: { marginBottom: 30 },
  countryHeader: { alignItems: 'center', justifyContent: 'center' },
  flagTightLine: {
    flexDirection: 'row',
    width: '85%',
    height: 5,
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: 3,
  },
  flagSegment: { flex: 1, height: '100%' },
  countryName: {
    fontSize: 20,
    fontStyle: 'italic',
    fontWeight: '600',
    color: '#1a1a1a',
    marginVertical: 2,
    fontFamily: 'serif',
  },
  brandsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 20,
  },
  brand: {
    width: '47%',
    marginBottom: 15,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
  },
  brandLogo: { width: 80, height: 80 },
  brandName: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#121212',
    textAlign: 'center',
  },
});
