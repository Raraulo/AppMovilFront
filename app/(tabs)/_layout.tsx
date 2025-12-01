import { Ionicons } from "@expo/vector-icons";
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Tabs, usePathname, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getCart, storageEvents } from "../../utils/storage";

// 🎨 TEMA "WHITE CLOTH" (TELA BLANCA)
const ACTIVE_ICON_COLOR = "#FFFFFF"; // Blanco puro
const INACTIVE_ICON_COLOR = "#999999"; // Gris elegante
const ACTIVE_PILL_COLOR = "#1C1C1E"; // Negro suave (Estilo iOS)
const BADGE_COLOR = "#FF3B30"; 

/* -------------------------------------------------------
    🪄 Componente Especial: LUPA AI (Custom Icon)
--------------------------------------------------------*/
const AiSearchIcon = ({ color, size }: { color: string, size: number }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    {/* La Lupa base */}
    <Ionicons name="search" size={size} color={color} style={{ marginRight: 2, marginBottom: 2 }} />
    
    {/* Las "Chispas AI" superpuestas */}
    <Ionicons 
      name="sparkles" 
      size={size * 0.45} 
      color={color} 
      style={{ 
        position: 'absolute', 
        top: -2, 
        right: -4,
        opacity: 0.9
      }} 
    />
  </View>
);

/* -------------------------------------------------------
    ⚡ TabItem Ultra-Fluido
--------------------------------------------------------*/
function TabItem({ route, index, state, navigation, cartCount, isAiButton }: any) {
  const router = useRouter();
  const pathname = usePathname();
  
  const isFocused = isAiButton 
    ? pathname.includes('/ia/giulia')
    : state.index === index;
    
  // Animaciones rápidas ("Snappy")
  const scale = useRef(new Animated.Value(isFocused ? 1 : 1)).current;
  const translateY = useRef(new Animated.Value(isFocused ? 0 : 0)).current;
  const pillOpacity = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    const springConfig = { friction: 14, tension: 180, useNativeDriver: true };
    const timingConfig = { duration: 200, useNativeDriver: true };

    Animated.parallel([
      Animated.spring(scale, { toValue: isFocused ? 1.05 : 1, ...springConfig }),
      Animated.spring(translateY, { toValue: isFocused ? -2 : 0, ...springConfig }),
      Animated.timing(pillOpacity, { toValue: isFocused ? 1 : 0, ...timingConfig }),
    ]).start();
  }, [isFocused]);

  const onPress = () => {
    if (Platform.OS === 'ios') Haptics.selectionAsync(); // Feedback sutil

    if (isAiButton) {
      router.push("/(tabs)/ia/giulia");
      return;
    }

    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (route.name === "index") {
      isFocused ? navigation.emit({ type: "scrollToTop" }) : navigation.navigate("(tabs)", { screen: "index" });
      return;
    }

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  // Selección de Íconos
  let iconRender;
  
  if (isAiButton) {
    // 🔥 AQUÍ USAMOS TU LUPA AI PERSONALIZADA
    iconRender = <AiSearchIcon color={isFocused ? ACTIVE_ICON_COLOR : INACTIVE_ICON_COLOR} size={26} />;
  } else {
    let iconName: any = "";
    if (route.name === "index") iconName = isFocused ? "home" : "home-outline";
    else if (route.name === "favoritos/index") iconName = isFocused ? "heart" : "heart-outline";
    else if (route.name === "carrito/index") iconName = isFocused ? "bag-handle" : "bag-handle-outline";
    else if (route.name === "profile") iconName = isFocused ? "person" : "person-outline";

    iconRender = (
      <Ionicons
        name={iconName}
        size={26}
        color={isFocused ? ACTIVE_ICON_COLOR : INACTIVE_ICON_COLOR}
      />
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={styles.tabItem}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Animated.View style={[styles.tabItemContent, { transform: [{ scale }, { translateY }] }]}>
        
        {/* ⚫ Pastilla Negra (Fondo del ícono activo) */}
        <Animated.View style={[styles.activePill, { opacity: pillOpacity }]} />

        {/* 🖼️ El Ícono */}
        <View style={styles.iconWrapper}>
          {iconRender}

          {/* Badge Carrito */}
          {route?.name === "carrito/index" && cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount > 9 ? "9+" : cartCount}</Text>
            </View>
          )}
        </View>

      </Animated.View>
    </Pressable>
  );
}

/* -------------------------------------------------------
    ☁️ FancyTabBar — Efecto Tela (Glassmorphism Light)
--------------------------------------------------------*/
export function FancyTabBar({ state, navigation, cartCount: externalCartCount }: any) {
  const insets = useSafeAreaInsets();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const loadCart = async () => {
      try { const c = await getCart(); setCartCount(c.length); } catch { setCartCount(0); }
    };
    loadCart();
    storageEvents.on("cartChanged", loadCart);
    return () => storageEvents.off("cartChanged", loadCart);
  }, [externalCartCount]);

  const routesToRender = useMemo(() => 
    state.routes.filter((route: any) => 
      !["facturas", "mistarjetas", "top", "ia"].some(ex => route.name.includes(ex))
    ), [state.routes]);

  return (
    <View style={[styles.barContainer, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      
      {/* 🌫️ EFECTO TELA BLANCA */}
      {Platform.OS === 'ios' ? (
        <BlurView intensity={95} tint="systemThickMaterialLight" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={styles.androidClothBg} />
      )}

      {/* Borde superior imperceptible */}
      <View style={styles.hairlineBorder} />

      <View style={styles.tabsRow}>
        {routesToRender.map((route: any) => {
           const originalIndex = state.routes.indexOf(route);
           return (
             <React.Fragment key={route.key}>
               <TabItem 
                 route={route} 
                 index={originalIndex} 
                 state={state} 
                 navigation={navigation} 
                 cartCount={cartCount} 
               />
               {/* Insertamos la IA (Giulia) después del Home */}
               {route.name === "index" && (
                 <TabItem 
                    route={{}} 
                    index={-1} 
                    state={state} 
                    navigation={navigation} 
                    isAiButton={true} 
                 />
               )}
             </React.Fragment>
           );
        })}
      </View>
    </View>
  );
}

/* -------------------------------------------------------
    🧭 Layout Principal
--------------------------------------------------------*/
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        animation: 'none', 
        sceneStyle: { backgroundColor: '#FFFFFF' },
      }}
      tabBar={(props) => <FancyTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="ia" options={{ href: null }} />
      <Tabs.Screen name="favoritos/index" />
      <Tabs.Screen name="carrito/index" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

/* -------------------------------------------------------
    🎨 Estilos "White Cloth"
--------------------------------------------------------*/
const styles = StyleSheet.create({
  barContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 86 : 68,
    // Sombra muy difusa para efecto flotante
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
    backgroundColor: 'transparent',
  },
  androidClothBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 0.5,
    borderTopColor: '#E0E0E0',
  },
  hairlineBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)', // Separación mínima
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: '100%',
  },
  tabItemContent: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  activePill: {
    position: 'absolute',
    width: 56, // Un poco más ancha
    height: 40, // Ovalada
    borderRadius: 20,
    backgroundColor: ACTIVE_PILL_COLOR, // Negro
    marginTop: 4, // Centrado visual
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  iconWrapper: {
    marginTop: 4, // Ajuste para centrar dentro de la pastilla
    zIndex: 2,
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: BADGE_COLOR,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF", 
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});
