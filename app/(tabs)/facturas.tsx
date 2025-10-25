import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 🧾 Facturas "quemadas" con imágenes (URLs) y detalles completos
const FACTURAS = [
  {
    id: 1,
    numero: "#CA-2025-001",
    marca: "Yves Saint Laurent",
    nombre: "MYSLF",
    tipo: "Eau de Parfum 100ml",
    direccion: "Av. Colón 123, Quito",
    fecha_compra: "15/10/2025",
    fecha_entrega_tentativa: "18/10/2025",
    metodo_pago: "Tarjeta Crédito (**** 4242)",
    estado: "Entregado",
    total: "$89.99",
    imagen: "https://i1.perfumesclub.com/grandewp/198560-2.webp",
  },
  {
    id: 2,
    numero: "#NA-2025-002",
    marca: "Dior",
    nombre: "Sauvage",
    tipo: "Eau de Toilette 50ml",
    direccion: "Calle Bolívar 567, Guayaquil",
    fecha_compra: "22/10/2025",
    fecha_entrega_tentativa: "25/10/2025",
    metodo_pago: "Pago contra entrega",
    estado: "Pendiente",
    total: "$59.99",
    imagen:
      "https://www.dior.com/dw/image/v2/BGXS_PRD/on/demandware.static/-/Sites-master_dior/default/dwb57d0b59/Y0685240/Y0685240_F068524009_E01_GHC.jpg?sw=1850&sh=1850",
  },
  {
    id: 3,
    numero: "#NR-2025-003",
    marca: "Carolina Herrera",
    nombre: "Good Girl",
    tipo: "Eau de Parfum 100ml",
    direccion: "Av. Amazonas 789, Cuenca",
    fecha_compra: "10/10/2025",
    fecha_entrega_tentativa: "—",
    metodo_pago: "Tarjeta Débito (**** 1234)",
    estado: "Cancelado",
    total: "$99.99",
    imagen:
      "https://fontanapharmacy.com/product_images/u/856/Untitled_design_-_2024-11-20T153027.410__71518_zoom.png",
  },
];

export default function FacturasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isLogged, setIsLogged] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  // Verifica si hay sesión activa
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const user = await AsyncStorage.getItem("user");
        setIsLogged(!!user);
      } catch {
        setIsLogged(false);
      }
    };
    checkLogin();
  }, []);

  const getEstadoStyle = (estado: string) => {
    switch (estado) {
      case "Entregado":
        return { color: "#10B981", icon: "checkmark-circle-outline" };
      case "Pendiente":
        return { color: "#FACC15", icon: "time-outline" };
      case "Cancelado":
        return { color: "#EF4444", icon: "close-circle-outline" };
      default:
        return { color: "#6B7280", icon: "help-circle-outline" };
    }
  };

  // 🔒 Si NO está logueado
  if (!isLogged) {
    return (
      <View style={styles.notLoggedContainer}>
        <Ionicons name="lock-closed-outline" size={90} color="#4B5563" />
        <Text style={styles.notLoggedTitle}>Acceso Restringido</Text>
        <Text style={styles.notLoggedText}>
          Debes iniciar sesión para ver tus facturas.
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.replace("/(auth)/login")}
        >
          <Ionicons
            name="log-in-outline"
            size={20}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.loginText}>Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Facturas</Text>
        <View style={{ width: 26 }} />
      </View>

      {selected ? (
        // 📄 Detalle de factura
        <ScrollView
          contentContainerStyle={[
            styles.detailContainer,
            { flexGrow: 1, paddingBottom: insets.bottom + 60 },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="always"
        >
          <View style={styles.detailCard}>
            <Image
              source={require("../../assets/images/logomaison.png")}
              style={styles.logoEmpresa}
              resizeMode="contain"
            />

            <Image
              source={{ uri: selected.imagen }}
              style={styles.imagenProducto}
              resizeMode="cover"
            />

            <View style={styles.detailHeader}>
              <Text style={styles.detailNumero}>{selected.numero}</Text>
              <Text style={styles.detailMarca}>{selected.marca}</Text>
              <Text style={styles.detailTitle}>{selected.nombre}</Text>
              <Text style={styles.detailTipo}>{selected.tipo}</Text>
            </View>

            <View style={styles.seccionTitulo}>
              <Text style={styles.seccionTexto}>Detalles de la compra</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.fieldLabel}>Fecha de compra</Text>
              <Text style={styles.fieldValue}>{selected.fecha_compra}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.fieldLabel}>Fecha tentativa de entrega</Text>
              <Text style={styles.fieldValue}>
                {selected.fecha_entrega_tentativa}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.fieldLabel}>Dirección de entrega</Text>
              <Text style={styles.fieldValue}>{selected.direccion}</Text>
            </View>

            <View style={styles.seccionTitulo}>
              <Text style={styles.seccionTexto}>Pago y estado</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.fieldLabel}>Método de pago</Text>
              <Text style={styles.fieldValue}>{selected.metodo_pago}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.fieldLabel}>Estado</Text>
              <Text
                style={[
                  styles.fieldValue,
                  {
                    color: getEstadoStyle(selected.estado).color,
                    fontWeight: "700",
                  },
                ]}
              >
                {selected.estado}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.fieldLabel}>Total</Text>
              <Text style={[styles.fieldValue, { fontWeight: "700" }]}>
                {selected.total}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelected(null)}
          >
            <Ionicons
              name="arrow-back-circle-outline"
              size={20}
              color="#111827"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.backText}>Volver</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        // 🧾 Lista de facturas
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { flexGrow: 1, paddingBottom: insets.bottom + 80 },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="always"
        >
          {FACTURAS.map((factura) => {
            const estadoStyle = getEstadoStyle(factura.estado);
            return (
              <TouchableOpacity
                key={factura.id}
                style={styles.facturaCard}
                onPress={() => setSelected(factura)}
                activeOpacity={0.85}
              >
                <View style={styles.cardRow}>
                  <Image
                    source={{ uri: factura.imagen }}
                    style={styles.cardImg}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.facturaNumero}>{factura.numero}</Text>
                    <Text style={styles.facturaMarca}>{factura.marca}</Text>
                    <Text style={styles.facturaTitle}>{factura.nombre}</Text>
                    <Text style={styles.facturaTipo}>{factura.tipo}</Text>
                    <Text style={styles.facturaText}>
                      Fecha compra: {factura.fecha_compra}
                    </Text>
                    <Text style={styles.facturaText}>
                      Pago: {factura.metodo_pago}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Ionicons
                      name={estadoStyle.icon as any}
                      size={26}
                      color={estadoStyle.color}
                    />
                    <Text
                      style={[
                        styles.estado,
                        { color: estadoStyle.color, marginTop: 6 },
                      ]}
                    >
                      {factura.estado}
                    </Text>
                    <Text style={styles.total}>{factura.total}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

// 🎨 Estilos
const styles = StyleSheet.create({
  notLoggedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 30,
  },
  notLoggedTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginTop: 12,
  },
  notLoggedText: {
    fontSize: 16,
    color: "#4B5563",
    textAlign: "center",
    marginVertical: 12,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    marginTop: 10,
  },
  loginText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },

  container: { padding: 20 },
  facturaCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  cardRow: { flexDirection: "row", alignItems: "center" },
  cardImg: { width: 64, height: 64, borderRadius: 10 },
  facturaNumero: { fontSize: 12, color: "#6B7280", fontWeight: "600" },
  facturaMarca: { fontSize: 13, color: "#9CA3AF", fontWeight: "600" },
  facturaTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  facturaTipo: { fontSize: 13, color: "#6B7280", marginBottom: 6 },
  facturaText: { fontSize: 13, color: "#4B5563", marginTop: 2 },
  estado: { fontSize: 13, fontWeight: "700" },
  total: { fontSize: 14, fontWeight: "700", color: "#111827", marginTop: 8 },

  detailContainer: { padding: 20, alignItems: "center" },
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  logoEmpresa: { width: 140, height: 50, alignSelf: "center", marginBottom: 16 },
  imagenProducto: { width: "100%", height: 220, borderRadius: 10, marginBottom: 16 },
  detailHeader: { alignItems: "center", marginBottom: 18 },
  detailNumero: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  detailMarca: { fontSize: 15, color: "#9CA3AF", fontWeight: "600", marginTop: 4 },
  detailTitle: { fontSize: 20, fontWeight: "800", color: "#111827", marginTop: 2 },
  detailTipo: { fontSize: 14, color: "#4B5563", marginTop: 2 },
  seccionTitulo: { marginTop: 18, marginBottom: 6 },
  seccionTexto: { fontSize: 15, fontWeight: "700", color: "#111827" },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
  },
  fieldLabel: { fontSize: 14, color: "#6B7280", fontWeight: "600" },
  fieldValue: { fontSize: 14, color: "#111827", maxWidth: "60%", textAlign: "right" },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E5E7EB",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    marginTop: 22,
  },
  backText: { color: "#111827", fontSize: 15, fontWeight: "700" },
});
