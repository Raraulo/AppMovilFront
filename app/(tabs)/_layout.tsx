import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * TabBar personalizada y elegante (flotante + sombra + bordes)
 */
function FancyTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.fabWrapper,
        { paddingBottom: Math.max(insets.bottom - 6, 6) },
      ]}
    >
      <View style={styles.tabBarContainer}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          // Animación sutil del icono activo
          const scale = React.useRef(
            new Animated.Value(isFocused ? 1.1 : 1)
          ).current;
          React.useEffect(() => {
            Animated.timing(scale, {
              toValue: isFocused ? 1.12 : 1,
              duration: 160,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }).start();
          }, [isFocused]);

          const color = isFocused ? "#121212" : "#8e8e93";
          const size = 23;

          let icon = null;
          if (route.name === "index") {
            icon = (
              <Ionicons
                name={isFocused ? "home" : "home-outline"}
                size={size}
                color={color}
              />
            );
          } else if (route.name === "top") {
            icon = (
              <FontAwesome name="line-chart" size={size} color={color} />
            );
          } else if (route.name === "profile") {
            icon = (
              <Ionicons
                name={isFocused ? "person" : "person-outline"}
                size={size}
                color={color}
              />
            );
          } else {
            // cualquier otra ruta (como facturas) no tendrá icono en el tab bar
            return null;
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [
                styles.tabItem,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Animated.View style={{ transform: [{ scale }] }}>
                {icon}
              </Animated.View>
              <View style={styles.indicatorBox}>
                <View
                  style={[
                    styles.indicatorDot,
                    { opacity: isFocused ? 1 : 0 },
                  ]}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
      tabBar={(props) => <FancyTabBar {...props} />}
    >
      {/* 🏠 Inicio */}
      <Tabs.Screen name="index" />

      {/* 📊 Top */}
      <Tabs.Screen name="top" />

      {/* 👤 Perfil */}
      <Tabs.Screen name="profile" />

      {/* 🔒 Facturas (oculta en el tab bar) */}
      <Tabs.Screen
        name="facturas"
        options={{
          href: null, // 👉 esto oculta la pestaña del tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 6,
    alignItems: "center",
  },
  tabBarContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: Platform.OS === "ios" ? StyleSheet.hairlineWidth : 0,
    borderColor: "#E9E9EB",
    minWidth: 230,
    maxWidth: 460,
    width: "90%",
    justifyContent: "space-between",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 64,
  },
  indicatorBox: {
    height: 8,
    marginTop: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  indicatorDot: {
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#121212",
  },
});
