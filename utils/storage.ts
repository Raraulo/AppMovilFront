import AsyncStorage from "@react-native-async-storage/async-storage";

/* -------------------------------------------------------
   🔹 EventEmitter simple (compatible con React Native)
--------------------------------------------------------*/
class SimpleEventEmitter {
  private listeners: Record<string, Function[]> = {};

  on(event: string, callback: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
  }

  emit(event: string, ...args: any[]) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((callback) => callback(...args));
  }
}

export const storageEvents = new SimpleEventEmitter(); // 👈 emisor global

/* -------------------------------------------------------
   🔹 Constantes y tipos
--------------------------------------------------------*/
const CART_KEY = "cart";
const FAV_KEY = "favorites";

type Item = {
  id: number;
  cantidad?: number;
  [k: string]: any;
};

/* -------------------------------------------------------
   🔹 Funciones base
--------------------------------------------------------*/
async function getList(key: string): Promise<Item[]> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

async function setList(key: string, list: Item[]) {
  await AsyncStorage.setItem(key, JSON.stringify(list));

  // 🔸 Emite eventos globales según el tipo de lista modificada
  if (key === CART_KEY) {
    storageEvents.emit("cartChanged");
  } else if (key === FAV_KEY) {
    storageEvents.emit("favoritesChanged"); // ✅ nuevo
  }
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

/* -------------------------------------------------------
   🛒 Carrito de compras
--------------------------------------------------------*/
export async function addToCart(item: Item) {
  const list = await getList(CART_KEY);
  const existing = list.find((i) => i.id === item.id);

  let updated;
  if (existing) {
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

export async function updateCart(newList: Item[]) {
  await setList(CART_KEY, newList);
  return newList;
}

export async function updateCartQuantity(id: number, cantidad: number) {
  const list = await getList(CART_KEY);
  const updated = list.map((i) =>
    i.id === id ? { ...i, cantidad } : i
  );
  await setList(CART_KEY, updated);
  return updated;
}

export async function clearCart() {
  await AsyncStorage.removeItem(CART_KEY);
  storageEvents.emit("cartChanged"); // ✅ se mantiene
}

/* -------------------------------------------------------
   ❤️ Favoritos
--------------------------------------------------------*/
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

export async function clearFavorites() {
  await AsyncStorage.removeItem(FAV_KEY);
  storageEvents.emit("favoritesChanged"); // ✅ agregado
}
