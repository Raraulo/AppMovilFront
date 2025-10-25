import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getFavorites, removeFromFavorites } from '../../../utils/storage';

export default function FavoritosScreen() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const router = useRouter();

  const load = async () => {
    const data = await getFavorites();
    setFavorites(data);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const removeFav = async (id: number) => {
    const updated = await removeFromFavorites(id);
    setFavorites(updated);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#121212" />
        </TouchableOpacity>
        <Text style={styles.title}>Favoritos</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {favorites.length === 0 ? (
          <Text style={styles.emptyText}>No tienes perfumes favoritos</Text>
        ) : (
          favorites.map((p) => (
            <View key={p.id} style={styles.card}>
              <Image source={{ uri: p.url_imagen }} style={styles.image} />
              <View style={styles.info}>
                <Text style={styles.name}>{p.nombre}</Text>
                <Text style={styles.price}>${p.precio}</Text>
              </View>
              <TouchableOpacity onPress={() => removeFav(p.id)}>
                <Ionicons name="trash-outline" size={22} color="red" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#121212' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#777' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 10,
    padding: 10,
  },
  image: { width: 60, height: 60, borderRadius: 8 },
  info: { flex: 1, marginHorizontal: 10 },
  name: { fontSize: 15, fontWeight: '600', color: '#121212' },
  price: { fontSize: 14, color: '#555' },
});
