// utils/storage.ts
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

export const storageEvents = new SimpleEventEmitter();

/* -------------------------------------------------------
   🔹 Constantes y tipos
--------------------------------------------------------*/
const CART_KEY = "cart";
const FAV_KEY = "favorites";
const CARDS_KEY_PREFIX = "tarjetas_wawallet_";
const ACTIVE_CARD_KEY_PREFIX = "tarjeta_waactiva_";
const USER_KEY = "user";

type Item = {
  id: number;
  cantidad?: number;
  [k: string]: any;
};

export type Card = {
  id: string;
  numero: string;
  cvv: string;
  fecha: string;
  titular: string;
  colorIndex: number;
};

/* -------------------------------------------------------
   🔹 Helpers para obtener usuario actual
--------------------------------------------------------*/
async function getCurrentUserId(): Promise<string | null> {
  try {
    const userJson = await AsyncStorage.getItem(USER_KEY);
    if (!userJson) return null;
    const user = JSON.parse(userJson);
    return user.id?.toString() || user.email || null;
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    return null;
  }
}

function getCardsKey(userId: string): string {
  return `${CARDS_KEY_PREFIX}${userId}`;
}

function getActiveCardKey(userId: string): string {
  return `${ACTIVE_CARD_KEY_PREFIX}${userId}`;
}

/* -------------------------------------------------------
   🔹 Funciones base
--------------------------------------------------------*/
async function getList(key: string): Promise<Item[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error(`Error al obtener lista ${key}:`, error);
    return [];
  }
}

async function setList(key: string, list: Item[]) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(list));

    if (key === CART_KEY) {
      storageEvents.emit("cartChanged");
    } else if (key === FAV_KEY) {
      storageEvents.emit("favoritesChanged");
    }
  } catch (error) {
    console.error(`Error al guardar lista ${key}:`, error);
    throw error;
  }
}

function addUnique(list: Item[], item: Item) {
  const exists = list.some((i) => i.id === item.id);
  return exists ? list : [...list, { ...item, cantidad: 1 }];
}

function removeById(list: Item[], id: number) {
  return list.filter((i) => i.id !== id);
}

/* -------------------------------------------------------
   🛒 Carrito de compras
--------------------------------------------------------*/
export async function addToCart(item: Item) {
  try {
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
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    throw error;
  }
}

export async function getCart() {
  return await getList(CART_KEY);
}

export async function removeFromCart(id: number) {
  try {
    const list = await getList(CART_KEY);
    const updated = removeById(list, id);
    await setList(CART_KEY, updated);
    return updated;
  } catch (error) {
    console.error('Error al eliminar del carrito:', error);
    throw error;
  }
}

export async function updateCart(newList: Item[]) {
  try {
    await setList(CART_KEY, newList);
    return newList;
  } catch (error) {
    console.error('Error al actualizar carrito:', error);
    throw error;
  }
}

export async function updateCartQuantity(id: number, cantidad: number) {
  try {
    const list = await getList(CART_KEY);
    const updated = list.map((i) =>
      i.id === id ? { ...i, cantidad } : i
    );
    await setList(CART_KEY, updated);
    return updated;
  } catch (error) {
    console.error('Error al actualizar cantidad:', error);
    throw error;
  }
}

export async function clearCart() {
  try {
    await AsyncStorage.removeItem(CART_KEY);
    storageEvents.emit("cartChanged");
  } catch (error) {
    console.error('Error al limpiar carrito:', error);
  }
}

/* -------------------------------------------------------
   ❤️ Favoritos
--------------------------------------------------------*/
export async function addToFavorites(item: Item) {
  try {
    const list = await getList(FAV_KEY);
    const updated = addUnique(list, item);
    await setList(FAV_KEY, updated);
    return updated;
  } catch (error) {
    console.error('Error al agregar a favoritos:', error);
    throw error;
  }
}

export async function getFavorites() {
  return await getList(FAV_KEY);
}

export async function removeFromFavorites(id: number) {
  try {
    const list = await getList(FAV_KEY);
    const updated = removeById(list, id);
    await setList(FAV_KEY, updated);
    return updated;
  } catch (error) {
    console.error('Error al eliminar de favoritos:', error);
    throw error;
  }
}

export async function clearFavorites() {
  try {
    await AsyncStorage.removeItem(FAV_KEY);
    storageEvents.emit("favoritesChanged");
  } catch (error) {
    console.error('Error al limpiar favoritos:', error);
  }
}

/* -------------------------------------------------------
   💳 Tarjetas (por usuario)
--------------------------------------------------------*/

/**
 * Obtiene las tarjetas del usuario actual
 */
export async function getCards(): Promise<Card[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.warn('⚠️ No hay usuario autenticado');
      return [];
    }

    const cardsKey = getCardsKey(userId);
    const cardsJson = await AsyncStorage.getItem(cardsKey);
    
    if (!cardsJson) return [];
    
    let cards = JSON.parse(cardsJson);
    
    // ✅ MIGRACIÓN: Agregar IDs a tarjetas viejas sin ID
    let needsUpdate = false;
    cards = cards.map((card: any, index: number) => {
      if (!card.id) {
        needsUpdate = true;
        return {
          ...card,
          id: `card_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
        };
      }
      return card;
    });

    // Si hubo cambios, guardar las tarjetas actualizadas
    if (needsUpdate) {
      await AsyncStorage.setItem(cardsKey, JSON.stringify(cards));
      console.log('✅ Tarjetas migradas con IDs');
    }
    
    console.log(`✅ ${cards.length} tarjetas cargadas para usuario ${userId}`);
    return cards;
  } catch (error) {
    console.error('❌ Error al cargar tarjetas:', error);
    return [];
  }
}

/**
 * Guarda las tarjetas del usuario actual
 */
export async function saveCards(cards: Card[]): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('No hay usuario autenticado');
    }

    const cardsKey = getCardsKey(userId);
    await AsyncStorage.setItem(cardsKey, JSON.stringify(cards));
    
    console.log(`✅ ${cards.length} tarjetas guardadas para usuario ${userId}`);
    storageEvents.emit("cardsUpdated", cards);
  } catch (error) {
    console.error('❌ Error al guardar tarjetas:', error);
    throw error;
  }
}

/**
 * Agrega una nueva tarjeta al usuario actual
 */
export async function addCard(cardData: Omit<Card, 'id'>): Promise<Card[]> {
  try {
    const cards = await getCards();
    
    // Verificar si la tarjeta ya existe (comparando sin espacios)
    const numeroSinEspacios = cardData.numero.replace(/\s/g, '');
    const exists = cards.some(c => 
      c.numero.replace(/\s/g, '') === numeroSinEspacios
    );
    
    if (exists) {
      throw new Error('Esta tarjeta ya está registrada');
    }

    // ✅ GENERAR ID ÚNICO para la nueva tarjeta
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const newCard: Card = {
      ...cardData,
      id: `card_${timestamp}_${random}`
    };

    const updatedCards = [newCard, ...cards];
    await saveCards(updatedCards);
    
    // ✅ Si es la primera tarjeta, hacerla activa automáticamente
    if (cards.length === 0) {
      await setActiveCard(newCard.id);
    }
    
    console.log('✅ Tarjeta agregada:', newCard.id);
    return updatedCards;
  } catch (error) {
    console.error('❌ Error al agregar tarjeta:', error);
    throw error;
  }
}

/**
 * Elimina una tarjeta del usuario actual
 */
export async function removeCard(cardId: string): Promise<Card[]> {
  try {
    if (!cardId || typeof cardId !== 'string') {
      throw new Error('ID de tarjeta inválido');
    }

    const cards = await getCards();
    const cardToDelete = cards.find(c => c.id === cardId);
    
    if (!cardToDelete) {
      throw new Error('Tarjeta no encontrada');
    }

    const updatedCards = cards.filter(c => c.id !== cardId);
    await saveCards(updatedCards);
    
    // ✅ Si se eliminó la tarjeta activa, actualizar
    const activeCardId = await getActiveCardId();
    if (activeCardId === cardId) {
      if (updatedCards.length > 0) {
        // Establecer la primera tarjeta restante como activa
        await setActiveCard(updatedCards[0].id);
        console.log('✅ Nueva tarjeta activa:', updatedCards[0].id);
      } else {
        // Si no quedan tarjetas, limpiar la activa
        await clearActiveCard();
        console.log('✅ No quedan tarjetas, activa limpiada');
      }
    }
    
    console.log('✅ Tarjeta eliminada:', cardId);
    return updatedCards;
  } catch (error) {
    console.error('❌ Error al eliminar tarjeta:', error);
    throw error;
  }
}

/**
 * Obtiene el ID de la tarjeta activa del usuario actual
 */
export async function getActiveCardId(): Promise<string | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const activeKey = getActiveCardKey(userId);
    const activeCardId = await AsyncStorage.getItem(activeKey);
    
    // ✅ Validar que el ID no sea una cadena vacía
    if (!activeCardId || activeCardId.trim() === '') {
      return null;
    }
    
    return activeCardId;
  } catch (error) {
    console.error('❌ Error al obtener tarjeta activa:', error);
    return null;
  }
}

/**
 * Establece la tarjeta activa del usuario actual
 */
export async function setActiveCard(cardId: string): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('No hay usuario autenticado');
    }

    // ✅ VALIDACIÓN ESTRICTA: Verificar que cardId no sea null/undefined/vacío
    if (!cardId || typeof cardId !== 'string' || cardId.trim() === '') {
      console.error('❌ ID de tarjeta inválido:', cardId);
      throw new Error('ID de tarjeta inválido');
    }

    // Verificar que la tarjeta existe
    const cards = await getCards();
    const cardExists = cards.some(c => c.id === cardId);
    
    if (!cardExists) {
      console.error('❌ La tarjeta no existe:', cardId);
      throw new Error('La tarjeta no existe');
    }

    const activeKey = getActiveCardKey(userId);
    await AsyncStorage.setItem(activeKey, cardId);
    
    console.log(`✅ Tarjeta activa actualizada: ${cardId}`);
    storageEvents.emit("activeCardChanged", cardId);
  } catch (error) {
    console.error('❌ Error al establecer tarjeta activa:', error);
    throw error;
  }
}

/**
 * Obtiene la tarjeta activa completa del usuario actual
 */
export async function getActiveCard(): Promise<Card | null> {
  try {
    const activeCardId = await getActiveCardId();
    if (!activeCardId) {
      console.log('⚠️ No hay tarjeta activa');
      return null;
    }

    const cards = await getCards();
    const activeCard = cards.find(c => c.id === activeCardId);
    
    if (!activeCard) {
      console.warn('⚠️ Tarjeta activa no encontrada, limpiando...');
      await clearActiveCard();
      return null;
    }
    
    console.log('✅ Tarjeta activa encontrada:', activeCard.id);
    return activeCard;
  } catch (error) {
    console.error('❌ Error al obtener tarjeta activa:', error);
    return null;
  }
}

/**
 * Limpia la tarjeta activa del usuario actual
 */
export async function clearActiveCard(): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.warn('⚠️ No hay usuario para limpiar tarjeta activa');
      return;
    }

    const activeKey = getActiveCardKey(userId);
    await AsyncStorage.removeItem(activeKey);
    
    console.log('✅ Tarjeta activa eliminada');
    storageEvents.emit("activeCardChanged", null);
  } catch (error) {
    console.error('❌ Error al limpiar tarjeta activa:', error);
  }
}

/**
 * Limpia todas las tarjetas del usuario actual
 */
export async function clearAllCards(): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.warn('⚠️ No hay usuario para limpiar tarjetas');
      return;
    }

    const cardsKey = getCardsKey(userId);
    const activeKey = getActiveCardKey(userId);
    
    await AsyncStorage.multiRemove([cardsKey, activeKey]);
    
    console.log('✅ Todas las tarjetas eliminadas');
    storageEvents.emit("cardsUpdated", []);
    storageEvents.emit("activeCardChanged", null);
  } catch (error) {
    console.error('❌ Error al limpiar tarjetas:', error);
  }
}

/* -------------------------------------------------------
   🔄 Sincronización al cambiar de usuario
--------------------------------------------------------*/

/**
 * Limpia datos locales al cerrar sesión
 */
export async function clearUserData(): Promise<void> {
  try {
    console.log('🧹 Limpiando datos del usuario...');
    
    await Promise.all([
      clearCart(),
      clearFavorites(),
    ]);
    
    console.log('✅ Datos de usuario limpiados');
  } catch (error) {
    console.error('❌ Error al limpiar datos de usuario:', error);
  }
}

/**
 * Recarga los datos cuando cambia el usuario
 */
export async function reloadUserData(): Promise<void> {
  try {
    console.log('🔄 Recargando datos del usuario...');
    
    // Emitir eventos para que los componentes recarguen
    storageEvents.emit("cardsUpdated");
    storageEvents.emit("activeCardChanged");
    storageEvents.emit("cartChanged");
    storageEvents.emit("favoritesChanged");
    
    console.log('✅ Datos de usuario recargados');
  } catch (error) {
    console.error('❌ Error al recargar datos de usuario:', error);
  }
}

/**
 * Actualiza una tarjeta existente
 */
export async function updateCard(cardId: string, updatedData: Partial<Omit<Card, 'id'>>): Promise<Card[]> {
  try {
    if (!cardId || typeof cardId !== 'string') {
      throw new Error('ID de tarjeta inválido');
    }

    const cards = await getCards();
    const cardIndex = cards.findIndex(c => c.id === cardId);
    
    if (cardIndex === -1) {
      throw new Error('Tarjeta no encontrada');
    }

    const updatedCards = cards.map((card, index) => 
      index === cardIndex 
        ? { ...card, ...updatedData }
        : card
    );

    await saveCards(updatedCards);
    console.log('✅ Tarjeta actualizada:', cardId);
    
    return updatedCards;
  } catch (error) {
    console.error('❌ Error al actualizar tarjeta:', error);
    throw error;
  }
}

/* -------------------------------------------------------
   🔹 Exports de tipos
--------------------------------------------------------*/
export type { Item };

