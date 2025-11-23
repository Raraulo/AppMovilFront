import { Ionicons } from "@expo/vector-icons";
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getCart, storageEvents } from "../../utils/storage";

// 🎨 Definiciones de color y tamaño
const ICON_SIZE = 28;
const ICON_COLOR = "#000000";
const ICON_COLOR_INACTIVE = "#999999";
const BADGE_COLOR = "#FF3B5C";

/* -------------------------------------------------------
    🧩 Subcomponente TabItem (ultra mejorado)
--------------------------------------------------------*/
function TabItem({ route, index, state, navigation, cartCount }: any) {
  const isFocused = state.index === index;
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(isFocused ? 1 : 0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: isFocused ? 1.15 : 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: isFocused ? -4 : 0,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacity, {
        toValue: isFocused ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(iconOpacity, {
        toValue: isFocused ? 1 : 0.6,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused]);

  const onPress = () => {
    // ✨ VIBRACIÓN AL PRESIONAR
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (route.name === "index") {
      if (isFocused) {
        navigation.emit({ type: "scrollToTop" });
      } else {
        navigation.navigate("(tabs)", { screen: "index" });
      }
      return;
    }

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  let iconName = "";
  let iconNameOutline = "";

  if (route.name === "index") {
    iconName = "home";
    iconNameOutline = "home-outline";
  } else if (route.name === "favoritos/index") {
    iconName = "heart";
    iconNameOutline = "heart-outline";
  } else if (route.name === "carrito/index") {
    iconName = "bag-handle";
    iconNameOutline = "bag-handle-outline";
  } else if (route.name === "profile") {
    iconName = "person";
    iconNameOutline = "person-outline";
  }

  return (
    <Pressable
      key={route.key}
      onPress={onPress}
      style={styles.tabItem}
    >
      <Animated.View
        style={[
          styles.tabItemContent,
          {
            transform: [{ scale }, { translateY }],
          },
        ]}
      >
        {/* Resplandor de fondo OVALADO */}
        {isFocused && (
          <Animated.View
            style={[
              styles.glowBackground,
              {
                opacity: glowOpacity,
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.08)', 'transparent']}
              style={styles.glowGradient}
            />
          </Animated.View>
        )}

        {/* Indicador superior */}
        {isFocused && (
          <Animated.View
            style={[
              styles.activeIndicator,
              {
                opacity: glowOpacity,
              },
            ]}
          />
        )}

        {/* Ícono con contador */}
        <Animated.View style={{ opacity: iconOpacity }}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={isFocused ? iconName : iconNameOutline}
              size={ICON_SIZE}
              color={isFocused ? ICON_COLOR : ICON_COLOR_INACTIVE}
            />
            {route.name === "carrito/index" && cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartCount > 9 ? "9+" : cartCount}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

/* -------------------------------------------------------
    🌑 FancyTabBar — diseño extremo premium
--------------------------------------------------------*/
export function FancyTabBar({ state, navigation, cartCount: externalCartCount }: any) {
  const insets = useSafeAreaInsets();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const loadCart = async () => {
      try {
        const cart = await getCart();
        setCartCount(cart.length);
      } catch {
        setCartCount(0);
      }
    };

    loadCart();

    const onCartChange = () => loadCart();
    storageEvents.on("cartChanged", onCartChange);

    return () => {
      storageEvents.off("cartChanged", onCartChange);
    };
  }, [externalCartCount]);

  return (
    <View
      style={[
        styles.fixedBarContainer,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          height: Platform.OS === "ios" ? 90 : 70,
        },
      ]}
    >
      {/* Blur effect para iOS */}
      {Platform.OS === 'ios' ? (
        <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={styles.androidBlur} />
      )}

      {/* Borde superior con gradiente */}
      <LinearGradient
        colors={['rgba(0,0,0,0.08)', 'transparent']}
        style={styles.topBorder}
      />

      {/* Contenedor de tabs */}
      <View style={styles.tabBarContainer}>
        {state.routes.map((route: any, index: number) => {
          if (route.name.includes("facturas") || route.name.includes("mistarjetas") || route.name === "top") return null;
          return (
            <TabItem
              key={route.key}
              route={route}
              index={index}
              state={state}
              navigation={navigation}
              cartCount={cartCount}
            />
          );
        })}
      </View>
    </View>
  );
}

/* -------------------------------------------------------
    🧭 Tabs Layout principal
--------------------------------------------------------*/
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
      tabBar={(props) => <FancyTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="favoritos/index" />
      <Tabs.Screen name="carrito/index" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

/* -------------------------------------------------------
    🎨 Estilos Premium
--------------------------------------------------------*/
const styles = StyleSheet.create({
  fixedBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.8)' : '#ffffff',
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: -8 },
    shadowRadius: 20,
    elevation: 12,
    zIndex: 999,
    overflow: 'hidden',
  },
  androidBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  tabBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabItemContent: {
    alignItems: "center",
    justifyContent: "center",
    position: 'relative',
  },
  glowBackground: {
    position: 'absolute',
    width: 80,        // ⬅️ MÁS ANCHO (era 60)
    height: 50,       // ⬅️ MÁS BAJO (era 60)
    borderRadius: 25, // ⬅️ Ajustado para la forma ovalada
  },
  glowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 25,  // ⬅️ Igual que el padre
  },
  activeIndicator: {
    position: 'absolute',
    top: -12,
    width: 32,
    height: 3,
    backgroundColor: '#000',
    borderRadius: 2,
  },
  iconContainer: {
    position: 'relative',
    padding: 8,
  },
  cartBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: BADGE_COLOR,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: BADGE_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: -0.5,
  },
});
