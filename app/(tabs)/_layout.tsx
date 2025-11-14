import { Ionicons } from "@expo/vector-icons";
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
const ICON_SIZE = 26; // ⬆️ Íconos más grandes
const ICON_COLOR = "#000000"; // 🖤 Íconos negros
const BADGE_COLOR = "#ff3b5c"; // Color del badge

/* -------------------------------------------------------
    🧩 Subcomponente TabItem (solo íconos animados)
--------------------------------------------------------*/
function TabItem({ route, index, state, navigation, cartCount }: any) {
  const isFocused = state.index === index;
  const scale = useRef(new Animated.Value(isFocused ? 1.15 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: isFocused ? 1.15 : 1,
      friction: 7,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [isFocused]);

  const onPress = () => {
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

  let icon = null;

  if (route.name === "index") {
    icon = (
      <Ionicons
        name={isFocused ? "home" : "home-outline"}
        size={ICON_SIZE}
        color={ICON_COLOR}
      />
    );
  } else if (route.name === "favoritos/index") {
    icon = (
      <Ionicons
        name={isFocused ? "heart" : "heart-outline"}
        size={ICON_SIZE}
        color={ICON_COLOR}
      />
    );
  } else if (route.name === "carrito/index") {
    icon = (
      <View>
        <Ionicons
          name={isFocused ? "basket" : "basket-outline"}
          size={ICON_SIZE}
          color={ICON_COLOR}
        />
        {cartCount > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>
              {cartCount > 9 ? "9+" : cartCount}
            </Text>
          </View>
        )}
      </View>
    );
  } else if (route.name === "profile") {
    icon = (
      <Ionicons
        name={isFocused ? "person" : "person-outline"}
        size={ICON_SIZE}
        color={ICON_COLOR}
      />
    );
  }

  return (
    <Pressable
      key={route.key}
      onPress={onPress}
      style={({ pressed }) => [styles.tabItem, pressed && { opacity: 0.85 }]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>{icon}</Animated.View>
    </Pressable>
  );
}

/* -------------------------------------------------------
    🌑 FancyTabBar — barra inferior personalizada
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
          paddingBottom: Math.max(insets.bottom, 10),
          // 📱 Solo iOS: subir un poco la barra
          height: Platform.OS === "ios" ? 80 : 65,
        },
      ]}
    >
      <View style={styles.tabBarContainer}>
        {state.routes.map((route: any, index: number) => {
          if (route.name.includes("facturas") || route.name === "top") return null;
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
    🎨 Estilos
--------------------------------------------------------*/
const styles = StyleSheet.create({
  fixedBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff", // Fondo blanco
    borderTopWidth: 0,
    shadowColor: "rgba(14, 1, 31, 1)",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 10,
    elevation: 8,
  },
  tabBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    flex: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  cartBadge: {
    position: "absolute",
    top: -5,
    right: -8,
    backgroundColor: BADGE_COLOR,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
  },
});
