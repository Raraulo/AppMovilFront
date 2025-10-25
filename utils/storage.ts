import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_KEY = 'cart';
const FAV_KEY = 'favorites';

type Item = { 
  id: number; 
  cantidad?: number; 
  [k: string]: any 
};

/* -------------------------------
   🧩 Funciones base
-------------------------------- */
async function getList(key: string): Promise<Item[]> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

async function setList(key: string, list: Item[]) {
  await AsyncStorage.setItem(key, JSON.stringify(list));
}

// Evita duplicados por id
function addUnique(list: Item[], item: Item) {
  const exists = list.some((i) => i.id === item.id);
  return exists ? list : [...list, { ...item, cantidad: 1 }];
}

// Remueve un item por id
function removeById(list: Item[], id: number) {
  return list.filter((i) => i.id !== id);
}

/* -------------------------------
   🛒 Carrito de compras
-------------------------------- */
export async function addToCart(item: Item) {
  const list = await getList(CART_KEY);
  const existing = list.find((i) => i.id === item.id);

  let updated;
  if (existing) {
    // Si ya existe, aumenta cantidad
    updated = list.map((i) =>
      i.id === item.id ? { ...i, cantidad: (i.cantidad || 1) + 1 } : i
    );
  } else {
    updated = [...list, { ...item, cantidad: 1 }];
  }

  await setList(CART_KEY, updated);
  return updated;
}

export async function getCart() {
  return await getList(CART_KEY);
}

export async function removeFromCart(id: number) {
  const list = await getList(CART_KEY);
  const updated = removeById(list, id);
  await setList(CART_KEY, updated);
  return updated;
}

// Actualiza todo el carrito
export async function updateCart(newList: Item[]) {
  await setList(CART_KEY, newList);
  return newList;
}

// Actualiza cantidad de un producto específico
export async function updateCartQuantity(id: number, cantidad: number) {
  const list = await getList(CART_KEY);
  const updated = list.map((i) =>
    i.id === id ? { ...i, cantidad: cantidad } : i
  );
  await setList(CART_KEY, updated);
  return updated;
}

// Vacía el carrito por completo
export async function clearCart() {
  await AsyncStorage.removeItem(CART_KEY);
}

/* -------------------------------
   ❤️ Favoritos
-------------------------------- */
export async function addToFavorites(item: Item) {
  const list = await getList(FAV_KEY);
  const updated = addUnique(list, item);
  await setList(FAV_KEY, updated);
  return updated;
}

export async function getFavorites() {
  return await getList(FAV_KEY);
}

export async function removeFromFavorites(id: number) {
  const list = await getList(FAV_KEY);
  const updated = removeById(list, id);
  await setList(FAV_KEY, updated);
  return updated;
}

// Vacía todos los favoritos
export async function clearFavorites() {
  await AsyncStorage.removeItem(FAV_KEY);
}
